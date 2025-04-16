/**
 * CSV Loader for Crew Planning Tool
 * Handles importing and parsing CSV files to load crew planning data
 */

/**
 * Parse a CSV string into structured data
 * @param {string} csvString - The CSV content as a string
 * @returns {Object} - Structured data with years, departments, phases, and crew counts
 */
export function parseCSV(csvString) {
  try {
    // Split the CSV into lines
    const lines = csvString.trim().split('\n');
    
    // Extract header information (years and months)
    const yearLine = lines[0];
    const monthLine = lines[1];
    
    // Parse years from the header
    const yearCells = yearLine.split(',');
    const years = [];
    let currentYear = null;
    let yearColspan = 0;
    
    // Extract years and their column spans
    for (let i = 1; i < yearCells.length; i++) {
      const cell = yearCells[i].trim();
      if (cell && !isNaN(parseInt(cell))) {
        if (currentYear !== null) {
          years.push({ year: currentYear, colspan: yearColspan });
        }
        currentYear = parseInt(cell);
        yearColspan = 1;
      } else if (currentYear !== null) {
        yearColspan++;
      }
    }
    
    // Add the last year
    if (currentYear !== null) {
      years.push({ year: currentYear, colspan: yearColspan });
    }
    
    // Extract months from the header
    const monthCells = monthLine.split(',');
    const months = [];
    
    for (let i = 1; i < monthCells.length; i++) {
      const monthName = monthCells[i].trim();
      if (monthName) {
        // Determine which year this month belongs to
        let yearIndex = 0;
        let columnCount = 0;
        
        for (const yearInfo of years) {
          if (i - 1 >= columnCount && i - 1 < columnCount + yearInfo.colspan) {
            months.push(`${monthName} ${yearInfo.year}`);
            break;
          }
          columnCount += yearInfo.colspan;
          yearIndex++;
        }
      }
    }
    
    // Parse departments and phases
    const departments = [];
    const phases = [];
    let currentPhase = null;
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells = line.split(',');
      const name = cells[0].trim();
      
      // Skip empty rows
      if (!name) continue;
      
      // Check if this is a phase header (ends with a colon or contains "Phase")
      if (name.endsWith(':') || name.includes('Phase')) {
        const phaseName = name.endsWith(':') ? name.substring(0, name.length - 1) : name.replace(' (Phase)', '');
        
        // Find the start and end months for this phase
        let startMonth = -1;
        let endMonth = -1;
        
        for (let j = 1; j < cells.length; j++) {
          if (cells[j] && cells[j].trim() === 'X') {
            if (startMonth === -1) startMonth = j - 1;
            endMonth = j - 1;
          }
        }
        
        // If no explicit range is found, use the full timeline
        if (startMonth === -1) {
          startMonth = 0;
          endMonth = months.length - 1;
        }
        
        phases.push({
          name: phaseName,
          startMonth,
          endMonth
        });
        
        currentPhase = phases.length - 1;
      } else {
        // This is a department row
        const crewCounts = [];
        let rate = 8000; // Default rate
        
        for (let j = 1; j < cells.length; j++) {
          // Check if this is the rate column (last column)
          if (j === cells.length - 1 && !isNaN(parseInt(cells[j]))) {
            rate = parseInt(cells[j]);
          } else {
            const value = cells[j] ? parseInt(cells[j]) : 0;
            crewCounts.push(isNaN(value) ? 0 : value);
          }
        }
        
        // Find the start and end months
        let startMonth = 0;
        let endMonth = crewCounts.length - 1;
        
        // Find first non-zero value
        for (let j = 0; j < crewCounts.length; j++) {
          if (crewCounts[j] > 0) {
            startMonth = j;
            break;
          }
        }
        
        // Find last non-zero value
        for (let j = crewCounts.length - 1; j >= 0; j--) {
          if (crewCounts[j] > 0) {
            endMonth = j;
            break;
          }
        }
        
        // Find max crew size
        const maxCrew = Math.max(...crewCounts);
        
        // Calculate ramp up and down durations
        let rampUpDuration = 0;
        let rampDownDuration = 0;
        
        // Find ramp up duration (from first non-zero to max)
        for (let j = startMonth; j <= endMonth; j++) {
          if (crewCounts[j] === maxCrew) {
            rampUpDuration = j - startMonth;
            break;
          }
        }
        
        // Find ramp down duration (from last max to end)
        for (let j = endMonth; j >= startMonth; j--) {
          if (crewCounts[j] === maxCrew) {
            rampDownDuration = endMonth - j;
            break;
          }
        }
        
        departments.push({
          name,
          maxCrew,
          startMonth,
          endMonth,
          rampUpDuration,
          rampDownDuration,
          rate,
          phase: currentPhase
        });
      }
    }
    
    // Extract unique years from months
    const uniqueYears = [...new Set(months.map(month => parseInt(month.split(' ')[1])))];
    
    return {
      years: uniqueYears,
      months,
      departments,
      phases,
      crewMatrix: departments.map(dept => {
        const crewArray = new Array(months.length).fill(0);
        
        // Calculate the plateau duration (full crew period)
        const plateauStart = dept.startMonth + dept.rampUpDuration;
        const plateauEnd = dept.endMonth - dept.rampDownDuration;
        
        // Apply ramp up
        for (let i = 0; i < dept.rampUpDuration; i++) {
          const month = dept.startMonth + i;
          if (month < months.length) {
            const crewSize = Math.round((i + 1) * dept.maxCrew / dept.rampUpDuration);
            crewArray[month] = crewSize;
          }
        }
        
        // Apply plateau (full crew)
        for (let month = plateauStart; month <= plateauEnd; month++) {
          if (month < months.length) {
            crewArray[month] = dept.maxCrew;
          }
        }
        
        // Apply ramp down
        for (let i = 0; i < dept.rampDownDuration; i++) {
          const month = plateauEnd + 1 + i;
          if (month < months.length) {
            const crewSize = Math.round(dept.maxCrew * (dept.rampDownDuration - i - 1) / dept.rampDownDuration);
            crewArray[month] = crewSize;
          }
        }
        
        return crewArray;
      })
    };
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV: ' + error.message);
  }
}

/**
 * Generate CSV content from application data
 * @param {Object} appData - The application data
 * @returns {string} - CSV formatted string
 */
export function generateCSV(appData) {
  const { years, months, departments, phases, crewMatrix } = appData;
  let csvContent = '';
  
  // Generate year header row
  csvContent += 'Department,';
  years.forEach(year => {
    const yearMonths = months.filter(month => month.includes(year));
    csvContent += year + ',' + ','.repeat(yearMonths.length - 1);
  });
  csvContent += 'Rate\n';
  
  // Generate month header row
  csvContent += ',';
  months.forEach(month => {
    csvContent += month.split(' ')[0] + ',';
  });
  csvContent += '\n';
  
  // Generate phase and department rows
  phases.forEach(phase => {
    // Add phase header
    csvContent += phase.name + ' (Phase),';
    
    // Add phase indicators
    for (let i = 0; i < months.length; i++) {
      csvContent += (i >= phase.startMonth && i <= phase.endMonth) ? 'X,' : ',';
    }
    csvContent += '\n';
    
    // Add departments that belong to this phase
    departments.forEach((dept, index) => {
      // Check if department belongs to this phase
      if (dept.startMonth >= phase.startMonth && dept.startMonth <= phase.endMonth) {
        csvContent += dept.name + ',';
        
        // Add crew counts
        for (let i = 0; i < months.length; i++) {
          csvContent += (crewMatrix[index][i] || '') + ',';
        }
        csvContent += dept.rate + '\n';
      }
    });
    
    // Add empty line after each phase
    csvContent += '\n';
  });
  
  // Add any remaining departments that don't belong to a phase
  departments.forEach((dept, index) => {
    const belongsToPhase = phases.some(phase => 
      dept.startMonth >= phase.startMonth && dept.startMonth <= phase.endMonth
    );
    
    if (!belongsToPhase) {
      csvContent += dept.name + ',';
      
      // Add crew counts
      for (let i = 0; i < months.length; i++) {
        csvContent += (crewMatrix[index][i] || '') + ',';
      }
      csvContent += dept.rate + '\n';
    }
  });
  
  return csvContent;
}