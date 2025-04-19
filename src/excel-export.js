/**
 * Enhanced Excel export functionality with formatting and styling
 */
import ExcelJS from 'exceljs';

/**
 * Create a formatted Excel workbook from the application data
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function createFormattedExcel(appState) {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Crew Planner';
  workbook.lastModifiedBy = 'Crew Planner';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Add worksheets
  createSummarySheet(workbook, appState);
  createTimelineSheet(workbook, appState);
  createFacilitiesSheet(workbook, appState);
  createHardwareSheet(workbook, appState);
  
  // Generate Excel file as a blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Create a summary sheet with project overview
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createSummarySheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Summary');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 25 },
    { header: '', width: 15 },
    { header: '', width: 15 },
    { header: '', width: 15 }
  ];
  
  // Add title
  const titleRow = sheet.addRow(['Crew Planning Summary']);
  titleRow.font = { size: 16, bold: true };
  titleRow.height = 30;
  
  // Add empty row
  sheet.addRow([]);
  
  // Add key metrics
  const metricsHeaderRow = sheet.addRow(['Key Metrics']);
  metricsHeaderRow.font = { size: 14, bold: true };
  metricsHeaderRow.height = 24;
  
  // Add total project cost
  const totalCostRow = sheet.addRow(['Total Project Cost', formatCurrency(appState.totalProjectCost)]);
  totalCostRow.getCell(2).font = { bold: true, color: { argb: '4F81BD' } };
  
  // Add peak monthly cost
  const peakCostRow = sheet.addRow(['Peak Monthly Cost', formatCurrency(appState.peakMonthlyCost)]);
  peakCostRow.getCell(2).font = { bold: true, color: { argb: '4F81BD' } };
  
  // Add peak crew size
  const peakCrewRow = sheet.addRow(['Peak Crew Size', `${appState.peakCrewSize} crew members`]);
  peakCrewRow.getCell(2).font = { bold: true, color: { argb: '4F81BD' } };
  
  // Add empty row
  sheet.addRow([]);
  
  // Add project timeline info
  const timelineHeaderRow = sheet.addRow(['Project Timeline']);
  timelineHeaderRow.font = { size: 14, bold: true };
  timelineHeaderRow.height = 24;
  
  // Add timeline details
  sheet.addRow(['Total Duration', `${appState.months.length} months`]);
  
  // Add empty row
  sheet.addRow([]);
  
  // Add department summary
  const deptHeaderRow = sheet.addRow(['Departments']);
  deptHeaderRow.font = { size: 14, bold: true };
  deptHeaderRow.height = 24;
  
  // Add department header row
  const deptTableHeader = sheet.addRow(['Department', 'Max Crew', 'Start Month', 'End Month']);
  deptTableHeader.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add department data
  appState.departments.forEach(dept => {
    const row = sheet.addRow([
      dept.name, 
      dept.maxCrew, 
      appState.months[dept.startMonth], 
      appState.months[dept.endMonth]
    ]);
    
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Apply styles to the whole sheet
  styleSheet(sheet);
}

/**
 * Create a timeline sheet with the crew matrix
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createTimelineSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Timeline');
  
  // Set up columns - first column for departments, then one for each month
  const columns = [
    { header: 'Department', width: 25 }
  ];
  
  // Add month columns
  appState.months.forEach(month => {
    columns.push({ header: month, width: 12 });
  });
  
  sheet.columns = columns;
  
  // Style the header row
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  });
  
  // Add phase rows
  appState.phases.forEach(phase => {
    const phaseRow = sheet.addRow([phase.name]);
    phaseRow.getCell(1).font = { bold: true, italic: true };
    phaseRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    
    // Highlight phase duration
    for (let i = 0; i <= phase.endMonth - phase.startMonth; i++) {
      const cell = phaseRow.getCell(i + 2 + phase.startMonth);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E0E0E0' }
      };
    }
  });
  
  // Add department rows with crew counts
  appState.departments.forEach((dept, deptIndex) => {
    const rowData = [dept.name];
    
    // Add crew counts for each month
    appState.months.forEach((_, monthIndex) => {
      const crewCount = appState.crewMatrix[deptIndex][monthIndex] || 0;
      rowData.push(crewCount);
    });
    
    const deptRow = sheet.addRow(rowData);
    
    // Style department name
    deptRow.getCell(1).font = { bold: true };
    
    // Style crew counts
    for (let i = 0; i < appState.months.length; i++) {
      const cell = deptRow.getCell(i + 2);
      
      // Only style cells with crew members
      if (appState.crewMatrix[deptIndex][i] > 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D8E4BC' } // Light green
        };
      }
      
      // Highlight the department's active duration
      if (i >= dept.startMonth && i <= dept.endMonth) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      
      // Center align all cells
      cell.alignment = { horizontal: 'center' };
    }
  });
  
  // Add total row
  const totalRowData = ['TOTAL'];
  
  // Calculate totals for each month
  appState.months.forEach((_, monthIndex) => {
    let total = 0;
    appState.departments.forEach((_, deptIndex) => {
      total += appState.crewMatrix[deptIndex][monthIndex] || 0;
    });
    totalRowData.push(total);
  });
  
  const totalRow = sheet.addRow(totalRowData);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'C5D9F1' } // Light blue
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Apply styles to the whole sheet
  styleSheet(sheet);
}

/**
 * Create a facilities cost sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createFacilitiesSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Facilities');
  
  // Set column widths
  sheet.columns = [
    { header: 'Category', width: 20 },
    { header: 'Item', width: 30 },
    { header: 'Cost', width: 15 },
    { header: 'Notes', width: 40 }
  ];
  
  // Style the header row
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  });
  
  // Add fixed facilities costs
  let rowIndex = 2;
  
  // Add section header
  const fixedHeader = sheet.addRow(['Fixed Facilities Costs']);
  fixedHeader.getCell(1).font = { bold: true, size: 14 };
  fixedHeader.height = 24;
  rowIndex++;
  
  // Add fixed costs
  appState.facilitiesData.fixedFacilityCosts.forEach(category => {
    // Add category row
    const categoryRow = sheet.addRow([category.category, '', '', '']);
    categoryRow.getCell(1).font = { bold: true };
    categoryRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    rowIndex++;
    
    // Add items
    category.items.forEach(item => {
      const itemRow = sheet.addRow(['', item.name, formatCurrency(item.cost), item.notes || '']);
      itemRow.getCell(3).numFmt = '$#,##0';
      rowIndex++;
    });
  });
  
  // Add empty row
  sheet.addRow([]);
  rowIndex++;
  
  // Add variable facilities costs
  const variableHeader = sheet.addRow(['Variable Facilities Costs (Per Person)']);
  variableHeader.getCell(1).font = { bold: true, size: 14 };
  variableHeader.height = 24;
  rowIndex++;
  
  // Add variable costs
  appState.facilitiesData.variableFacilityCosts.forEach(category => {
    // Add category row
    const categoryRow = sheet.addRow([category.category, '', '', '']);
    categoryRow.getCell(1).font = { bold: true };
    categoryRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    rowIndex++;
    
    // Add items
    category.items.forEach(item => {
      const itemRow = sheet.addRow(['', item.name, formatCurrency(item.cost), item.notes || '']);
      itemRow.getCell(3).numFmt = '$#,##0';
      rowIndex++;
    });
  });
  
  // Add empty row
  sheet.addRow([]);
  rowIndex++;
  
  // Add department allocation if it exists
  if (appState.facilitiesData.departmentAllocation && appState.facilitiesData.departmentAllocation.length > 0) {
    const allocationHeader = sheet.addRow(['Department Allocation']);
    allocationHeader.getCell(1).font = { bold: true, size: 14 };
    allocationHeader.height = 24;
    rowIndex++;
    
    // Add allocation header row
    const allocHeaderRow = sheet.addRow(['Department', '% of Facilities Cost', 'Allocated Amount', '']);
    allocHeaderRow.eachCell((cell, colNumber) => {
      if (colNumber <= 3) {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
    rowIndex++;
    
    // Add department allocations
    appState.departments.forEach((dept, index) => {
      const percentage = appState.facilitiesData.departmentAllocation[index] || 0;
      const totalCost = calculateTotalFacilitiesCost(appState);
      const allocatedAmount = (percentage / 100) * totalCost;
      
      const deptRow = sheet.addRow([
        dept.name,
        `${percentage}%`,
        formatCurrency(allocatedAmount),
        ''
      ]);
      
      deptRow.getCell(3).numFmt = '$#,##0';
      
      deptRow.eachCell((cell, colNumber) => {
        if (colNumber <= 3) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
      
      rowIndex++;
    });
  }
  
  // Apply styles to the whole sheet
  styleSheet(sheet);
}

/**
 * Create a hardware cost sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createHardwareSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Hardware');
  
  // Set column widths
  sheet.columns = [
    { header: 'Category', width: 20 },
    { header: 'Item', width: 30 },
    { header: 'Cost', width: 15 },
    { header: 'Quantity', width: 10 },
    { header: 'Total', width: 15 },
    { header: 'Notes', width: 30 }
  ];
  
  // Style the header row
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
  });
  
  // Add workstation bundles
  let rowIndex = 2;
  
  // Add section header
  const bundlesHeader = sheet.addRow(['Workstation Bundles']);
  bundlesHeader.getCell(1).font = { bold: true, size: 14 };
  bundlesHeader.height = 24;
  rowIndex++;
  
  // Add bundles
  appState.workstationData.bundles.forEach(bundle => {
    const bundleRow = sheet.addRow([
      'Bundle',
      bundle.name,
      formatCurrency(bundle.cost),
      '',
      '',
      bundle.notes || ''
    ]);
    bundleRow.getCell(1).font = { bold: true };
    bundleRow.getCell(3).numFmt = '$#,##0';
    rowIndex++;
    
    // Add components if they exist
    if (bundle.components && bundle.components.length > 0) {
      bundle.components.forEach(component => {
        const componentRow = sheet.addRow([
          '',
          `- ${component.name}`,
          formatCurrency(component.cost),
          component.quantity,
          formatCurrency(component.cost * component.quantity),
          component.notes || ''
        ]);
        componentRow.getCell(3).numFmt = '$#,##0';
        componentRow.getCell(5).numFmt = '$#,##0';
        rowIndex++;
      });
    }
  });
  
  // Add empty row
  sheet.addRow([]);
  rowIndex++;
  
  // Add department assignments
  const assignmentsHeader = sheet.addRow(['Department Assignments']);
  assignmentsHeader.getCell(1).font = { bold: true, size: 14 };
  assignmentsHeader.height = 24;
  rowIndex++;
  
  // Add assignment header row
  const assignHeaderRow = sheet.addRow(['Department', 'Bundle', 'Quantity', 'Total Cost', '', '']);
  assignHeaderRow.eachCell((cell, colNumber) => {
    if (colNumber <= 4) {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });
  rowIndex++;
  
  // Add assignments
  appState.workstationData.assignments.forEach(assignment => {
    const dept = appState.departments.find(d => d.id === assignment.departmentId);
    const bundle = appState.workstationData.bundles.find(b => b.id === assignment.bundleId);
    
    if (dept && bundle) {
      const assignRow = sheet.addRow([
        dept.name,
        bundle.name,
        assignment.quantity,
        formatCurrency(bundle.cost * assignment.quantity),
        '',
        ''
      ]);
      
      assignRow.getCell(4).numFmt = '$#,##0';
      
      assignRow.eachCell((cell, colNumber) => {
        if (colNumber <= 4) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
      
      rowIndex++;
    }
  });
  
  // Add empty row
  sheet.addRow([]);
  rowIndex++;
  
  // Add backend infrastructure
  const backendHeader = sheet.addRow(['Backend Infrastructure']);
  backendHeader.getCell(1).font = { bold: true, size: 14 };
  backendHeader.height = 24;
  rowIndex++;
  
  // Add backend infrastructure items
  appState.workstationData.backendInfrastructure.forEach(category => {
    // Add category row
    const categoryRow = sheet.addRow([category.category, '', '', '', '', '']);
    categoryRow.getCell(1).font = { bold: true };
    categoryRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    rowIndex++;
    
    // Add items
    category.items.forEach(item => {
      const itemRow = sheet.addRow([
        '',
        item.name,
        formatCurrency(item.cost),
        item.quantity,
        formatCurrency(item.cost * item.quantity),
        item.notes || ''
      ]);
      itemRow.getCell(3).numFmt = '$#,##0';
      itemRow.getCell(5).numFmt = '$#,##0';
      rowIndex++;
    });
  });
  
  // Apply styles to the whole sheet
  styleSheet(sheet);
}

/**
 * Apply common styling to a worksheet
 * @param {ExcelJS.Worksheet} sheet - The worksheet to style
 */
function styleSheet(sheet) {
  // Add borders to all cells with content
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.value) {
        if (!cell.border) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }
    });
  });
  
  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
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