/**
 * Excel formatting using ExcelJS for better color support
 * while preserving the exact data structure
 */
import * as XLSX from 'xlsx';

/**
 * Export project data to a colored Excel file while preserving the exact data structure
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToColoredExcel(appState) {
  // First, use the original export function to get the exact data structure
  const { exportToExcel } = await import('./export-excel.js');
  const xlsxWorkbook = exportToExcel(appState, true); // Get the workbook without downloading
  
  // Convert XLSX workbook to ExcelJS workbook for better color support
  const ExcelJS = (await import('exceljs')).default;
  const excelJsWorkbook = await convertToExcelJsWorkbook(xlsxWorkbook, ExcelJS);
  
  // Apply enhanced color formatting
  await applyColorFormatting(excelJsWorkbook, appState);
  
  // Generate Excel file as a blob
  const buffer = await excelJsWorkbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Convert XLSX workbook to ExcelJS workbook
 * @param {Object} xlsxWorkbook - The XLSX workbook
 * @param {Object} ExcelJS - The ExcelJS library
 * @returns {Promise<Object>} - The ExcelJS workbook
 */
async function convertToExcelJsWorkbook(xlsxWorkbook, ExcelJS) {
  // Create a new ExcelJS workbook
  const excelJsWorkbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  excelJsWorkbook.creator = 'Crew Planner';
  excelJsWorkbook.lastModifiedBy = 'Crew Planner';
  excelJsWorkbook.created = new Date();
  excelJsWorkbook.modified = new Date();
  
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
 * @param {Object} workbook - The ExcelJS workbook
 * @param {Object} appState - The application state
 */
async function applyColorFormatting(workbook, appState) {
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
 * @param {Object} worksheet - The worksheet
 * @param {Object} appState - The application state
 */
function formatTimelineSheet(worksheet, appState) {
  const { phases } = appState;
  
  // Create a map of phase names to colors
  const phaseColorMap = {};
  if (phases) {
    phases.forEach(phase => {
      phaseColorMap[phase.name] = getPhaseColor(phase.name);
    });
  }
  
  // Format header rows
  const yearHeaderRow = worksheet.getRow(1);
  const monthHeaderRow = worksheet.getRow(2);
  
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
  
  // Process each row to identify phases and departments
  let currentPhaseColor = null;
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return; // Skip header rows
    
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string' && value.includes(':')) {
      // This is a phase header row
      const phaseName = value.replace(':', '');
      currentPhaseColor = phaseColorMap[phaseName] || getPhaseColor(phaseName);
      
      // Apply color to the entire row
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + currentPhaseColor }
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
            fgColor: { argb: 'FF' + colorRgb }
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
    } else if (value && typeof value === 'string') {
      // Check if this is a cost row
      const costRowLabels = [
        'Monthly Labor Cost',
        'Monthly Facility Cost',
        'Workstation Cost (One-time)',
        'Backend Infrastructure Cost',
        'Total Monthly Cost',
        'Cumulative Cost'
      ];
      
      const costRowColors = [
        'D8E4BC', // Light green - Labor
        'E6B8B7', // Light red - Facility
        'B8CCE4', // Light blue - Workstation
        'CCC0DA', // Light purple - Backend
        'FCD5B4', // Light orange - Total
        'FDE9D9'  // Lighter orange - Cumulative
      ];
      
      const colorIndex = costRowLabels.findIndex(label => value === label);
      
      if (colorIndex !== -1) {
        // This is a cost row, apply appropriate color
        const color = costRowColors[colorIndex];
        
        // Make the label bold
        firstCell.font = { bold: true };
        
        // Apply color to all cells in the row
        for (let colNumber = 2; colNumber <= row.cellCount; colNumber++) {
          const cell = row.getCell(colNumber);
          if (cell.value !== null && cell.value !== undefined) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF' + color }
            };
            cell.numFmt = '$#,##0';
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Make the total and cumulative rows bold
            if (colorIndex >= 4) {
              cell.font = { bold: true };
            }
          }
        }
      }
    }
  });
}

/**
 * Format the Stats sheet with colors
 * @param {Object} worksheet - The worksheet
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
        color = 'D8E4BC'; // Light green
      } else if (lowerValue.includes('facilities') || lowerValue.includes('facility')) {
        color = 'E6B8B7'; // Light red
      } else if (lowerValue.includes('workstation')) {
        color = 'B8CCE4'; // Light blue
      } else if (lowerValue.includes('backend')) {
        color = 'CCC0DA'; // Light purple
      } else if (lowerValue.includes('total')) {
        color = 'FCD5B4'; // Light orange
        row.eachCell((cell) => {
          cell.font = { bold: true };
        });
      } else if (lowerValue.includes('cumulative')) {
        color = 'FDE9D9'; // Lighter orange
        row.eachCell((cell) => {
          cell.font = { bold: true };
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
              fgColor: { argb: 'FF' + color }
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
 * @param {Object} worksheet - The worksheet
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
 * @param {Object} worksheet - The worksheet
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