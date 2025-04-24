/**
 * CSV Loader for Budget Builder
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
    
    // If no years were found, use default years
    if (years.length === 0) {
      years.push(2022, 2023, 2024, 2025);
      console.log('No years found in header, using default years:', years);
    }
    
    console.log('Extracted years:', years);
    
    // Extract months from the header
    const monthCells = monthLine.split(',');
    const months = [];
    
    // Map of month abbreviations to standardized abbreviations
    const monthMap = {
      'Jan': 'Jan',
      'Fed': 'Feb', // Correct typo in your CSV
      'Feb': 'Feb',
      'Mar': 'Mar',
      'Apr': 'Apr',
      'May': 'May',
      'Jun': 'Jun',
      'Jul': 'Jul',
      'Aug': 'Aug',
      'Sep': 'Sep',
      'Oct': 'Oct',
      'Nov': 'Nov',
      'Dec': 'Dec'
    };
    
    // If there are no valid month names in the header, create default months
    let hasValidMonths = false;
    for (let i = 1; i < monthCells.length; i++) {
      if (monthCells[i] && monthCells[i].trim() && monthMap[monthCells[i].trim()]) {
        hasValidMonths = true;
        break;
      }
    }
    
    if (!hasValidMonths) {
      console.log('No valid months found in header, using default months');
      // Create default months for all years (using standardized month names)
      const monthNames = Object.values(monthMap).filter((value, index, self) => self.indexOf(value) === index);
      years.forEach(year => {
        monthNames.forEach(month => {
          months.push(`${month} ${year}`);
        });
      });
    } else {
      // Extract months and years from the header
      let currentYearIndex = 0;
      let currentYear = years[currentYearIndex];
      let monthsInCurrentYear = 0;
      
      for (let i = 1; i < monthCells.length; i++) {
        const monthName = monthCells[i].trim();
        
        if (monthName) {
          // Check if we need to move to the next year
          if ((monthName === 'Jan' || monthName === 'January') && 
              monthsInCurrentYear > 0 && 
              currentYearIndex < years.length - 1) {
            currentYearIndex++;
            currentYear = years[currentYearIndex];
            monthsInCurrentYear = 0;
          }
          
          // Create the month string with standardized month name
          const standardizedMonth = monthMap[monthName] || monthName;
          months.push(`${standardizedMonth} ${currentYear}`);
          monthsInCurrentYear++;
        }
      }
    }
    
    console.log('Extracted months:', months);
    
    // Parse departments and phases
    const departments = [];
    const phases = [];
    const itemOrder = []; // Track the exact order of phases and departments as they appear in the CSV
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
        
        // Add the phase to the phases array
        phases.push({
          name: phaseName,
          startMonth,
          endMonth,
          originalIndex: phases.length // Store the index in the phases array
        });
        
        // Track this phase in the item order
        itemOrder.push({ type: 'phase', index: phases.length - 1 });
        
        currentPhase = phases.length - 1;
        console.log(`Added phase ${phaseName} at index ${currentPhase}, item order position ${itemOrder.length - 1}`);
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
        
        // Process crew counts - don't look for rate in the CSV
        for (let j = 1; j < cells.length; j++) {
          const value = cells[j] && cells[j].trim() !== '' ? parseInt(cells[j]) : 0;
          crewCounts.push(isNaN(value) ? 0 : value);
        }
        
        // Use a default rate based on the department name
        if (name.includes('Sup') || name.includes('Director') || name.includes('Lead')) {
          rate = 12000; // Higher rate for supervisors, directors, and leads
        } else if (name.includes('Technical') || name.includes('Developer')) {
          rate = 10000; // Higher rate for technical roles
        } else if (name.includes('Animator') || name.includes('Animation')) {
          rate = 7000; // Rate for animators
        } else if (name.includes('Lighter') || name.includes('Lighting')) {
          rate = 7500; // Rate for lighters
        } else if (name.includes('VFX') || name.includes('Effect')) {
          rate = 8000; // Rate for VFX artists
        } else if (name.includes('Composite') || name.includes('Comp')) {
          rate = 7800; // Rate for compositors
        } else if (name.includes('Modeller') || name.includes('Modeling')) {
          rate = 7500; // Rate for modelers
        } else if (name.includes('Rigger') || name.includes('Rigging')) {
          rate = 8500; // Rate for riggers
        } else if (name.includes('Surfacing') || name.includes('Surface')) {
          rate = 7500; // Rate for surfacing artists
        } else {
          rate = 8000; // Default rate for other roles
        }
        
        // Log the assigned rate
        console.log(`Assigned rate for ${name}: ${rate}`);
        
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
        
        // Add the department to the departments array
        departments.push({
          name,
          maxCrew,
          startMonth,
          endMonth,
          rampUpDuration,
          rampDownDuration,
          rate,
          phase: currentPhase,
          originalIndex: departments.length // Store the index in the departments array
        });
        
        // Track this department in the item order
        itemOrder.push({ type: 'department', index: departments.length - 1 });
        
        console.log('Added department:', name, 'with maxCrew:', maxCrew, 'rate:', rate, 'item order position:', itemOrder.length - 1);
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
      let hasRate = false;
      
      // Process all columns - don't look for rate
      const lastColumnIndex = cells.length;
      for (let j = 1; j < lastColumnIndex; j++) {
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
    let crewMatrix = departments.map((dept, index) => {
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
    
    // Ensure the crew matrix has the correct dimensions
    if (crewMatrix.length !== departments.length) {
      console.error('Crew matrix length does not match departments length!');
      // Reinitialize the crew matrix
      const newCrewMatrix = [];
      for (let i = 0; i < departments.length; i++) {
        newCrewMatrix.push(new Array(months.length).fill(0));
      }
      console.log('Reinitialized crew matrix with correct dimensions');
      
      // Copy data from the original matrix where possible
      for (let i = 0; i < Math.min(crewMatrix.length, departments.length); i++) {
        for (let j = 0; j < Math.min(crewMatrix[i].length, months.length); j++) {
          newCrewMatrix[i][j] = crewMatrix[i][j];
        }
      }
      
      crewMatrix = newCrewMatrix;
    }
    
    // Ensure each row in the crew matrix has the correct length
    for (let i = 0; i < crewMatrix.length; i++) {
      if (crewMatrix[i].length !== months.length) {
        console.error(`Crew matrix row ${i} has incorrect length: ${crewMatrix[i].length} instead of ${months.length}`);
        // Reinitialize this row
        const newRow = new Array(months.length).fill(0);
        // Copy data where possible
        for (let j = 0; j < Math.min(crewMatrix[i].length, months.length); j++) {
          newRow[j] = crewMatrix[i][j];
        }
        crewMatrix[i] = newRow;
      }
    }
    
    return {
      years: uniqueYears,
      months,
      departments,
      phases,
      crewMatrix,
      itemOrder // Include the exact order of items as they appear in the CSV
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