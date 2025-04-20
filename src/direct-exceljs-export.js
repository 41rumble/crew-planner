/**
 * Direct Excel export using ExcelJS with the exact same data structure
 * as the original export-excel.js
 */
import * as XLSX from 'xlsx';

/**
 * Export project data to a colored Excel file with the exact same data structure
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToColoredExcel(appState) {
  try {
    console.log('Starting direct ExcelJS export...');
    
    // Import ExcelJS
    const ExcelJS = (await import('exceljs')).default;
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Crew Planner';
    workbook.lastModifiedBy = 'Crew Planner';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    console.log('Creating Timeline sheet...');
    // Create Timeline sheet
    await createTimelineSheet(workbook, appState);
    
    console.log('Creating Stats sheet...');
    // Create Stats sheet
    await createStatsSheet(workbook, appState);
    
    console.log('Creating Facilities Summary sheet...');
    // Create Facilities Summary sheet
    await createFacilitiesSummarySheet(workbook, appState);
    
    console.log('Creating Workstation Summary sheet...');
    // Create Workstation Summary sheet
    await createWorkstationSummarySheet(workbook, appState);
    
    console.log('Creating Facilities Detail sheet...');
    // Create Facilities Detail sheet
    await createFacilitiesDetailSheet(workbook, appState);
    
    console.log('Creating Workstations Detail sheet...');
    // Create Workstations Detail sheet
    await createWorkstationsDetailSheet(workbook, appState);
    
    console.log('Generating Excel file...');
    // Generate Excel file as a blob
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error in direct ExcelJS export:', error);
    
    // Fall back to the original export function
    console.log('Falling back to original export function...');
    const { exportToExcel } = await import('./export-excel.js');
    const xlsxWorkbook = exportToExcel(appState, true);
    
    // Convert to blob
    const wbout = XLSX.write(xlsxWorkbook, { bookType: 'xlsx', type: 'binary' });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

/**
 * Create the Timeline sheet with the exact same data structure as the original export
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function createTimelineSheet(workbook, appState) {
  const {
    years = [],
    monthsPerYear = [],
    months = [],
    sortedItems = [],
    phases = [],
    departments = [],
    crewMatrix = [],
    monthlyLaborCosts = [],
    monthlyFacilityCosts = [],
    monthlyWorkstationCosts = [],
    monthlyBackendCosts = [],
    monthlyCosts = [],
    cumulativeCosts = []
  } = appState;
  
  // Create the Timeline sheet
  const sheet = workbook.addWorksheet('Timeline');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 30 }, // First column wider for department names
  ];
  
  // Add additional columns for each month
  for (let i = 0; i < months.length; i++) {
    sheet.columns.push({ header: '', width: 15 });
  }
  
  // Add header rows with year and month names
  const yearHeaderRow = sheet.getRow(1);
  const monthHeaderRow = sheet.getRow(2);
  
  // Set first cell empty
  yearHeaderRow.getCell(1).value = '';
  monthHeaderRow.getCell(1).value = '';
  
  // Fill in year headers
  let yearColIndex = 2;
  years.forEach(year => {
    // Add the year
    yearHeaderRow.getCell(yearColIndex).value = year;
    
    // Merge cells for the year header (12 months)
    sheet.mergeCells(1, yearColIndex, 1, yearColIndex + 11);
    
    // Style the year header
    yearHeaderRow.getCell(yearColIndex).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    yearHeaderRow.getCell(yearColIndex).font = { bold: true };
    yearHeaderRow.getCell(yearColIndex).alignment = { horizontal: 'center' };
    
    yearColIndex += 12;
  });
  
  // Fill in month headers
  let monthColIndex = 2;
  years.forEach(year => {
    // Add all months for this year
    monthsPerYear.forEach(month => {
      monthHeaderRow.getCell(monthColIndex).value = month;
      
      // Style the month header
      monthHeaderRow.getCell(monthColIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      monthHeaderRow.getCell(monthColIndex).font = { bold: true };
      monthHeaderRow.getCell(monthColIndex).alignment = { horizontal: 'center' };
      
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
    const sectionRow = sheet.getRow(rowIndex);
    sectionRow.getCell(1).value = sectionName + ":";
    rowIndex++;
    
    // Style the section header
    const phaseColor = getPhaseColor(sectionName);
    sectionRow.getCell(1).font = { bold: true, italic: true };
    sectionRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + phaseColor }
    };
    
    // Apply phase color to the entire row
    for (let c = 2; c <= months.length + 1; c++) {
      sectionRow.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + phaseColor }
      };
    }
    
    // Add departments in this section
    sections[sectionName].forEach(deptInfo => {
      // Create department row
      const deptRow = sheet.getRow(rowIndex);
      deptRow.getCell(1).value = deptInfo.dept.name;
      
      // Style the department name
      deptRow.getCell(1).font = { bold: true };
      
      // Add crew counts for each month
      for (let i = 0; i < months.length; i++) {
        const crewCount = crewMatrix[deptInfo.index][i];
        deptRow.getCell(i + 2).value = crewCount;
        
        // Style crew count cells with color intensity based on value
        if (crewCount && crewCount > 0) {
          // Calculate color intensity based on crew size
          const intensity = Math.min(1, crewCount / 10); // Scale based on crew size
          const baseColor = 'D8E4BC'; // Light green
          const colorRgb = adjustColorIntensity(baseColor, intensity);
          
          deptRow.getCell(i + 2).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF' + colorRgb }
          };
          deptRow.getCell(i + 2).alignment = { horizontal: 'center' };
          deptRow.getCell(i + 2).border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }
      
      rowIndex++;
      
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
  const laborCostRow = sheet.getRow(rowIndex++);
  const facilityCostRow = sheet.getRow(rowIndex++);
  const workstationCostRow = sheet.getRow(rowIndex++);
  const backendCostRow = sheet.getRow(rowIndex++);
  const totalCostRow = sheet.getRow(rowIndex++);
  const cumulativeCostRow = sheet.getRow(rowIndex++);
  
  // Set row labels
  laborCostRow.getCell(1).value = 'Monthly Labor Cost';
  facilityCostRow.getCell(1).value = 'Monthly Facility Cost';
  workstationCostRow.getCell(1).value = 'Workstation Cost (One-time)';
  backendCostRow.getCell(1).value = 'Backend Infrastructure Cost';
  totalCostRow.getCell(1).value = 'Total Monthly Cost';
  cumulativeCostRow.getCell(1).value = 'Cumulative Cost';
  
  // Make labels bold
  laborCostRow.getCell(1).font = { bold: true };
  facilityCostRow.getCell(1).font = { bold: true };
  workstationCostRow.getCell(1).font = { bold: true };
  backendCostRow.getCell(1).font = { bold: true };
  totalCostRow.getCell(1).font = { bold: true };
  cumulativeCostRow.getCell(1).font = { bold: true };
  
  // Fill in cost values
  for (let i = 0; i < months.length; i++) {
    laborCostRow.getCell(i + 2).value = monthlyLaborCosts[i];
    facilityCostRow.getCell(i + 2).value = monthlyFacilityCosts[i];
    workstationCostRow.getCell(i + 2).value = monthlyWorkstationCosts[i];
    backendCostRow.getCell(i + 2).value = monthlyBackendCosts[i];
    totalCostRow.getCell(i + 2).value = monthlyCosts[i];
    cumulativeCostRow.getCell(i + 2).value = cumulativeCosts[i];
    
    // Apply formatting to cost cells
    laborCostRow.getCell(i + 2).numFmt = '$#,##0';
    facilityCostRow.getCell(i + 2).numFmt = '$#,##0';
    workstationCostRow.getCell(i + 2).numFmt = '$#,##0';
    backendCostRow.getCell(i + 2).numFmt = '$#,##0';
    totalCostRow.getCell(i + 2).numFmt = '$#,##0';
    cumulativeCostRow.getCell(i + 2).numFmt = '$#,##0';
    
    // Apply colors to cost cells
    laborCostRow.getCell(i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD8E4BC' } // Light green
    };
    facilityCostRow.getCell(i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6B8B7' } // Light red
    };
    workstationCostRow.getCell(i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB8CCE4' } // Light blue
    };
    backendCostRow.getCell(i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCC0DA' } // Light purple
    };
    totalCostRow.getCell(i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCD5B4' } // Light orange
    };
    cumulativeCostRow.getCell(i + 2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFDE9D9' } // Lighter orange
    };
    
    // Add borders to cost cells
    laborCostRow.getCell(i + 2).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    facilityCostRow.getCell(i + 2).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    workstationCostRow.getCell(i + 2).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    backendCostRow.getCell(i + 2).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    totalCostRow.getCell(i + 2).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    cumulativeCostRow.getCell(i + 2).border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // Make total and cumulative rows bold
  for (let i = 0; i < months.length; i++) {
    totalCostRow.getCell(i + 2).font = { bold: true };
    cumulativeCostRow.getCell(i + 2).font = { bold: true };
  }
  
  // Freeze the top rows
  sheet.views = [
    { state: 'frozen', xSplit: 1, ySplit: 2, activeCell: 'B3' }
  ];
}

/**
 * Create the Stats sheet with project statistics
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function createStatsSheet(workbook, appState) {
  const {
    totalProjectCost,
    peakMonthlyCost,
    peakCrewSize,
    monthlyLaborCosts = [],
    monthlyFacilityCosts = [],
    monthlyWorkstationCosts = [],
    monthlyBackendCosts = [],
    monthlyCosts = [],
    cumulativeCosts = []
  } = appState;
  
  // Create the Stats sheet
  const sheet = workbook.addWorksheet('Stats');
  
  // Set column widths
  sheet.columns = [
    { header: '', width: 35 },
    { header: '', width: 20 },
    { header: '', width: 20 },
    { header: '', width: 20 }
  ];
  
  // Add project statistics section
  const titleRow = sheet.addRow(['Project Statistics']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  sheet.addRow([]);
  
  // Add key statistics
  const totalCostRow = sheet.addRow(['Total Project Cost', totalProjectCost]);
  totalCostRow.getCell(2).numFmt = '$#,##0';
  
  const peakCostRow = sheet.addRow(['Peak Monthly Cost', peakMonthlyCost]);
  peakCostRow.getCell(2).numFmt = '$#,##0';
  
  const peakCrewRow = sheet.addRow(['Peak Crew Size', `${peakCrewSize} crew members`]);
  
  sheet.addRow([]);
  
  // Add cost breakdown section
  const breakdownTitleRow = sheet.addRow(['Cost Breakdown']);
  breakdownTitleRow.getCell(1).font = { bold: true, size: 14 };
  breakdownTitleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  sheet.addRow([]);
  
  // Add cost breakdown table header
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
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Calculate total costs
  const totalLaborCost = monthlyLaborCosts.reduce((sum, cost) => sum + cost, 0);
  const totalFacilityCost = monthlyFacilityCosts.reduce((sum, cost) => sum + cost, 0);
  const totalWorkstationCost = monthlyWorkstationCosts.reduce((sum, cost) => sum + cost, 0);
  const totalBackendCost = monthlyBackendCosts.reduce((sum, cost) => sum + cost, 0);
  const totalCost = totalLaborCost + totalFacilityCost + totalWorkstationCost + totalBackendCost;
  
  // Calculate percentages
  const laborPercent = totalCost > 0 ? (totalLaborCost / totalCost * 100).toFixed(1) : '0.0';
  const facilityPercent = totalCost > 0 ? (totalFacilityCost / totalCost * 100).toFixed(1) : '0.0';
  const workstationPercent = totalCost > 0 ? (totalWorkstationCost / totalCost * 100).toFixed(1) : '0.0';
  const backendPercent = totalCost > 0 ? (totalBackendCost / totalCost * 100).toFixed(1) : '0.0';
  
  // Add cost breakdown rows
  const laborRow = sheet.addRow(['Labor', totalLaborCost, `${laborPercent}%`]);
  laborRow.getCell(2).numFmt = '$#,##0';
  laborRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD8E4BC' } // Light green
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  const facilityRow = sheet.addRow(['Facilities', totalFacilityCost, `${facilityPercent}%`]);
  facilityRow.getCell(2).numFmt = '$#,##0';
  facilityRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6B8B7' } // Light red
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  const workstationRow = sheet.addRow(['Workstations', totalWorkstationCost, `${workstationPercent}%`]);
  workstationRow.getCell(2).numFmt = '$#,##0';
  workstationRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB8CCE4' } // Light blue
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  const backendRow = sheet.addRow(['Backend Infrastructure', totalBackendCost, `${backendPercent}%`]);
  backendRow.getCell(2).numFmt = '$#,##0';
  backendRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCC0DA' } // Light purple
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  const totalRow = sheet.addRow(['TOTAL', totalCost, '100.0%']);
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
      bottom: { style: 'thin' },
      left: { style: 'thin' },
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
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function createFacilitiesSummarySheet(workbook, appState) {
  const { facilitiesData, facilitiesFunctions } = appState;
  
  // Create the Facilities Summary sheet
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
  if (facilitiesData && facilitiesFunctions) {
    const { calculateTotalFixedFacilityCosts, calculateTotalVariableFacilityCostsPerPerson } = facilitiesFunctions;
    
    if (calculateTotalFixedFacilityCosts && calculateTotalVariableFacilityCostsPerPerson) {
      const totalFixedCost = calculateTotalFixedFacilityCosts(facilitiesData);
      const totalVariableCost = calculateTotalVariableFacilityCostsPerPerson(facilitiesData);
      
      const fixedCostRow = sheet.addRow(['Total Fixed Monthly Facility Costs', totalFixedCost]);
      fixedCostRow.getCell(2).numFmt = '$#,##0';
      
      const variableCostRow = sheet.addRow(['Total Variable Facility Costs Per Person', totalVariableCost]);
      variableCostRow.getCell(2).numFmt = '$#,##0';
    }
  }
  
  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create the Workstation Summary sheet
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function createWorkstationSummarySheet(workbook, appState) {
  const { workstationData } = appState;
  
  // Create the Workstation Summary sheet
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
  if (workstationData && workstationData.workstationBundles) {
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
    
    // Add bundles
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
  
  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create the Facilities Detail sheet
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function createFacilitiesDetailSheet(workbook, appState) {
  const { facilitiesData } = appState;
  
  // Create the Facilities Detail sheet
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
  if (facilitiesData && facilitiesData.fixedFacilityCosts) {
    facilitiesData.fixedFacilityCosts.forEach(category => {
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
  if (facilitiesData && facilitiesData.variableFacilityCosts) {
    facilitiesData.variableFacilityCosts.forEach(category => {
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
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function createWorkstationsDetailSheet(workbook, appState) {
  const { workstationData } = appState;
  
  // Create the Workstations Detail sheet
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
  if (workstationData && workstationData.workstationBundles) {
    workstationData.workstationBundles.forEach(bundle => {
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
 * Get a color for a phase based on its name
 * @param {string} phaseName - The name of the phase
 * @returns {string} - The RGB color code (without alpha)
 */
function getPhaseColor(phaseName) {
  // Default colors for common phases
  const phaseColors = {
    'Pre-Production': 'FFD9D9', // Light red
    'Production': 'D9FFD9',     // Light green
    'Post-Production': 'D9D9FF', // Light blue
    'Development': 'FFFFD9',    // Light yellow
    'Testing': 'FFD9FF',        // Light purple
    'Deployment': 'D9FFFF'      // Light cyan
  };
  
  // Try to match the phase name with our predefined colors
  for (const [phase, color] of Object.entries(phaseColors)) {
    if (phaseName.includes(phase)) {
      return color;
    }
  }
  
  // If no match, generate a color based on the phase name
  return generateColorFromString(phaseName);
}

/**
 * Generate a color based on a string
 * @param {string} str - The input string
 * @returns {string} - The RGB color code
 */
function generateColorFromString(str) {
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
  
  return `${rr}${gg}${bb}`;
}

/**
 * Adjust the intensity of a color
 * @param {string} hexColor - The base color in hex format
 * @param {number} intensity - The intensity factor (0-1)
 * @returns {string} - The adjusted RGB color
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
  
  return `${rr}${gg}${bb}`;
}