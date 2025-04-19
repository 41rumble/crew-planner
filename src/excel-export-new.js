/**
 * Enhanced Excel export functionality with formatting and styling
 */
import * as XLSX from 'xlsx';

/**
 * Create a formatted Excel workbook from the application data
 * @param {Object} appState - The current application state
 * @returns {Blob} - A Blob containing the Excel file
 */
export function createFormattedExcel(appState) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Add worksheets
  createSummarySheet(workbook, appState);
  createTimelineSheet(workbook, appState);
  createFacilitiesSheet(workbook, appState);
  createHardwareSheet(workbook, appState);
  
  // Generate Excel file as a blob
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Create and return blob
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Create a summary sheet with project overview
 * @param {Object} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createSummarySheet(workbook, appState) {
  // Create data for the summary sheet
  const summaryData = [
    ['Crew Planning Summary'],
    [],
    ['Key Metrics'],
    ['Total Project Cost', formatCurrency(appState.totalProjectCost)],
    ['Peak Monthly Cost', formatCurrency(appState.peakMonthlyCost)],
    ['Peak Crew Size', `${appState.peakCrewSize} crew members`],
    [],
    ['Project Timeline'],
    ['Total Duration', `${appState.months.length} months`],
    [],
    ['Departments'],
    ['Department', 'Max Crew', 'Start Month', 'End Month']
  ];
  
  // Add department data
  appState.departments.forEach(dept => {
    summaryData.push([
      dept.name, 
      dept.maxCrew, 
      appState.months[dept.startMonth], 
      appState.months[dept.endMonth]
    ]);
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths (approximate)
  const wscols = [
    { wch: 25 },  // A
    { wch: 15 },  // B
    { wch: 15 },  // C
    { wch: 15 }   // D
  ];
  worksheet['!cols'] = wscols;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
}

/**
 * Create a timeline sheet with the crew matrix
 * @param {Object} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createTimelineSheet(workbook, appState) {
  // Create header row with months
  const headerRow = ['Department'];
  appState.months.forEach(month => {
    headerRow.push(month);
  });
  
  // Initialize timeline data with header row
  const timelineData = [headerRow];
  
  // Add phase rows
  appState.phases.forEach(phase => {
    const phaseRow = [phase.name];
    
    // Add empty cells for each month
    for (let i = 0; i < appState.months.length; i++) {
      // Mark cells in the phase duration
      if (i >= phase.startMonth && i <= phase.endMonth) {
        phaseRow.push('✓');
      } else {
        phaseRow.push('');
      }
    }
    
    timelineData.push(phaseRow);
  });
  
  // Add department rows with crew counts
  appState.departments.forEach((dept, deptIndex) => {
    const deptRow = [dept.name];
    
    // Add crew counts for each month
    appState.months.forEach((_, monthIndex) => {
      const crewCount = appState.crewMatrix[deptIndex][monthIndex] || 0;
      deptRow.push(crewCount);
    });
    
    timelineData.push(deptRow);
  });
  
  // Add total row
  const totalRow = ['TOTAL'];
  
  // Calculate totals for each month
  appState.months.forEach((_, monthIndex) => {
    let total = 0;
    appState.departments.forEach((_, deptIndex) => {
      total += appState.crewMatrix[deptIndex][monthIndex] || 0;
    });
    totalRow.push(total);
  });
  
  timelineData.push(totalRow);
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(timelineData);
  
  // Set column widths (approximate)
  const wscols = [
    { wch: 25 }  // A
  ];
  
  // Add column widths for each month
  for (let i = 0; i < appState.months.length; i++) {
    wscols.push({ wch: 12 });
  }
  
  worksheet['!cols'] = wscols;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timeline');
}

/**
 * Create a facilities cost sheet
 * @param {Object} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createFacilitiesSheet(workbook, appState) {
  // Initialize facilities data
  const facilitiesData = [
    ['Facilities Costs'],
    [],
    ['Fixed Facilities Costs'],
    ['Category', 'Item', 'Cost', 'Notes']
  ];
  
  // Add fixed costs
  appState.facilitiesData.fixedFacilityCosts.forEach(category => {
    // Add category row
    facilitiesData.push([category.category, '', '', '']);
    
    // Add items
    category.items.forEach(item => {
      facilitiesData.push(['', item.name, item.cost, item.notes || '']);
    });
  });
  
  // Add empty row
  facilitiesData.push([]);
  
  // Add variable facilities costs
  facilitiesData.push(['Variable Facilities Costs (Per Person)']);
  facilitiesData.push(['Category', 'Item', 'Cost', 'Notes']);
  
  // Add variable costs
  appState.facilitiesData.variableFacilityCosts.forEach(category => {
    // Add category row
    facilitiesData.push([category.category, '', '', '']);
    
    // Add items
    category.items.forEach(item => {
      facilitiesData.push(['', item.name, item.cost, item.notes || '']);
    });
  });
  
  // Add empty row
  facilitiesData.push([]);
  
  // Add department allocation if it exists
  if (appState.facilitiesData.departmentAllocation && appState.facilitiesData.departmentAllocation.length > 0) {
    facilitiesData.push(['Department Allocation']);
    facilitiesData.push(['Department', '% of Facilities Cost', 'Allocated Amount', '']);
    
    // Add department allocations
    appState.departments.forEach((dept, index) => {
      const percentage = appState.facilitiesData.departmentAllocation[index] || 0;
      const totalCost = calculateTotalFacilitiesCost(appState);
      const allocatedAmount = (percentage / 100) * totalCost;
      
      facilitiesData.push([
        dept.name,
        `${percentage}%`,
        allocatedAmount,
        ''
      ]);
    });
  }
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(facilitiesData);
  
  // Set column widths (approximate)
  const wscols = [
    { wch: 20 },  // A
    { wch: 30 },  // B
    { wch: 15 },  // C
    { wch: 40 }   // D
  ];
  worksheet['!cols'] = wscols;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Facilities');
}

/**
 * Create a hardware cost sheet
 * @param {Object} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createHardwareSheet(workbook, appState) {
  // Initialize hardware data
  const hardwareData = [
    ['Hardware Costs'],
    [],
    ['Workstation Bundles'],
    ['Category', 'Item', 'Cost', 'Quantity', 'Total', 'Notes']
  ];
  
  // Add bundles
  appState.workstationData.bundles.forEach(bundle => {
    hardwareData.push([
      'Bundle',
      bundle.name,
      bundle.cost,
      '',
      '',
      bundle.notes || ''
    ]);
    
    // Add components if they exist
    if (bundle.components && bundle.components.length > 0) {
      bundle.components.forEach(component => {
        hardwareData.push([
          '',
          `- ${component.name}`,
          component.cost,
          component.quantity,
          component.cost * component.quantity,
          component.notes || ''
        ]);
      });
    }
  });
  
  // Add empty row
  hardwareData.push([]);
  
  // Add department assignments
  hardwareData.push(['Department Assignments']);
  hardwareData.push(['Department', 'Bundle', 'Quantity', 'Total Cost', '', '']);
  
  // Add assignments
  appState.workstationData.assignments.forEach(assignment => {
    const dept = appState.departments.find(d => d.id === assignment.departmentId);
    const bundle = appState.workstationData.bundles.find(b => b.id === assignment.bundleId);
    
    if (dept && bundle) {
      hardwareData.push([
        dept.name,
        bundle.name,
        assignment.quantity,
        bundle.cost * assignment.quantity,
        '',
        ''
      ]);
    }
  });
  
  // Add empty row
  hardwareData.push([]);
  
  // Add backend infrastructure
  hardwareData.push(['Backend Infrastructure']);
  hardwareData.push(['Category', 'Item', 'Cost', 'Quantity', 'Total', 'Notes']);
  
  // Add backend infrastructure items
  appState.workstationData.backendInfrastructure.forEach(category => {
    // Add category row
    hardwareData.push([category.category, '', '', '', '', '']);
    
    // Add items
    category.items.forEach(item => {
      hardwareData.push([
        '',
        item.name,
        item.cost,
        item.quantity,
        item.cost * item.quantity,
        item.notes || ''
      ]);
    });
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(hardwareData);
  
  // Set column widths (approximate)
  const wscols = [
    { wch: 20 },  // A
    { wch: 30 },  // B
    { wch: 15 },  // C
    { wch: 10 },  // D
    { wch: 15 },  // E
    { wch: 30 }   // F
  ];
  worksheet['!cols'] = wscols;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hardware');
}

/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @returns {string} - The formatted currency string
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Calculate the total facilities cost
 * @param {Object} appState - The application state
 * @returns {number} - The total facilities cost
 */
function calculateTotalFacilitiesCost(appState) {
  let fixedCost = 0;
  let variableCostPerPerson = 0;
  
  // Calculate fixed costs
  appState.facilitiesData.fixedFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      fixedCost += item.cost;
    });
  });
  
  // Calculate variable costs per person
  appState.facilitiesData.variableFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      variableCostPerPerson += item.cost;
    });
  });
  
  // Calculate total cost based on peak crew size
  return fixedCost + (variableCostPerPerson * appState.peakCrewSize);
}