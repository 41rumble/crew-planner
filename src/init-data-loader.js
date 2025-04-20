/**
 * Initialization data loader for the crew planning tool
 * Loads the initial data from a JSON file
 */

import { defaultPhaseColors } from './phaseColors';

/**
 * Load initialization data from a JSON file
 * @returns {Promise<Object>} - The initialization data
 */
export async function loadInitData() {
  try {
    const response = await fetch('/init-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load initialization data: ${response.status} ${response.statusText}`);
    }
    
    const initData = await response.json();
    
    // Generate crew matrix based on department data
    initData.crewMatrix = generateCrewMatrix(initData.departments, initData.months.length);
    
    return initData;
  } catch (error) {
    console.error('Error loading initialization data:', error);
    // Return fallback data in case of error
    return getFallbackData();
  }
}

/**
 * Generate crew matrix based on department data
 * @param {Array} departments - The departments data
 * @param {number} monthsCount - The number of months
 * @returns {Array} - The crew matrix
 */
function generateCrewMatrix(departments, monthsCount) {
  return departments.map(dept => {
    const { startMonth, endMonth, maxCrew, rampUpDuration, rampDownDuration } = dept;
    const crewArray = new Array(monthsCount).fill(0);
    
    // Calculate the plateau duration (full crew period)
    const plateauStart = startMonth + rampUpDuration;
    const plateauEnd = endMonth - rampDownDuration;
    
    // Apply ramp up
    for (let i = 0; i < rampUpDuration; i++) {
      const month = startMonth + i;
      const crewSize = Math.round((i + 1) * maxCrew / rampUpDuration);
      crewArray[month] = crewSize;
    }
    
    // Apply plateau (full crew)
    for (let month = plateauStart; month <= plateauEnd; month++) {
      crewArray[month] = maxCrew;
    }
    
    // Apply ramp down
    for (let i = 0; i < rampDownDuration; i++) {
      const month = plateauEnd + 1 + i;
      const crewSize = Math.round(maxCrew * (rampDownDuration - i - 1) / rampDownDuration);
      crewArray[month] = crewSize;
    }
    
    return crewArray;
  });
}

/**
 * Get fallback data in case the initialization data cannot be loaded
 * @returns {Object} - The fallback data
 */
function getFallbackData() {
  // Basic fallback data with minimal structure
  const years = [1, 2, 3, 4];
  const months = [];
  
  // Generate month names
  for (let year = 1; year <= 4; year++) {
    for (let month = 0; month < 12; month++) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push(`${monthNames[month]} Y${year}`);
    }
  }
  
  // Basic phases
  const phases = [
    {
      name: 'Concept Stage',
      startMonth: 0,
      endMonth: 15,
      color: defaultPhaseColors[0]
    },
    {
      name: 'Production Stage',
      startMonth: 12,
      endMonth: 36,
      color: defaultPhaseColors[1]
    }
  ];
  
  // Basic departments
  const departments = [
    {
      name: 'Supervision',
      maxCrew: 1,
      startMonth: 0,
      endMonth: 36,
      rampUpDuration: 0,
      rampDownDuration: 0,
      rate: 12000
    },
    {
      name: 'Artists',
      maxCrew: 10,
      startMonth: 3,
      endMonth: 33,
      rampUpDuration: 3,
      rampDownDuration: 3,
      rate: 8000
    }
  ];
  
  // Generate crew matrix
  const crewMatrix = generateCrewMatrix(departments, months.length);
  
  return {
    years,
    months,
    phases,
    departments,
    crewMatrix
  };
}