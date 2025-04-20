/**
 * Initialization data loader for the crew planning tool
 * Loads the initial data from a JSON file
 */

import { defaultPhaseColors } from './phaseColors';
import { facilitiesData as defaultFacilitiesData } from './facilities-data';
import { workstationData as defaultWorkstationData } from './workstation-data';

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
    
    // Remove any crewMatrix from the loaded data to ensure it's generated fresh in the app
    delete initData.crewMatrix;
    
    // Ensure all required properties are present
    ensureRequiredProperties(initData);
    
    return initData;
  } catch (error) {
    console.error('Error loading initialization data:', error);
    // Return fallback data in case of error
    return getFallbackData();
  }
}

/**
 * Ensure all required properties are present in the initialization data
 * @param {Object} initData - The initialization data
 */
function ensureRequiredProperties(initData) {
  // Ensure itemOrder is present
  if (!initData.itemOrder || initData.itemOrder.length === 0) {
    initData.itemOrder = generateDefaultItemOrder(initData.phases, initData.departments);
  }
  
  // Ensure facilitiesData is present
  if (!initData.facilitiesData) {
    initData.facilitiesData = JSON.parse(JSON.stringify(defaultFacilitiesData));
  }
  
  // Ensure workstationData is present
  if (!initData.workstationData) {
    initData.workstationData = JSON.parse(JSON.stringify(defaultWorkstationData));
  }
  
  // Ensure settings are present
  if (initData.facilitiesIncludedInTotals === undefined) {
    initData.facilitiesIncludedInTotals = true;
  }
  
  if (initData.workstationsIncludedInTotals === undefined) {
    initData.workstationsIncludedInTotals = true;
  }
  
  if (initData.backendIncludedInTotals === undefined) {
    initData.backendIncludedInTotals = true;
  }
  
  // Ensure all month values are whole numbers
  ensureWholeNumberMonths(initData);
}

/**
 * Ensure all month values in the initialization data are whole numbers
 * @param {Object} initData - The initialization data
 */
function ensureWholeNumberMonths(initData) {
  // Process phases
  if (initData.phases) {
    initData.phases.forEach(phase => {
      if (phase.startMonth !== undefined) {
        phase.startMonth = Math.round(Number(phase.startMonth));
      }
      if (phase.endMonth !== undefined) {
        phase.endMonth = Math.round(Number(phase.endMonth));
      }
    });
  }
  
  // Process departments
  if (initData.departments) {
    initData.departments.forEach(dept => {
      if (dept.startMonth !== undefined) {
        dept.startMonth = Math.round(Number(dept.startMonth));
      }
      if (dept.endMonth !== undefined) {
        dept.endMonth = Math.round(Number(dept.endMonth));
      }
      if (dept.rampUpDuration !== undefined) {
        dept.rampUpDuration = Math.round(Number(dept.rampUpDuration));
      }
      if (dept.rampDownDuration !== undefined) {
        dept.rampDownDuration = Math.round(Number(dept.rampDownDuration));
      }
    });
  }
  
  // Process workstation data
  if (initData.workstationData && initData.workstationData.departmentAssignments) {
    initData.workstationData.departmentAssignments.forEach(assignment => {
      if (assignment.purchaseMonth !== undefined) {
        assignment.purchaseMonth = Math.round(Number(assignment.purchaseMonth));
      }
    });
  }
  
  // Process backend infrastructure
  if (initData.workstationData && initData.workstationData.backendInfrastructure) {
    initData.workstationData.backendInfrastructure.forEach(category => {
      if (category.items) {
        category.items.forEach(item => {
          if (item.purchaseMonth !== undefined) {
            item.purchaseMonth = Math.round(Number(item.purchaseMonth));
          }
        });
      }
    });
  }
}

/**
 * Generate default item order for phases and departments
 * @param {Array} phases - The phases data
 * @param {Array} departments - The departments data
 * @returns {Array} - The item order
 */
function generateDefaultItemOrder(phases, departments) {
  const itemOrder = [];
  
  // Add phases first
  for (let i = 0; i < phases.length; i++) {
    itemOrder.push({ type: 'phase', index: i });
    
    // Add departments that might belong to this phase
    for (let j = 0; j < departments.length; j++) {
      const dept = departments[j];
      const phase = phases[i];
      
      // Simple heuristic: if department's time range overlaps significantly with phase's time range
      if (dept.startMonth <= phase.endMonth && dept.endMonth >= phase.startMonth) {
        itemOrder.push({ type: 'department', index: j });
      }
    }
  }
  
  return itemOrder;
}

/**
 * Generate crew matrix based on department data
 * @param {Array} departments - The departments data
 * @param {number} monthsCount - The number of months
 * @returns {Array} - The crew matrix
 */
function generateCrewMatrix(departments, monthsCount) {
  return departments.map(dept => {
    // Ensure all values are numbers and whole numbers
    const startMonth = Math.round(Number(dept.startMonth || 0));
    const endMonth = Math.round(Number(dept.endMonth || 0));
    const maxCrew = Math.round(Number(dept.maxCrew || 0));
    const rampUpDuration = Math.round(Number(dept.rampUpDuration || 0));
    const rampDownDuration = Math.round(Number(dept.rampDownDuration || 0));
    
    const crewArray = new Array(monthsCount).fill(0);
    
    // Calculate the plateau duration (full crew period)
    const plateauStart = startMonth + rampUpDuration;
    const plateauEnd = endMonth - rampDownDuration;
    
    // Apply ramp up
    for (let i = 0; i < rampUpDuration; i++) {
      const month = startMonth + i;
      // Ensure crew size is a whole number
      const crewSize = Math.round((i + 1) * maxCrew / rampUpDuration);
      if (month >= 0 && month < crewArray.length) {
        crewArray[month] = crewSize;
      }
    }
    
    // Apply plateau (full crew)
    for (let month = plateauStart; month <= plateauEnd; month++) {
      if (month >= 0 && month < crewArray.length) {
        crewArray[month] = maxCrew;
      }
    }
    
    // Apply ramp down
    for (let i = 0; i < rampDownDuration; i++) {
      const month = plateauEnd + 1 + i;
      // Ensure crew size is a whole number
      const crewSize = Math.round(maxCrew * (rampDownDuration - i - 1) / rampDownDuration);
      if (month >= 0 && month < crewArray.length) {
        crewArray[month] = crewSize;
      }
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
  
  // Generate item order
  const itemOrder = generateDefaultItemOrder(phases, departments);
  
  // Create a complete fallback data object
  return {
    years,
    months,
    phases,
    departments,
    itemOrder,
    facilitiesData: JSON.parse(JSON.stringify(defaultFacilitiesData)),
    workstationData: JSON.parse(JSON.stringify(defaultWorkstationData)),
    facilitiesIncludedInTotals: true,
    workstationsIncludedInTotals: true,
    backendIncludedInTotals: true,
    version: '1.0',
    exportDate: new Date().toISOString()
  };
}