/**
 * Enhanced Excel export with proper color support using ExcelJS
 */
import ExcelJS from 'exceljs';

/**
 * Export project data to a colored Excel file
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToColoredExcel(appState) {
  const {
    years,
    monthsPerYear,
    months,
    sortedItems,
    phases,
    departments,
    crewMatrix,
    monthlyLaborCosts,
    monthlyFacilityCosts,
    monthlyWorkstationCosts,
    monthlyBackendCosts,
    monthlyCosts,
    cumulativeCosts,
    totalProjectCost,
    peakMonthlyCost,
    peakCrewSize,
    facilitiesData,
    workstationData
  } = appState;

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Crew Planner';
  workbook.lastModifiedBy = 'Crew Planner';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create Timeline sheet
  createTimelineSheet(workbook, appState);
  
  // Create Stats sheet
  createStatsSheet(workbook, appState);
  
  // Create Facilities Summary sheet
  createFacilitiesSummarySheet(workbook, appState);
  
  // Create Workstation Summary sheet
  createWorkstationSummarySheet(workbook, appState);
  
  // Create Facilities Detail sheet
  createFacilitiesDetailSheet(workbook, appState);
  
  // Create Workstations Detail sheet
  createWorkstationsDetailSheet(workbook, appState);

  // Generate Excel file as a blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Create the Timeline sheet with colored phases and crew counts
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createTimelineSheet(workbook, appState) {
  const {
    years,
    monthsPerYear,
    months,
    sortedItems,
    phases,
    departments,
    crewMatrix
  } = appState;

  // Create the Timeline sheet
  const sheet = workbook.addWorksheet('Timeline');

  // Set column widths
  const columns = [{ header: '', width: 30 }];
  for (let i = 0; i < months.length; i++) {
    columns.push({ header: '', width: 15 });
  }
  sheet.columns = columns;

  // Add header rows with year and month names
  const yearHeaderRow = sheet.addRow(['']);
  const monthHeaderRow = sheet.addRow(['']);

  // Style the header rows
  yearHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  monthHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  // Fill in year headers
  let yearColIndex = 2;
  years.forEach(year => {
    const yearCell = yearHeaderRow.getCell(yearColIndex);
    yearCell.value = year;
    
    // Merge cells for the year header
    sheet.mergeCells(1, yearColIndex, 1, yearColIndex + 11);
    
    yearColIndex += 12;
  });

  // Fill in month headers
  let monthColIndex = 2;
  years.forEach(year => {
    monthsPerYear.forEach(month => {
      const monthCell = monthHeaderRow.getCell(monthColIndex);
      monthCell.value = month;
      monthColIndex++;
    });
  });

  // Add empty row after headers
  sheet.addRow([]);

  // Group departments by their section/category
  const sections = {};
  let currentSection = "Departments";

  // First pass: identify all sections and their departments
  sortedItems.forEach(item => {
    if (item.type === 'phase') {
      // This is a section header
      currentSection = phases[item.index].name;
      sections[currentSection] = [];
    } else if (item.type === 'department') {
      // Add this department to the current section
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push({
        index: item.index,
        dept: departments[item.index]
      });
    }
  });

  // Second pass: output each section with its departments
  let rowIndex = 4;
  Object.keys(sections).forEach(sectionName => {
    // Add section header with color
    const sectionRow = sheet.addRow([sectionName + ":"]);
    rowIndex++;
    
    // Style the section header
    const phaseColor = getPhaseColor(sectionName);
    sectionRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: phaseColor }
      };
      cell.font = { bold: true, italic: true };
    });

    // Add departments in this section
    sections[sectionName].forEach(deptInfo => {
      // Create department row
      const deptRow = [deptInfo.dept.name];

      // Add crew counts for each month
      for (let i = 0; i < months.length; i++) {
        deptRow.push(crewMatrix[deptInfo.index][i]);
      }

      const row = sheet.addRow(deptRow);
      rowIndex++;

      // Style the department name
      const nameCell = row.getCell(1);
      nameCell.font = { bold: true };

      // Style crew count cells with color intensity based on value
      for (let i = 2; i <= months.length + 1; i++) {
        const cell = row.getCell(i);
        const value = cell.value;
        
        if (value && value > 0) {
          // Calculate color intensity based on crew size
          const intensity = Math.min(1, value / 10); // Scale based on crew size
          const baseColor = 'D8E4BC'; // Light green
          const colorRgb = adjustColorIntensity(baseColor, intensity);
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colorRgb }
          };
          cell.alignment = { horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }

      // Add an empty row after each department (only if not the last department in the section)
      if (sections[sectionName].indexOf(deptInfo) < sections[sectionName].length - 1) {
        sheet.addRow([]);
        rowIndex++;
      }
    });

    // Add empty rows after each section
    sheet.addRow([]);
    sheet.addRow([]);
    rowIndex += 2;
  });

  // Add monthly costs to timeline
  const laborCostRow = sheet.addRow(['Monthly Labor Cost']);
  const facilityCostRow = sheet.addRow(['Monthly Facility Cost']);
  const workstationCostRow = sheet.addRow(['Workstation Cost (One-time)']);
  const backendCostRow = sheet.addRow(['Backend Infrastructure Cost']);
  const totalCostRow = sheet.addRow(['Total Monthly Cost']);
  const cumulativeCostRow = sheet.addRow(['Cumulative Cost']);

  // Fill in cost values
  for (let i = 0; i < months.length; i++) {
    laborCostRow.getCell(i + 2).value = appState.monthlyLaborCosts[i];
    facilityCostRow.getCell(i + 2).value = appState.monthlyFacilityCosts[i];
    workstationCostRow.getCell(i + 2).value = appState.monthlyWorkstationCosts[i];
    backendCostRow.getCell(i + 2).value = appState.monthlyBackendCosts[i];
    totalCostRow.getCell(i + 2).value = appState.monthlyCosts[i];
    cumulativeCostRow.getCell(i + 2).value = appState.cumulativeCosts[i];
  }

  // Style cost rows
  const costRows = [
    { row: laborCostRow, color: 'FFD8E4BC' }, // Light green
    { row: facilityCostRow, color: 'FFE6B8B7' }, // Light red
    { row: workstationCostRow, color: 'FFB8CCE4' }, // Light blue
    { row: backendCostRow, color: 'FFCCC0DA' }, // Light purple
    { row: totalCostRow, color: 'FFFCD5B4' }, // Light orange
    { row: cumulativeCostRow, color: 'FFFDE9D9' } // Lighter orange
  ];

  costRows.forEach(({ row, color }) => {
    // Style the row header
    row.getCell(1).font = { bold: true };
    
    // Style the cost cells
    for (let i = 2; i <= months.length + 1; i++) {
      const cell = row.getCell(i);
      if (cell.value) {
        cell.numFmt = '$#,##0';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color }
        };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
  });

  // Make the total and cumulative rows bold
  totalCostRow.eachCell((cell) => {
    cell.font = { bold: true };
  });
  
  cumulativeCostRow.eachCell((cell) => {
    cell.font = { bold: true };
  });

  // Freeze the top rows
  sheet.views = [
    { state: 'frozen', xSplit: 1, ySplit: 2, activeCell: 'B3' }
  ];
}

/**
 * Create the Stats sheet with project statistics
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createStatsSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Stats');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 35 },
    { header: '', width: 20 },
    { header: '', width: 20 },
    { header: '', width: 20 }
  ];

  // Add project statistics
  const titleRow = sheet.addRow(['Project Statistics']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  sheet.addRow(['Total Project Cost', formatCurrency(appState.totalProjectCost)]);
  sheet.addRow(['Peak Monthly Cost', formatCurrency(appState.peakMonthlyCost)]);
  sheet.addRow(['Peak Crew Size', `${appState.peakCrewSize} crew members`]);

  sheet.addRow([]);

  // Add cost breakdown
  const breakdownTitleRow = sheet.addRow(['Cost Breakdown']);
  breakdownTitleRow.getCell(1).font = { bold: true, size: 14 };
  breakdownTitleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  const headerRow = sheet.addRow(['Category', 'Amount', '% of Total']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Calculate total labor cost
  const totalLaborCost = appState.monthlyLaborCosts.reduce((sum, cost) => sum + cost, 0);

  // Calculate total facility cost
  const totalFacilityCost = appState.monthlyFacilityCosts.reduce((sum, cost) => sum + cost, 0);

  // Calculate total workstation cost
  const totalWorkstationCost = appState.monthlyWorkstationCosts.reduce((sum, cost) => sum + cost, 0);

  // Calculate total backend cost
  const totalBackendCost = appState.monthlyBackendCosts.reduce((sum, cost) => sum + cost, 0);

  // Calculate percentages safely
  const totalCost = totalLaborCost + totalFacilityCost + totalWorkstationCost + totalBackendCost;
  const laborPercent = totalCost > 0 ? (totalLaborCost / totalCost * 100).toFixed(1) : '0.0';
  const facilityPercent = totalCost > 0 ? (totalFacilityCost / totalCost * 100).toFixed(1) : '0.0';
  const workstationPercent = totalCost > 0 ? (totalWorkstationCost / totalCost * 100).toFixed(1) : '0.0';
  const backendPercent = totalCost > 0 ? (totalBackendCost / totalCost * 100).toFixed(1) : '0.0';

  // Add cost breakdown rows with colors
  const laborRow = sheet.addRow([
    'Labor',
    formatCurrency(totalLaborCost),
    `${laborPercent}%`
  ]);
  laborRow.getCell(2).numFmt = '$#,##0';
  laborRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD8E4BC' } // Light green
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  const facilityRow = sheet.addRow([
    'Facilities',
    formatCurrency(totalFacilityCost),
    `${facilityPercent}%`
  ]);
  facilityRow.getCell(2).numFmt = '$#,##0';
  facilityRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6B8B7' } // Light red
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  const workstationRow = sheet.addRow([
    'Workstations',
    formatCurrency(totalWorkstationCost),
    `${workstationPercent}%`
  ]);
  workstationRow.getCell(2).numFmt = '$#,##0';
  workstationRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB8CCE4' } // Light blue
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  const backendRow = sheet.addRow([
    'Backend Infrastructure',
    formatCurrency(totalBackendCost),
    `${backendPercent}%`
  ]);
  backendRow.getCell(2).numFmt = '$#,##0';
  backendRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCC0DA' } // Light purple
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  const totalRow = sheet.addRow([
    'TOTAL',
    formatCurrency(totalCost),
    '100.0%'
  ]);
  totalRow.getCell(2).numFmt = '$#,##0';
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCD5B4' } // Light orange
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create the Facilities Summary sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createFacilitiesSummarySheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Facilities Summary');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 35 },
    { header: '', width: 20 },
    { header: '', width: 20 },
    { header: '', width: 20 }
  ];

  // Add title
  const titleRow = sheet.addRow(['Facilities Summary']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  // Add facilities data if available
  if (appState.facilitiesData) {
    const { facilitiesData } = appState;
    const { facilitiesFunctions } = appState;
    
    if (facilitiesFunctions) {
      const { calculateTotalFixedFacilityCosts, calculateTotalVariableFacilityCostsPerPerson } = facilitiesFunctions;
      
      if (calculateTotalFixedFacilityCosts && calculateTotalVariableFacilityCostsPerPerson) {
        const totalFixedCost = calculateTotalFixedFacilityCosts(facilitiesData);
        const totalVariableCost = calculateTotalVariableFacilityCostsPerPerson(facilitiesData);
        
        sheet.addRow(['Total Fixed Monthly Facility Costs', formatCurrency(totalFixedCost)]);
        sheet.addRow(['Total Variable Facility Costs Per Person', formatCurrency(totalVariableCost)]);
      }
    }
  }

  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create the Workstation Summary sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createWorkstationSummarySheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Workstation Summary');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 35 },
    { header: '', width: 20 },
    { header: '', width: 20 },
    { header: '', width: 20 },
    { header: '', width: 20 }
  ];

  // Add title
  const titleRow = sheet.addRow(['Workstation Summary']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  // Add workstation data if available
  if (appState.workstationData) {
    const { workstationData } = appState;
    
    // Add workstation bundles section
    const bundlesHeaderRow = sheet.addRow(['Workstation Bundles']);
    bundlesHeaderRow.getCell(1).font = { bold: true, size: 12 };
    bundlesHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    sheet.addRow([]);
    
    const bundleHeaderRow = sheet.addRow(['Bundle Name', 'Cost', 'Description']);
    bundleHeaderRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    
    // Add bundles if available
    if (workstationData.workstationBundles) {
      workstationData.workstationBundles.forEach(bundle => {
        const bundleRow = sheet.addRow([
          bundle.name,
          bundle.cost,
          bundle.description || ''
        ]);
        
        bundleRow.getCell(2).numFmt = '$#,##0';
        bundleRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      });
    }
  }

  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create the Facilities Detail sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createFacilitiesDetailSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Facilities Detail');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 25 },
    { header: '', width: 35 },
    { header: '', width: 20 },
    { header: '', width: 45 }
  ];

  // Add title for fixed costs
  const fixedTitleRow = sheet.addRow(['Fixed Facility Costs']);
  fixedTitleRow.getCell(1).font = { bold: true, size: 14 };
  fixedTitleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  // Add header row
  const headerRow = sheet.addRow(['Category', 'Item', 'Cost', 'Notes']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  // Add fixed facility costs if available
  if (appState.facilitiesData && appState.facilitiesData.fixedFacilityCosts) {
    appState.facilitiesData.fixedFacilityCosts.forEach(category => {
      // Add category row
      const categoryRow = sheet.addRow([category.category, '', '', '']);
      categoryRow.getCell(1).font = { bold: true };
      categoryRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      
      // Add items
      category.items.forEach(item => {
        const itemRow = sheet.addRow(['', item.name, item.cost, item.notes || '']);
        itemRow.getCell(3).numFmt = '$#,##0';
      });
    });
  }

  sheet.addRow([]);
  sheet.addRow([]);

  // Add title for variable costs
  const variableTitleRow = sheet.addRow(['Variable Facility Costs (Per Person)']);
  variableTitleRow.getCell(1).font = { bold: true, size: 14 };
  variableTitleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  // Add header row
  const variableHeaderRow = sheet.addRow(['Category', 'Item', 'Cost Per Person', 'Notes']);
  variableHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  // Add variable facility costs if available
  if (appState.facilitiesData && appState.facilitiesData.variableFacilityCosts) {
    appState.facilitiesData.variableFacilityCosts.forEach(category => {
      // Add category row
      const categoryRow = sheet.addRow([category.category, '', '', '']);
      categoryRow.getCell(1).font = { bold: true };
      categoryRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      
      // Add items
      category.items.forEach(item => {
        const itemRow = sheet.addRow(['', item.name, item.cost, item.notes || '']);
        itemRow.getCell(3).numFmt = '$#,##0';
      });
    });
  }

  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create the Workstations Detail sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
function createWorkstationsDetailSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Workstations Detail');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 25 },
    { header: '', width: 35 },
    { header: '', width: 20 },
    { header: '', width: 15 },
    { header: '', width: 20 },
    { header: '', width: 35 }
  ];

  // Add title
  const titleRow = sheet.addRow(['Workstation Bundles']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  sheet.addRow([]);

  // Add header row
  const headerRow = sheet.addRow(['Bundle', 'Name', 'Cost', 'Quantity', 'Total', 'Notes']);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  // Add workstation bundles if available
  if (appState.workstationData && appState.workstationData.workstationBundles) {
    appState.workstationData.workstationBundles.forEach(bundle => {
      // Add bundle row
      const bundleRow = sheet.addRow([
        'Bundle',
        bundle.name,
        bundle.cost,
        '',
        '',
        bundle.notes || ''
      ]);
      bundleRow.getCell(1).font = { bold: true };
      bundleRow.getCell(3).numFmt = '$#,##0';
      bundleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      
      // Add components if they exist
      if (bundle.components && bundle.components.length > 0) {
        bundle.components.forEach(component => {
          const total = component.cost * component.quantity;
          const componentRow = sheet.addRow([
            '',
            `- ${component.name}`,
            component.cost,
            component.quantity,
            total,
            component.notes || ''
          ]);
          componentRow.getCell(3).numFmt = '$#,##0';
          componentRow.getCell(5).numFmt = '$#,##0';
        });
      }
    });
  }

  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Get a color for a phase based on its name in ARGB format
 * @param {string} phaseName - The name of the phase
 * @returns {string} - The ARGB color code
 */
function getPhaseColor(phaseName) {
  // Default colors for common phases
  const phaseColors = {
    'Pre-Production': 'FFD9D9D9', // Light red with alpha
    'Production': 'FFD9FFD9',     // Light green with alpha
    'Post-Production': 'FFD9D9FF', // Light blue with alpha
    'Development': 'FFFFFFD9',    // Light yellow with alpha
    'Testing': 'FFFFD9FF',        // Light purple with alpha
    'Deployment': 'FFD9FFFF'      // Light cyan with alpha
  };

  // Try to match the phase name with our predefined colors
  for (const [phase, color] of Object.entries(phaseColors)) {
    if (phaseName.includes(phase)) {
      return color;
    }
  }

  // If no match, generate a color based on the phase name
  return generateColorFromStringArgb(phaseName);
}

/**
 * Generate a color based on a string in ARGB format
 * @param {string} str - The input string
 * @returns {string} - The ARGB color code
 */
function generateColorFromStringArgb(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate a pastel color (lighter)
  const r = ((hash & 0xFF0000) >> 16) + 127;
  const g = ((hash & 0x00FF00) >> 8) + 127;
  const b = (hash & 0x0000FF) + 127;

  // Ensure values are in valid range (0-255)
  const rr = Math.min(255, Math.max(0, r)).toString(16).padStart(2, '0');
  const gg = Math.min(255, Math.max(0, g)).toString(16).padStart(2, '0');
  const bb = Math.min(255, Math.max(0, b)).toString(16).padStart(2, '0');

  return `FF${rr}${gg}${bb}`; // Add alpha channel (FF)
}

/**
 * Adjust the intensity of a color in ARGB format
 * @param {string} hexColor - The base color in hex format
 * @param {number} intensity - The intensity factor (0-1)
 * @returns {string} - The adjusted ARGB color
 */
function adjustColorIntensity(hexColor, intensity) {
  // Parse the hex color
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Adjust intensity (darker for higher intensity)
  const factor = 1 - (intensity * 0.5); // Limit darkening to 50%

  // Calculate new values
  const newR = Math.floor(r * factor);
  const newG = Math.floor(g * factor);
  const newB = Math.floor(b * factor);

  // Convert back to hex
  const rr = Math.min(255, Math.max(0, newR)).toString(16).padStart(2, '0');
  const gg = Math.min(255, Math.max(0, newG)).toString(16).padStart(2, '0');
  const bb = Math.min(255, Math.max(0, newB)).toString(16).padStart(2, '0');

  return `FF${rr}${gg}${bb}`; // Add alpha channel (FF)
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