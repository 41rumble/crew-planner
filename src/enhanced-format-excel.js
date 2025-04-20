/**
 * Enhanced Excel formatting with improved cell spacing and phase coloring
 */
import * as XLSX from 'xlsx';

/**
 * Apply enhanced formatting to an Excel workbook
 * @param {Object} workbook - The XLSX workbook to format
 * @returns {Object} - The formatted workbook
 */
export function enhanceExcelFormatting(workbook) {
  // Add a custom property to ensure colors are preserved
  if (!workbook.Workbook) workbook.Workbook = {};
  if (!workbook.Workbook.Properties) workbook.Workbook.Properties = {};
  workbook.Workbook.Properties.ShowColors = true;

  // Format each worksheet in the workbook
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];

    // Apply enhanced column widths based on sheet name
    applyEnhancedColumnWidths(worksheet, sheetName);

    // Apply cell styling with color preservation
    applyEnhancedCellStyling(worksheet, sheetName);
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
 */
function applyEnhancedCellStyling(worksheet, sheetName) {
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
      cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
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
    formatEnhancedTimelineSheet(worksheet, range);
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
 */
function formatEnhancedTimelineSheet(worksheet, range) {
  // Format year header row (row 0)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const cell = worksheet[cellAddress];

    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
      cell.s.alignment = { horizontal: "center", vertical: "center" };
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
      cell.s.alignment = { horizontal: "center", vertical: "center" };
    }
  }

  // Format section headers (phase names)
  for (let r = 2; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];

    if (cell && cell.v && typeof cell.v === 'string' && cell.v.includes(':')) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true, italic: true };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };

      // Apply phase color to the entire row
      const phaseName = cell.v.replace(':', '');
      const phaseColor = getPhaseColor(phaseName);

      if (phaseColor) {
        // Apply lighter version of the phase color to the row
        for (let c = 0; c <= range.e.c; c++) {
          const rowCellAddress = XLSX.utils.encode_cell({ r, c });
          const rowCell = worksheet[rowCellAddress];

          if (rowCell) {
            if (!rowCell.s) rowCell.s = {};
            rowCell.s.fill = { patternType: "solid", fgColor: { rgb: phaseColor } };
          }
        }
      }
    }
  }

  // Format department names (first column)
  for (let r = 2; r <= range.e.r; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = worksheet[cellAddress];

    if (cell && cell.v && typeof cell.v === 'string' && !cell.v.includes(':')) {
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true };
    }
  }

  // Format crew count cells with color intensity based on value
  for (let r = 2; r <= range.e.r; r++) {
    for (let c = 1; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];

      if (cell && typeof cell.v === 'number' && cell.v > 0) {
        if (!cell.s) cell.s = {};

        // Calculate color intensity based on value
        // Higher values get darker green
        const baseColor = "D8E4BC"; // Light green
        const intensity = Math.min(1, cell.v / 10); // Scale based on crew size
        const colorRgb = adjustColorIntensity(baseColor, intensity);

        cell.s.fill = { patternType: "solid", fgColor: { rgb: colorRgb } };
        cell.s.alignment = { horizontal: "center" };
        cell.s.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" }
        };
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
      cell.s.alignment = { horizontal: "center" };
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
      if (!cell.s) cell.s = {};
      cell.s.font = { bold: true, sz: 14 };
      cell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
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
          if (!headerCell.s) headerCell.s = {};
          headerCell.s.font = { bold: true };
          headerCell.s.fill = { patternType: "solid", fgColor: { rgb: "E0E0E0" } };
          headerCell.s.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          };
        }
      }
    }
  }

  // Format cost cells
  for (let r = 0; r <= range.e.r; r++) {
    for (let c = 1; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];

      if (cell && typeof cell.v === 'number') {
        if (!cell.s) cell.s = {};
        cell.s.numFmt = "$#,##0"; // Currency format

        // Get the row header to determine the type of cost
        const rowHeaderAddress = XLSX.utils.encode_cell({ r, c: 0 });
        const rowHeader = worksheet[rowHeaderAddress];

        if (rowHeader && rowHeader.v) {
          const headerText = String(rowHeader.v).toLowerCase();

          // Color-code different cost types
          if (headerText.includes('labor')) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "D8E4BC" } }; // Light green
          } else if (headerText.includes('facilities') || headerText.includes('facility')) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "E6B8B7" } }; // Light red
          } else if (headerText.includes('workstation')) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "B8CCE4" } }; // Light blue
          } else if (headerText.includes('backend')) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "CCC0DA" } }; // Light purple
          } else if (headerText.includes('total')) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "FCD5B4" } }; // Light orange
            cell.s.font = { bold: true };
          } else if (headerText.includes('cumulative')) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "FDE9D9" } }; // Lighter orange
            cell.s.font = { bold: true };
          }
        }

        // Add borders to all cost cells
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

/**
 * Export project data to an enhanced formatted Excel file
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToEnhancedExcel(appState) {
  // First, create the Excel workbook using the original function
  const { exportToExcel } = await import('./export-excel.js');
  const workbook = exportToExcel(appState, true); // Pass true to get the workbook instead of downloading

  // Apply enhanced formatting to the workbook
  const formattedWorkbook = enhanceExcelFormatting(workbook);

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