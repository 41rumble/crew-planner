/**
 * Parser for the crew planning data in CSV format
 */

/**
 * Parse the CSV-like data into a structured format
 * @param {string} csvData - The raw CSV data
 * @returns {Object} - Structured data with years, departments, and crew counts
 */
export function parseCrewData(csvData) {
  console.log("Starting to parse crew data");
  
  // Split the data into lines
  const lines = csvData.trim().split('\n');
  console.log(`Found ${lines.length} lines in the data`);
  
  // Extract years from the first line
  const yearLine = lines[0].trim();
  console.log("Year line:", yearLine);
  
  const years = [];
  const yearMatches = yearLine.match(/\d{4}/g);
  if (yearMatches) {
    years.push(...yearMatches);
    console.log("Found years:", years);
  } else {
    console.error("No years found in the data");
  }
  
  // Extract months from the second line
  const monthLine = lines[1].trim();
  const months = monthLine.split(',').map(m => m.trim()).filter(m => m.length > 0);
  
  // Create the full timeline of month-year combinations
  const timeline = [];
  years.forEach(year => {
    months.forEach(month => {
      timeline.push(`${month} ${year}`);
    });
  });
  
  // Process department data
  const departments = [];
  const phases = [];
  
  let currentPhase = null;
  
  // Start from line 4 (skipping header lines)
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',').map(p => p.trim());
    const name = parts[0];
    
    // Skip empty lines or separator lines
    if (!name || name === '') continue;
    
    // Check if this is a phase header
    if (name.endsWith(':')) {
      currentPhase = {
        name: name.substring(0, name.length - 1),
        startMonth: 0,
        endMonth: timeline.length - 1
      };
      
      // Find the first and last non-empty month to set start/end
      for (let j = 1; j < parts.length; j++) {
        if (parts[j] && parts[j] !== '') {
          currentPhase.startMonth = j - 1;
          break;
        }
      }
      
      for (let j = parts.length - 1; j >= 1; j--) {
        if (parts[j] && parts[j] !== '') {
          currentPhase.endMonth = j - 1;
          break;
        }
      }
      
      phases.push(currentPhase);
      continue;
    }
    
    // This is a department line
    const crewCounts = parts.slice(1).map(p => parseInt(p) || 0);
    
    // Find the first and last non-zero month
    let startMonth = 0;
    let endMonth = crewCounts.length - 1;
    
    for (let j = 0; j < crewCounts.length; j++) {
      if (crewCounts[j] > 0) {
        startMonth = j;
        break;
      }
    }
    
    for (let j = crewCounts.length - 1; j >= 0; j--) {
      if (crewCounts[j] > 0) {
        endMonth = j;
        break;
      }
    }
    
    // Calculate ramp up and down durations
    const maxCrew = Math.max(...crewCounts);
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
    
    // Create the department object
    const department = {
      name,
      maxCrew,
      startMonth,
      endMonth,
      rampUpDuration,
      rampDownDuration,
      rate: 8000, // Default rate
      crewCounts
    };
    
    departments.push(department);
  }
  
  return {
    years: years.map(y => parseInt(y)),
    timeline,
    departments,
    phases
  };
}

/**
 * Convert the parsed data into the format expected by the application
 * @param {Object} parsedData - The data returned by parseCrewData
 * @returns {Object} - Data in the format expected by the application
 */
export function convertToAppFormat(parsedData) {
  console.log("Converting parsed data to app format");
  console.log("Parsed data:", parsedData);
  
  const { years, timeline, departments, phases } = parsedData;
  
  // Convert departments to app format
  const appDepartments = departments.map(dept => ({
    name: dept.name,
    maxCrew: dept.maxCrew,
    startMonth: dept.startMonth,
    endMonth: dept.endMonth,
    rampUpDuration: dept.rampUpDuration,
    rampDownDuration: dept.rampDownDuration,
    rate: dept.rate
  }));
  
  // Convert phases to app format
  const appPhases = phases.map(phase => ({
    name: phase.name,
    startMonth: phase.startMonth,
    endMonth: phase.endMonth
  }));
  
  // Create crew matrix
  const crewMatrix = departments.map(dept => {
    return dept.crewCounts;
  });
  
  return {
    years,
    months: timeline,
    departments: appDepartments,
    phases: appPhases,
    crewMatrix
  };
}