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
    ['Total Project Cost', formatCurrency(appState.totalProjectCost || 0)],
    ['Peak Monthly Cost', formatCurrency(appState.peakMonthlyCost || 0)],
    ['Peak Crew Size', `${appState.peakCrewSize || 0} crew members`],
    [],
    ['Project Timeline'],
    ['Total Duration', `${(appState.months || []).length} months`],
    [],
    ['Departments'],
    ['Department', 'Max Crew', 'Start Month', 'End Month']
  ];
  
  // Add department data
  (appState.departments || []).forEach(dept => {
    const startMonthName = (appState.months || [])[dept.startMonth] || '';
    const endMonthName = (appState.months || [])[dept.endMonth] || '';
    
    summaryData.push([
      dept.name || '', 
      dept.maxCrew || 0, 
      startMonthName, 
      endMonthName
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
  (appState.months || []).forEach(month => {
    headerRow.push(month || '');
  });
  
  // Initialize timeline data with header row
  const timelineData = [headerRow];
  
  // Add phase rows
  (appState.phases || []).forEach(phase => {
    const phaseRow = [phase.name || ''];
    
    // Add empty cells for each month
    for (let i = 0; i < (appState.months || []).length; i++) {
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
  (appState.departments || []).forEach((dept, deptIndex) => {
    const deptRow = [dept.name || ''];
    
    // Add crew counts for each month
    (appState.months || []).forEach((_, monthIndex) => {
      const crewMatrix = appState.crewMatrix || [];
      const deptMatrix = crewMatrix[deptIndex] || [];
      const crewCount = deptMatrix[monthIndex] || 0;
      deptRow.push(crewCount);
    });
    
    timelineData.push(deptRow);
  });
  
  // Add total row
  const totalRow = ['TOTAL'];
  
  // Calculate totals for each month
  (appState.months || []).forEach((_, monthIndex) => {
    let total = 0;
    (appState.departments || []).forEach((_, deptIndex) => {
      const crewMatrix = appState.crewMatrix || [];
      const deptMatrix = crewMatrix[deptIndex] || [];
      total += deptMatrix[monthIndex] || 0;
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
  for (let i = 0; i < (appState.months || []).length; i++) {
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
  const facilitiesData1 = appState.facilitiesData || {};
  (facilitiesData1.fixedFacilityCosts || []).forEach(category => {
    // Add category row
    facilitiesData.push([category.category || '', '', '', '']);
    
    // Add items
    (category.items || []).forEach(item => {
      facilitiesData.push(['', item.name || '', item.cost || 0, item.notes || '']);
    });
  });
  
  // Add empty row
  facilitiesData.push([]);
  
  // Add variable facilities costs
  facilitiesData.push(['Variable Facilities Costs (Per Person)']);
  facilitiesData.push(['Category', 'Item', 'Cost', 'Notes']);
  
  // Add variable costs
  (facilitiesData1.variableFacilityCosts || []).forEach(category => {
    // Add category row
    facilitiesData.push([category.category || '', '', '', '']);
    
    // Add items
    (category.items || []).forEach(item => {
      facilitiesData.push(['', item.name || '', item.cost || 0, item.notes || '']);
    });
  });
  
  // Add empty row
  facilitiesData.push([]);
  
  // Add department allocation if it exists
  if (facilitiesData1.departmentAllocation && facilitiesData1.departmentAllocation.length > 0) {
    facilitiesData.push(['Department Allocation']);
    facilitiesData.push(['Department', '% of Facilities Cost', 'Allocated Amount', '']);
    
    // Add department allocations
    (appState.departments || []).forEach((dept, index) => {
      const percentage = (facilitiesData1.departmentAllocation || [])[index] || 0;
      const totalCost = calculateTotalFacilitiesCost(appState);
      const allocatedAmount = (percentage / 100) * totalCost;
      
      facilitiesData.push([
        dept.name || '',
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
  
  const workstationData = appState.workstationData || {};
  
  // Add bundles
  (workstationData.workstationBundles || []).forEach(bundle => {
    hardwareData.push([
      'Bundle',
      bundle.name || '',
      bundle.cost || 0,
      '',
      '',
      bundle.notes || ''
    ]);
    
    // Add components if they exist
    if (bundle.components && bundle.components.length > 0) {
      bundle.components.forEach(component => {
        hardwareData.push([
          '',
          `- ${component.name || ''}`,
          component.cost || 0,
          component.quantity || 0,
          (component.cost || 0) * (component.quantity || 0),
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
  (workstationData.departmentAssignments || []).forEach(assignment => {
    const dept = (appState.departments || []).find(d => d.id === assignment.departmentId);
    const bundle = (workstationData.workstationBundles || []).find(b => b.id === assignment.workstationId);
    
    if (dept && bundle) {
      hardwareData.push([
        dept.name || '',
        bundle.name || '',
        assignment.quantity || 0,
        (bundle.cost || 0) * (assignment.quantity || 0),
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
  (workstationData.backendInfrastructure || []).forEach(category => {
    // Add category row
    hardwareData.push([category.category || '', '', '', '', '', '']);
    
    // Add items
    (category.items || []).forEach(item => {
      hardwareData.push([
        '',
        item.name || '',
        item.cost || 0,
        item.quantity || 0,
        (item.cost || 0) * (item.quantity || 0),
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
  
  const facilitiesData = appState.facilitiesData || {};
  
  // Calculate fixed costs
  (facilitiesData.fixedFacilityCosts || []).forEach(category => {
    (category.items || []).forEach(item => {
      fixedCost += item.cost || 0;
    });
  });
  
  // Calculate variable costs per person
  (facilitiesData.variableFacilityCosts || []).forEach(category => {
    (category.items || []).forEach(item => {
      variableCostPerPerson += item.cost || 0;
    });
  });
  
  // Calculate total cost based on peak crew size
  return fixedCost + (variableCostPerPerson * (appState.peakCrewSize || 0));
}