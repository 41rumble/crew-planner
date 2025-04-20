/**
 * Excel color wrapper that preserves the exact data structure from export-excel.js
 * but adds color formatting using ExcelJS
 */
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

/**
 * Export project data to a colored Excel file while preserving the exact data structure
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToColoredExcel(appState) {
  // First, use the original export function to get the exact data structure
  const { exportToExcel } = await import('./export-excel.js');
  const workbook = exportToExcel(appState, true); // Get the workbook without downloading
  
  // Convert XLSX workbook to ExcelJS workbook for better color support
  const excelJsWorkbook = await convertToExcelJsWorkbook(workbook);
  
  // Apply enhanced color formatting
  applyColorFormatting(excelJsWorkbook, appState);
  
  // Generate Excel file as a blob
  const buffer = await excelJsWorkbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Convert XLSX workbook to ExcelJS workbook
 * @param {Object} xlsxWorkbook - The XLSX workbook
 * @returns {Promise<ExcelJS.Workbook>} - The ExcelJS workbook
 */
async function convertToExcelJsWorkbook(xlsxWorkbook) {
  // Create a new ExcelJS workbook
  const excelJsWorkbook = new ExcelJS.Workbook();
  
  // Convert XLSX workbook to binary string
  const wbout = XLSX.write(xlsxWorkbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Load the ArrayBuffer into ExcelJS workbook
  await excelJsWorkbook.xlsx.load(buf);
  
  return excelJsWorkbook;
}

/**
 * Apply color formatting to the ExcelJS workbook
 * @param {ExcelJS.Workbook} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
function applyColorFormatting(workbook, appState) {
  // Format each worksheet
  workbook.eachSheet((worksheet, sheetId) => {
    const sheetName = worksheet.name;
    
    if (sheetName === 'Timeline') {
      formatTimelineSheet(worksheet, appState);
    } else if (sheetName === 'Stats') {
      formatStatsSheet(worksheet);
    } else if (sheetName.includes('Facilities')) {
      formatFacilitiesSheet(worksheet);
    } else if (sheetName.includes('Workstation')) {
      formatWorkstationSheet(worksheet);
    }
  });
}

/**
 * Format the Timeline sheet with colors
 * @param {ExcelJS.Worksheet} worksheet - The worksheet
 * @param {Object} appState - The application state
 */
function formatTimelineSheet(worksheet, appState) {
  const { phases } = appState;
  
  // Format header rows
  worksheet.getRow(1).eachCell((cell) => {
    if (cell.value) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
    }
  });
  
  worksheet.getRow(2).eachCell((cell) => {
    if (cell.value) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
    }
  });
  
  // Find phase rows and apply colors
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return; // Skip header rows
    
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string' && value.includes(':')) {
      // This is a phase header row
      const phaseName = value.replace(':', '');
      const phaseColor = getPhaseColor(phaseName);
      
      // Apply color to the entire row
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: phaseColor }
        };
      });
      
      // Make the phase name bold and italic
      firstCell.font = { bold: true, italic: true };
    } else if (value && typeof value === 'string' && !value.includes(':')) {
      // This is a department row
      firstCell.font = { bold: true };
      
      // Apply color intensity to crew count cells
      for (let colNumber = 2; colNumber <= row.cellCount; colNumber++) {
        const cell = row.getCell(colNumber);
        const crewCount = cell.value;
        
        if (crewCount && typeof crewCount === 'number' && crewCount > 0) {
          // Calculate color intensity based on crew size
          const intensity = Math.min(1, crewCount / 10); // Scale based on crew size
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
    }
  });
  
  // Format cost rows at the bottom
  const rowCount = worksheet.rowCount;
  const costRows = [
    { rowNumber: rowCount - 5, color: 'FFD8E4BC' }, // Labor costs - Light green
    { rowNumber: rowCount - 4, color: 'FFE6B8B7' }, // Facility costs - Light red
    { rowNumber: rowCount - 3, color: 'FFB8CCE4' }, // Workstation costs - Light blue
    { rowNumber: rowCount - 2, color: 'FFCCC0DA' }, // Backend costs - Light purple
    { rowNumber: rowCount - 1, color: 'FFFCD5B4' }, // Total costs - Light orange
    { rowNumber: rowCount, color: 'FFFDE9D9' }      // Cumulative costs - Lighter orange
  ];
  
  costRows.forEach(({ rowNumber, color }) => {
    const row = worksheet.getRow(rowNumber);
    
    // Make the row header bold
    row.getCell(1).font = { bold: true };
    
    // Apply color to cost cells
    for (let colNumber = 2; colNumber <= row.cellCount; colNumber++) {
      const cell = row.getCell(colNumber);
      if (cell.value !== null && cell.value !== undefined) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color }
        };
        cell.numFmt = '$#,##0';
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
    
    // Make the total and cumulative rows bold
    if (rowNumber >= rowCount - 1) {
      row.eachCell((cell) => {
        if (cell.font) {
          cell.font.bold = true;
        } else {
          cell.font = { bold: true };
        }
      });
    }
  });
}

/**
 * Format the Stats sheet with colors
 * @param {ExcelJS.Worksheet} worksheet - The worksheet
 */
function formatStatsSheet(worksheet) {
  // Format section headers
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string' && 
        (value === 'Project Statistics' || 
         value === 'Cost Breakdown' || 
         value === 'Monthly Cost Analysis' || 
         value === 'Department Rates by Phase:')) {
      firstCell.font = { bold: true, size: 14 };
      firstCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Format table headers
    if (value && typeof value === 'string' && 
        (value === 'Category' || value === 'Department')) {
      row.eachCell((cell) => {
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
    }
    
    // Format cost cells
    if (value && typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      let color = null;
      
      if (lowerValue.includes('labor')) {
        color = 'FFD8E4BC'; // Light green
      } else if (lowerValue.includes('facilities') || lowerValue.includes('facility')) {
        color = 'FFE6B8B7'; // Light red
      } else if (lowerValue.includes('workstation')) {
        color = 'FFB8CCE4'; // Light blue
      } else if (lowerValue.includes('backend')) {
        color = 'FFCCC0DA'; // Light purple
      } else if (lowerValue.includes('total')) {
        color = 'FFFCD5B4'; // Light orange
        row.eachCell((cell) => {
          if (cell.font) {
            cell.font.bold = true;
          } else {
            cell.font = { bold: true };
          }
        });
      } else if (lowerValue.includes('cumulative')) {
        color = 'FFFDE9D9'; // Lighter orange
        row.eachCell((cell) => {
          if (cell.font) {
            cell.font.bold = true;
          } else {
            cell.font = { bold: true };
          }
        });
      }
      
      if (color) {
        // Apply color to numeric cells in the row
        for (let colNumber = 2; colNumber <= row.cellCount; colNumber++) {
          const cell = row.getCell(colNumber);
          if (cell.value !== null && cell.value !== undefined && typeof cell.value === 'number') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: color }
            };
            cell.numFmt = '$#,##0';
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        }
      }
    }
  });
}

/**
 * Format the Facilities sheets with colors
 * @param {ExcelJS.Worksheet} worksheet - The worksheet
 */
function formatFacilitiesSheet(worksheet) {
  // Format section headers
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string' && 
        (value.includes('Fixed') || value.includes('Variable') || 
         value.includes('Summary') || value.includes('Allocation'))) {
      firstCell.font = { bold: true, size: 14 };
      firstCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Format category rows
    if (value && typeof value === 'string' && 
        !value.includes('Fixed') && !value.includes('Variable') && 
        !value.includes('Summary') && !value.includes('Allocation') &&
        !value.includes('Category')) {
      firstCell.font = { bold: true };
      firstCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
    
    // Format cost cells
    for (let colNumber = 3; colNumber <= row.cellCount; colNumber++) {
      const cell = row.getCell(colNumber);
      if (cell.value !== null && cell.value !== undefined && typeof cell.value === 'number') {
        cell.numFmt = '$#,##0';
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
  });
}

/**
 * Format the Workstation sheets with colors
 * @param {ExcelJS.Worksheet} worksheet - The worksheet
 */
function formatWorkstationSheet(worksheet) {
  // Format section headers
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string' && 
        (value.includes('Bundle') || value.includes('Assignment') || 
         value.includes('Backend') || value.includes('Summary'))) {
      firstCell.font = { bold: true, size: 14 };
      firstCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Format bundle/category rows
    if (value && typeof value === 'string' && value === 'Bundle') {
      firstCell.font = { bold: true };
      firstCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
    
    // Format cost and total cells
    for (let colNumber = 3; colNumber <= row.cellCount; colNumber++) {
      const cell = row.getCell(colNumber);
      if (cell.value !== null && cell.value !== undefined && 
          typeof cell.value === 'number' && 
          (colNumber === 3 || colNumber === 5)) {
        cell.numFmt = '$#,##0';
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
  });
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