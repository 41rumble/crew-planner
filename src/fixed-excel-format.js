/**
 * Fixed Excel formatting that preserves the exact data structure
 * while ensuring colors are properly applied
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
  const workbook = exportToExcel(appState, true); // Get the workbook without downloading
  
  // Apply enhanced formatting to the workbook
  const formattedWorkbook = enhanceExcelFormatting(workbook, appState);
  
  // Set workbook properties to ensure colors are preserved
  if (!formattedWorkbook.Workbook) formattedWorkbook.Workbook = {};
  if (!formattedWorkbook.Workbook.Properties) formattedWorkbook.Workbook.Properties = {};
  formattedWorkbook.Workbook.Properties.ShowColors = true;
  
  // Generate Excel file as a blob with options to preserve colors
  const wbout = XLSX.write(formattedWorkbook, { 
    bookType: 'xlsx', 
    type: 'binary',
    cellStyles: true,
    bookSST: false
  });
  
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
 * Apply enhanced formatting to an Excel workbook
 * @param {Object} workbook - The XLSX workbook to format
 * @param {Object} appState - The application state
 * @returns {Object} - The formatted workbook
 */
function enhanceExcelFormatting(workbook, appState) {
  // Format each worksheet in the workbook
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    
    // Apply enhanced column widths based on sheet name
    applyEnhancedColumnWidths(worksheet, sheetName);
    
    // Apply cell styling with color preservation
    applyEnhancedCellStyling(worksheet, sheetName, appState);
  });
  
  return workbook;
}

/**
 * Apply wider column widths to a worksheet to ensure content is fully visible
 * @param {Object} worksheet - The worksheet to format
 * @param {string} sheetName - The name of the worksheet
 */
function applyEnhancedColumnWidths(worksheet, sheetName) {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Set enhanced column widths (wider than the defaults)
  const enhancedWidths = {
    'Timeline': [30, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    'Stats': [35, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'Facilities Summary': [35, 20, 20, 20],
    'Workstation Summary': [35, 20, 20, 20, 20],
    'Facilities Detail': [25, 35, 20, 45],
    'Workstations Detail': [25, 35, 20, 15, 20, 35]
  };
  
  // Apply column widths if defined for this sheet
  if (enhancedWidths[sheetName]) {
    const widths = enhancedWidths[sheetName];
    const cols = [];
    
    // Create column width objects
    for (let i = 0; i <= range.e.c; i++) {
      cols.push({ wch: widths[i] || 15 }); // Use wider default width if not specified
    }
    
    worksheet['!cols'] = cols;
  } else {
    // For any other sheets, use a reasonable default width
    const cols = [];
    for (let i = 0; i <= range.e.c; i++) {
      cols.push({ wch: i === 0 ? 30 : 15 }); // First column wider, others standard
    }
    worksheet['!cols'] = cols;
  }
}

/**
 * Apply enhanced cell styling to a worksheet with better color preservation
 * @param {Object} worksheet - The worksheet to format
 * @param {string} sheetName - The name of the worksheet
 * @param {Object} appState - The application state
 */
function applyEnhancedCellStyling(worksheet, sheetName, appState) {
  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Apply specific styling based on sheet type
  if (sheetName === 'Timeline') {
    formatEnhancedTimelineSheet(worksheet, range, appState);
  } else if (sheetName === 'Stats') {
    formatEnhancedStatsSheet(worksheet, range);
  } else if (sheetName.includes('Facilities')) {
    formatEnhancedFacilitiesSheet(worksheet, range);
  } else if (sheetName.includes('Workstation')) {
    formatEnhancedWorkstationSheet(worksheet, range);
  }
}

/**
 * Format the Timeline sheet with enhanced styling and color preservation
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 * @param {Object} appState - The application state
 */
function formatEnhancedTimelineSheet(worksheet, range, appState) {
  const { phases } = appState;
  
  // Format year header row (row 0)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[cellAddress] || {};
    worksheet[cellAddress] = cell;
    
    cell.s = {
      font: { bold: true },
      fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Format month header row (row 1)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 1, c });
    const cell = worksheet[cellAddress] || {};
    worksheet[cellAddress] = cell;
    
    cell.s = {
      font: { bold: true },
      fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
  }
  
  // Create a map of phase names to colors
  const phaseColorMap = {};
  if (phases) {
    phases.forEach(phase => {
      phaseColorMap[phase.name] = getPhaseColor(phase.name);
    });
  }
  
  // Format section headers (phase names)
  for (let r = 2; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' && cell.v.includes(':')) {
      // This is a phase header row
      const phaseName = cell.v.replace(':', '');
      const phaseColor = phaseColorMap[phaseName] || getPhaseColor(phaseName);
      
      // Apply phase color to the phase header
      cell.s = {
        font: { bold: true, italic: true },
        fill: { patternType: "solid", fgColor: { rgb: phaseColor } }
      };
      
      // Apply phase color to the entire row
      for (let c = 1; c <= range.e.c; c++) {
        const rowCellAddress = XLSX.utils.encode_cell({ r, c });
        const rowCell = worksheet[rowCellAddress] || {};
        worksheet[rowCellAddress] = rowCell;
        
        rowCell.s = {
          fill: { patternType: "solid", fgColor: { rgb: phaseColor } }
        };
      }
    } else if (cell && cell.v && typeof cell.v === 'string' && !cell.v.includes(':')) {
      // This is a department row
      cell.s = {
        font: { bold: true }
      };
      
      // Format crew count cells with color intensity based on value
      for (let c = 1; c <= range.e.c; c++) {
        const crewCellAddress = XLSX.utils.encode_cell({ r, c });
        const crewCell = worksheet[crewCellAddress];
        
        if (crewCell && typeof crewCell.v === 'number' && crewCell.v > 0) {
          // Calculate color intensity based on value
          const baseColor = "D8E4BC"; // Light green
          const intensity = Math.min(1, crewCell.v / 10); // Scale based on crew size
          const colorRgb = adjustColorIntensity(baseColor, intensity);
          
          crewCell.s = {
            fill: { patternType: "solid", fgColor: { rgb: colorRgb } },
            alignment: { horizontal: "center" },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          };
        }
      }
    }
  }
  
  // Format cost rows at the bottom
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
        cell.s = {
          font: { bold: true }
        };
        
        // Apply color to all cells in the row
        for (let c = 1; c <= range.e.c; c++) {
          const costCellAddress = XLSX.utils.encode_cell({ r, c });
          const costCell = worksheet[costCellAddress];
          
          if (costCell && typeof costCell.v === 'number') {
            costCell.s = {
              fill: { patternType: "solid", fgColor: { rgb: color } },
              numFmt: "$#,##0",
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
              },
              font: colorIndex >= 4 ? { bold: true } : undefined
            };
          }
        }
      }
    }
  }
}

/**
 * Format the Stats sheet with enhanced styling
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatEnhancedStatsSheet(worksheet, range) {
  // Format section headers
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' &&
        (cell.v === 'Project Statistics' ||
         cell.v === 'Cost Breakdown' ||
         cell.v === 'Monthly Cost Analysis' ||
         cell.v === 'Department Rates by Phase:')) {
      cell.s = {
        font: { bold: true, sz: 14 },
        fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } }
      };
    }
  }
  
  // Format table headers
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' &&
        (cell.v === 'Category' || cell.v === 'Department')) {
      for (let c = 0; c <= range.e.c; c++) {
        const headerCellAddress = XLSX.utils.encode_cell({ r, c });
        const headerCell = worksheet[headerCellAddress];
        
        if (headerCell) {
          headerCell.s = {
            font: { bold: true },
            fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" }
            }
          };
        }
      }
    }
  }
  
  // Format cost cells
  for (let r = 0; r <= range.e.r; r++) {
    const rowHeaderAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const rowHeader = worksheet[rowHeaderAddress];
    
    if (rowHeader && rowHeader.v) {
      const headerText = String(rowHeader.v).toLowerCase();
      let color = null;
      let isBold = false;
      
      // Determine color based on row header
      if (headerText.includes('labor')) {
        color = "D8E4BC"; // Light green
      } else if (headerText.includes('facilities') || headerText.includes('facility')) {
        color = "E6B8B7"; // Light red
      } else if (headerText.includes('workstation')) {
        color = "B8CCE4"; // Light blue
      } else if (headerText.includes('backend')) {
        color = "CCC0DA"; // Light purple
      } else if (headerText.includes('total')) {
        color = "FCD5B4"; // Light orange
        isBold = true;
      } else if (headerText.includes('cumulative')) {
        color = "FDE9D9"; // Lighter orange
        isBold = true;
      }
      
      if (color) {
        // Apply color to numeric cells in the row
        for (let c = 1; c <= range.e.c; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];
          
          if (cell && typeof cell.v === 'number') {
            cell.s = {
              numFmt: "$#,##0",
              fill: { patternType: "solid", fgColor: { rgb: color } },
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" }
              },
              font: isBold ? { bold: true } : undefined
            };
          }
        }
      }
    }
  }
}

/**
 * Format the Facilities sheets with enhanced styling
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatEnhancedFacilitiesSheet(worksheet, range) {
  // Format section headers
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' &&
        (cell.v.includes('Fixed') || cell.v.includes('Variable') ||
         cell.v.includes('Summary') || cell.v.includes('Allocation'))) {
      cell.s = {
        font: { bold: true, sz: 14 },
        fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } }
      };
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
      cell.s = {
        font: { bold: true },
        fill: { patternType: "solid", fgColor: { rgb: "F2F2F2" } }
      };
    }
  }
  
  // Format cost cells
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 2; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell && typeof cell.v === 'number') {
        cell.s = {
          numFmt: "$#,##0",
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
      }
    }
  }
}

/**
 * Format the Workstation sheets with enhanced styling
 * @param {Object} worksheet - The worksheet to format
 * @param {Object} range - The range of the worksheet
 */
function formatEnhancedWorkstationSheet(worksheet, range) {
  // Format section headers
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' &&
        (cell.v.includes('Bundle') || cell.v.includes('Assignment') ||
         cell.v.includes('Backend') || cell.v.includes('Summary'))) {
      cell.s = {
        font: { bold: true, sz: 14 },
        fill: { patternType: "solid", fgColor: { rgb: "E0E0E0" } }
      };
    }
  }
  
  // Format bundle/category rows
  for (let r = 0; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];
    
    if (cell && cell.v && typeof cell.v === 'string' &&
        cell.v === 'Bundle') {
      cell.s = {
        font: { bold: true },
        fill: { patternType: "solid", fgColor: { rgb: "F2F2F2" } }
      };
    }
  }
  
  // Format cost and total cells
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 2; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell && typeof cell.v === 'number' && (c === 2 || c === 4)) {
        cell.s = {
          numFmt: "$#,##0",
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          }
        };
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