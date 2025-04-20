/**
 * Simple Excel export that uses the original export function
 * and applies minimal styling to preserve colors
 */
import * as XLSX from 'xlsx';

/**
 * Export project data to a colored Excel file
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToColoredExcel(appState) {
  try {
    console.log('Starting simple colored Excel export...');
    
    // Use the original export function to get the exact data structure
    const { exportToExcel } = await import('./export-excel.js');
    const workbook = exportToExcel(appState, true);
    
    // Apply minimal styling to preserve colors
    applyMinimalStyling(workbook, appState);
    
    // Generate Excel file as a blob with options to preserve colors
    const wbout = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'binary',
      cellStyles: true
    });
    
    // Convert binary string to ArrayBuffer
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    
    // Create and return blob
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error in simple colored Excel export:', error);
    
    // Fall back to the original export function without styling
    console.log('Falling back to original export function without styling...');
    const { exportToExcel } = await import('./export-excel.js');
    return exportToExcel(appState, false);
  }
}

/**
 * Apply minimal styling to preserve colors
 * @param {Object} workbook - The XLSX workbook
 * @param {Object} appState - The application state
 */
function applyMinimalStyling(workbook, appState) {
  // Set workbook properties to ensure colors are preserved
  if (!workbook.Workbook) workbook.Workbook = {};
  if (!workbook.Workbook.Properties) workbook.Workbook.Properties = {};
  workbook.Workbook.Properties.ShowColors = true;
  
  // Apply styling to the Timeline sheet
  const timelineSheet = workbook.Sheets['Timeline'];
  if (timelineSheet) {
    styleTimelineSheet(timelineSheet, appState);
  }
}

/**
 * Style the Timeline sheet
 * @param {Object} worksheet - The worksheet
 * @param {Object} appState - The application state
 */
function styleTimelineSheet(worksheet, appState) {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Style header rows
  for (let c = range.s.c; c <= range.e.c; c++) {
    // Year header (row 0)
    const yearCellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const yearCell = worksheet[yearCellAddress];
    if (yearCell) {
      if (!yearCell.s) yearCell.s = {};
      yearCell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
      yearCell.s.font = { bold: true };
    }
    
    // Month header (row 1)
    const monthCellAddress = XLSX.utils.encode_cell({ r: 1, c });
    const monthCell = worksheet[monthCellAddress];
    if (monthCell) {
      if (!monthCell.s) monthCell.s = {};
      monthCell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
      monthCell.s.font = { bold: true };
    }
  }
  
  // Style phase rows and department rows
  for (let r = 2; r <= range.e.r; r++) {
    const firstCellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const firstCell = worksheet[firstCellAddress];
    
    if (firstCell && firstCell.v) {
      const cellValue = String(firstCell.v);
      
      // Check if this is a phase row (ends with ":")
      if (cellValue.endsWith(':')) {
        // This is a phase row
        const phaseName = cellValue.slice(0, -1);
        const phaseColor = getPhaseColor(phaseName);
        
        // Style the phase name
        if (!firstCell.s) firstCell.s = {};
        firstCell.s.font = { bold: true, italic: true };
        firstCell.s.fill = { patternType: "solid", fgColor: { rgb: phaseColor } };
        
        // Style the rest of the row
        for (let c = 1; c <= range.e.c; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];
          if (cell) {
            if (!cell.s) cell.s = {};
            cell.s.fill = { patternType: "solid", fgColor: { rgb: phaseColor } };
          }
        }
      } else if (!cellValue.endsWith(':')) {
        // This is a department row
        if (!firstCell.s) firstCell.s = {};
        firstCell.s.font = { bold: true };
        
        // Style crew count cells
        for (let c = 1; c <= range.e.c; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];
          
          if (cell && typeof cell.v === 'number' && cell.v > 0) {
            // Calculate color intensity based on value
            const intensity = Math.min(1, cell.v / 10);
            const colorRgb = adjustColorIntensity("D8E4BC", intensity);
            
            if (!cell.s) cell.s = {};
            cell.s.fill = { patternType: "solid", fgColor: { rgb: colorRgb } };
            cell.s.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            };
          }
        }
      }
    }
  }
  
  // Style cost rows at the bottom
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
  
  // Find cost rows by their labels
  for (let r = 2; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v) {
      const rowLabel = String(cell.v);
      const colorIndex = costRowLabels.findIndex(label => rowLabel === label);
      
      if (colorIndex !== -1) {
        // This is a cost row, apply appropriate color
        const color = costRowColors[colorIndex];
        
        // Make the label bold
        if (!cell.s) cell.s = {};
        cell.s.font = { bold: true };
        
        // Apply color to all cells in the row
        for (let c = 1; c <= range.e.c; c++) {
          const costCellAddress = XLSX.utils.encode_cell({ r, c });
          const costCell = worksheet[costCellAddress];
          
          if (costCell && typeof costCell.v === 'number') {
            if (!costCell.s) costCell.s = {};
            costCell.s.fill = { patternType: "solid", fgColor: { rgb: color } };
            costCell.s.numFmt = "$#,##0";
            costCell.s.border = {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            };
            
            // Make total and cumulative rows bold
            if (colorIndex >= 4) {
              costCell.s.font = { bold: true };
            }
          }
        }
      }
    }
  }
}

/**
 * Get a color for a phase based on its name
 * @param {string} phaseName - The name of the phase
 * @returns {string} - The RGB color code
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