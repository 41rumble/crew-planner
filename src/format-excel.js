/**
 * Format Excel export with styling
 */
import * as XLSX from 'xlsx';

/**
 * Apply formatting to an Excel workbook
 * @param {Object} workbook - The XLSX workbook to format
 * @returns {Object} - The formatted workbook
 */
export function formatExcelWorkbook(workbook) {
  // Format each worksheet in the workbook
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    
    // Apply column widths based on sheet name
    applyColumnWidths(worksheet, sheetName);
    
    // Apply cell styling
    applyCellStyling(worksheet, sheetName);
  });
  
  return workbook;
}

/**
 * Apply appropriate column widths to a worksheet
 * @param {Object} worksheet - The worksheet to format
 * @param {string} sheetName - The name of the worksheet
 */
function applyColumnWidths(worksheet, sheetName) {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Set default column widths
  const defaultWidths = {
    'Timeline': [25, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
    'Stats': [25, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    'Facilities Summary': [25, 15, 15, 15],
    'Workstation Summary': [25, 15, 15, 15, 15],
    'Facilities Detail': [20, 30, 15, 40],
    'Workstations Detail': [20, 30, 15, 10, 15, 30]
  };
  
  // Apply column widths if defined for this sheet
  if (defaultWidths[sheetName]) {
    const widths = defaultWidths[sheetName];
    const cols = [];
    
    // Create column width objects
    for (let i = 0; i <= range.e.c; i++) {
      cols.push({ wch: widths[i] || 12 }); // Use default width if not specified
    }
    
    worksheet['!cols'] = cols;
  }
}

/**
 * Apply cell styling to a worksheet
 * @param {Object} worksheet - The worksheet to format
 * @param {string} sheetName - The name of the worksheet
 */
function applyCellStyling(worksheet, sheetName) {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Apply header styling to the first row
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      // Add header styling
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true, color: { rgb: "FFFFFF" } };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "4F81BD" } };
      cell.s.alignment = { horizontal: "center" };
      cell.s.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    }
  }
  
  // Apply specific styling based on sheet type
  if (sheetName === 'Timeline') {
    formatTimelineSheet(worksheet, range);
  } else if (sheetName === 'Stats') {
    formatStatsSheet(worksheet, range);
  } else if (sheetName.includes('Facilities')) {
    formatFacilitiesSheet(worksheet, range);
  } else if (sheetName.includes('Workstation')) {
    formatWorkstationSheet(worksheet, range);
  }
}

/**
 * Format the Timeline sheet
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatTimelineSheet(worksheet, range) {
  // Format year header row (row 0)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
    }
  }
  
  // Format month header row (row 1)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 1, c });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
      cell.s.alignment = { horizontal: "center" };
    }
  }
  
  // Format department names (first column)
  for (let r = 2; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
    }
  }
  
  // Format crew count cells
  for (let r = 2; r <= range.e.r; r++) {
    for (let c = 1; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v > 0) {
        if (!cell.s) cell.s = {};
        cell.s.fill = { patternType: "solid", fgColor: { rgb: "D8E4BC" } }; // Light green
        cell.s.alignment = { horizontal: "center" };
      }
    }
  }
  
  // Format total row (last row)
  const lastRow = range.e.r;
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: lastRow, c });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "C5D9F1" } }; // Light blue
      cell.s.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };
    }
  }
}

/**
 * Format the Stats sheet
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatStatsSheet(worksheet, range) {
  // Format month header row
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
      cell.s.alignment = { horizontal: "center" };
    }
  }
  
  // Format row headers (first column)
  for (let r = 1; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
    }
  }
  
  // Format cost cells
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = 1; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell && typeof cell.v === 'number') {
        if (!cell.s) cell.s = {};
        cell.s.numFmt = "$#,##0"; // Currency format
        
        // Color-code different cost types
        if (r === 1) { // Labor costs
          cell.s.fill = { patternType: "solid", fgColor: { rgb: "D8E4BC" } }; // Light green
        } else if (r === 2) { // Facilities costs
          cell.s.fill = { patternType: "solid", fgColor: { rgb: "E6B8B7" } }; // Light red
        } else if (r === 3) { // Workstation costs
          cell.s.fill = { patternType: "solid", fgColor: { rgb: "B8CCE4" } }; // Light blue
        } else if (r === 4) { // Backend costs
          cell.s.fill = { patternType: "solid", fgColor: { rgb: "CCC0DA" } }; // Light purple
        } else if (r === 5) { // Total costs
          cell.s.fill = { patternType: "solid", fgColor: { rgb: "FCD5B4" } }; // Light orange
          cell.s.font = { bold: true };
        } else if (r === 6) { // Cumulative costs
          cell.s.fill = { patternType: "solid", fgColor: { rgb: "FDE9D9" } }; // Lighter orange
          cell.s.font = { bold: true };
        }
      }
    }
  }
}

/**
 * Format the Facilities sheets
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatFacilitiesSheet(worksheet, range) {
  // Format section headers
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' && 
        (cell.v.includes('Fixed') || cell.v.includes('Variable') || 
         cell.v.includes('Summary') || cell.v.includes('Allocation'))) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true, sz: 14 };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
    }
  }
  
  // Format category rows
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' && 
        !cell.v.includes('Fixed') && !cell.v.includes('Variable') && 
        !cell.v.includes('Summary') && !cell.v.includes('Allocation') &&
        !cell.v.includes('Category')) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "F2F2F2" } };
    }
  }
  
  // Format cost cells
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 2; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell && typeof cell.v === 'number') {
        if (!cell.s) cell.s = {};
        cell.s.numFmt = "$#,##0"; // Currency format
      }
    }
  }
}

/**
 * Format the Workstation sheets
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatWorkstationSheet(worksheet, range) {
  // Format section headers
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' && 
        (cell.v.includes('Bundle') || cell.v.includes('Assignment') || 
         cell.v.includes('Backend') || cell.v.includes('Summary'))) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true, sz: 14 };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
    }
  }
  
  // Format bundle/category rows
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' && 
        cell.v === 'Bundle') {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "F2F2F2" } };
    }
  }
  
  // Format cost and total cells
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 2; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell && typeof cell.v === 'number' && (c === 2 || c === 4)) {
        if (!cell.s) cell.s = {};
        cell.s.numFmt = "$#,##0"; // Currency format
      }
    }
  }
}

/**
 * Export project data to a formatted Excel file
 * @param {Object} appState - The current application state
 * @returns {Blob} - A Blob containing the formatted Excel file
 */
export function exportToFormattedExcel(appState) {
  // First, create the Excel workbook using the original function
  const { exportToExcel } = require('./export-excel.js');
  const workbook = exportToExcel(appState, true); // Pass true to get the workbook instead of downloading
  
  // Apply formatting to the workbook
  const formattedWorkbook = formatExcelWorkbook(workbook);
  
  // Generate Excel file as a blob
  const wbout = XLSX.write(formattedWorkbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Create and return blob
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}