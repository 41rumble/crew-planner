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
    console.log('Parsing CSV string:', csvString.substring(0, 100) + '...');
    
    // Split the CSV into lines (handle different line endings)
    const lines = csvString.trim().split(/\r?\n/);
    console.log('Number of lines:', lines.length);
    
    // Extract header information (years and months)
    const yearLine = lines[0];
    const monthLine = lines[1];
    
    console.log('Year line:', yearLine);
    console.log('Month line:', monthLine);
    
    // Parse years from the header
    const yearCells = yearLine.split(',');
    const years = [];
    
    // Extract years directly from the header
    for (let i = 1; i < yearCells.length; i++) {
      const cell = yearCells[i].trim();
      if (cell && !isNaN(parseInt(cell))) {
        const year = parseInt(cell);
        if (!years.includes(year)) {
          years.push(year);
        }
      }
    }
    
    console.log('Extracted years:', years);
    
    // Extract months from the header
    const monthCells = monthLine.split(',');
    const months = [];
    
    // Map of month abbreviations to full names
    const monthMap = {
      'Jan': 'January',
      'Fed': 'February', // Handle typo in your CSV
      'Feb': 'February',
      'Mar': 'March',
      'Apr': 'April',
      'May': 'May',
      'Jun': 'June',
      'Jul': 'July',
      'Aug': 'August',
      'Sep': 'September',
      'Oct': 'October',
      'Nov': 'November',
      'Dec': 'December'
    };
    
    // Extract months and years
    let currentYearIndex = 0;
    let currentYear = years[currentYearIndex];
    
    for (let i = 1; i < monthCells.length; i++) {
      const monthName = monthCells[i].trim();
      
      if (monthName) {
        // Check if we need to move to the next year
        if (monthName === 'Jan' && i > 1 && monthCells[i-1] && monthCells[i-1].trim() === 'Dec') {
          currentYearIndex++;
          if (currentYearIndex < years.length) {
            currentYear = years[currentYearIndex];
          }
        }
        
        // Create the month string
        const fullMonthName = monthMap[monthName] || monthName;
        months.push(`${monthName} ${currentYear}`);
      }
    }
    
    console.log('Extracted months:', months);
    
    // Parse departments and phases
    const departments = [];
    const phases = [];
    let currentPhase = null;
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;
      
      const cells = line.split(',');
      const name = cells[0].trim();
      
      // Skip empty rows
      if (!name) continue;
      
      // Check if this is a phase header (ends with a colon or contains "Phase" or "Stage")
      if (name.endsWith(':') || name.includes('Phase') || name.includes('Stage')) {
        console.log('Found phase:', name);
        const phaseName = name.endsWith(':') ? name.substring(0, name.length - 1) : name;
        
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
        console.log('Processing department:', name);
        
        // Skip rows that are just separators (like "Supervision:" with no crew counts)
        let hasCrewCounts = false;
        for (let j = 1; j < cells.length; j++) {
          if (cells[j] && cells[j].trim() !== '' && !isNaN(parseInt(cells[j]))) {
            hasCrewCounts = true;
            break;
          }
        }
        
        if (!hasCrewCounts) {
          console.log('Skipping row with no crew counts:', name);
          continue;
        }
        
        const crewCounts = [];
        let rate = 8000; // Default rate
        
        // Process crew counts and rate
        for (let j = 1; j < cells.length; j++) {
          // Check if this is the rate column (last column)
          if (j === cells.length - 1 && !isNaN(parseInt(cells[j]))) {
            rate = parseInt(cells[j]);
          } else {
            const value = cells[j] && cells[j].trim() !== '' ? parseInt(cells[j]) : 0;
            crewCounts.push(isNaN(value) ? 0 : value);
          }
        }
        
        console.log('Crew counts for', name, ':', crewCounts.slice(0, 5), '...', 'length:', crewCounts.length);
        
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
        
        // If no non-zero values were found, skip this department
        if (startMonth === 0 && endMonth === crewCounts.length - 1 && crewCounts[startMonth] === 0) {
          console.log('Skipping department with all zeros:', name);
          continue;
        }
        
        // Find max crew size
        const maxCrew = Math.max(...crewCounts);
        if (maxCrew === 0) {
          console.log('Skipping department with max crew 0:', name);
          continue;
        }
        
        console.log('Department', name, 'has max crew:', maxCrew, 'start:', startMonth, 'end:', endMonth);
        
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
        
        console.log('Added department:', name, 'with maxCrew:', maxCrew, 'rate:', rate);
      }
    }
    
    // Extract unique years from months
    const uniqueYears = [...new Set(months.map(month => parseInt(month.split(' ')[1])))];
    
    // Debug the parsed data
    console.log('Parsed years:', uniqueYears);
    console.log('Parsed months:', months);
    console.log('Parsed departments:', departments);
    console.log('Parsed phases:', phases);
    
    // Store the original crew counts from the CSV
    const originalCrewCounts = [];
    
    // Re-parse the CSV to extract the actual crew counts for each department
    let currentDeptIndex = -1;
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;
      
      const cells = line.split(',');
      const name = cells[0].trim();
      
      // Skip empty rows
      if (!name) continue;
      
      // Skip phase headers
      if (name.endsWith(':') || name.includes('Phase') || name.includes('Stage')) {
        continue;
      }
      
      // Check if this is a department row with crew counts
      let hasCrewCounts = false;
      for (let j = 1; j < cells.length; j++) {
        if (cells[j] && cells[j].trim() !== '' && !isNaN(parseInt(cells[j]))) {
          hasCrewCounts = true;
          break;
        }
      }
      
      if (!hasCrewCounts) continue;
      
      // This is a department with crew counts
      currentDeptIndex++;
      
      // Skip if we've already processed all departments
      if (currentDeptIndex >= departments.length) continue;
      
      // Extract crew counts
      const crewCounts = [];
      for (let j = 1; j < cells.length - 1; j++) { // Skip the last column (rate)
        const value = cells[j] && cells[j].trim() !== '' ? parseInt(cells[j]) : 0;
        crewCounts.push(isNaN(value) ? 0 : value);
      }
      
      // Trim or pad the crew counts to match the number of months
      if (crewCounts.length > months.length) {
        crewCounts.length = months.length;
      } else if (crewCounts.length < months.length) {
        while (crewCounts.length < months.length) {
          crewCounts.push(0);
        }
      }
      
      originalCrewCounts.push(crewCounts);
    }
    
    console.log('Original crew counts:', originalCrewCounts.length);
    console.log('Departments:', departments.length);
    
    // Generate crew matrix using the original crew counts
    const crewMatrix = departments.map((dept, index) => {
      // If we have original crew counts for this department, use them
      if (index < originalCrewCounts.length) {
        console.log('Using original crew counts for', dept.name);
        return originalCrewCounts[index];
      }
      
      // Otherwise, generate crew counts based on the department parameters
      console.log('Generating crew counts for', dept.name);
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
    });
    
    console.log('Generated crew matrix:', crewMatrix);
    
    return {
      years: uniqueYears,
      months,
      departments,
      phases,
      crewMatrix
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