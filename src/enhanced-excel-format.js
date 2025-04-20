/**
 * Enhanced Excel formatting with improved cell spacing and color preservation
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
  // Import ExcelJS for better color support
  const ExcelJS = (await import('exceljs')).default;
  
  // Create a new workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Crew Planner';
  workbook.lastModifiedBy = 'Crew Planner';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Add worksheets with enhanced formatting
  await createEnhancedTimelineSheet(workbook, appState);
  await createEnhancedStatsSheet(workbook, appState);
  await createEnhancedFacilitiesSheet(workbook, appState);
  await createEnhancedWorkstationSheet(workbook, appState);
  
  // Generate Excel file as a blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Create an enhanced timeline sheet with proper color preservation
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
async function createEnhancedTimelineSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Timeline');
  
  // Get data safely
  const months = appState.months || [];
  const phases = appState.phases || [];
  const departments = appState.departments || [];
  const crewMatrix = appState.crewMatrix || [];
  const sortedItems = appState.sortedItems || [];
  
  // Set up columns - first column for departments, then one for each month
  const columns = [
    { header: 'Department', width: 30 }
  ];
  
  // Add month columns
  months.forEach(month => {
    columns.push({ header: month, width: 15 });
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
  
  // Create a map to store phase colors by phase ID
  const phaseColorMap = {};
  phases.forEach(phase => {
    phaseColorMap[phase.id || phase.name] = getPhaseColorArgb(phase.name);
  });
  
  // Create a map to track which phase each department belongs to
  const departmentPhaseMap = {};
  
  // Process items in the order they appear in the grid view
  let rowIndex = 2;
  let currentPhase = null;
  let currentPhaseColor = null;
  
  // If sortedItems is available, use it to determine the order
  if (sortedItems && sortedItems.length > 0) {
    sortedItems.forEach(item => {
      if (item.type === 'phase') {
        // This is a phase header
        const phase = phases[item.index];
        if (phase) {
          currentPhase = phase;
          currentPhaseColor = phaseColorMap[phase.id || phase.name];
          
          // Add phase row
          const phaseRow = sheet.addRow([phase.name]);
          rowIndex++;
          
          phaseRow.getCell(1).font = { bold: true, italic: true };
          phaseRow.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: currentPhaseColor }
          };
          
          // Highlight phase duration
          const startMonth = phase.startMonth || 0;
          const endMonth = phase.endMonth || months.length - 1;
          
          for (let i = 0; i <= endMonth - startMonth; i++) {
            const cell = phaseRow.getCell(i + 2 + startMonth);
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: currentPhaseColor }
            };
          }
        }
      } else if (item.type === 'department') {
        // This is a department row
        const dept = departments[item.index];
        if (dept) {
          // Store the phase this department belongs to
          if (currentPhase) {
            departmentPhaseMap[dept.id || dept.name] = {
              phase: currentPhase,
              color: currentPhaseColor
            };
          }
          
          const rowData = [dept.name];
          
          // Add crew counts for each month
          months.forEach((_, monthIndex) => {
            const deptCrew = crewMatrix[item.index] || [];
            const crewCount = deptCrew[monthIndex] || 0;
            rowData.push(crewCount);
          });
          
          const deptRow = sheet.addRow(rowData);
          rowIndex++;
          
          // Style department name
          deptRow.getCell(1).font = { bold: true };
          
          // Apply a lighter version of the phase color to the department name
          if (currentPhaseColor) {
            deptRow.getCell(1).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: lightenColor(currentPhaseColor, 0.7) }
            };
          }
          
          // Style crew counts
          for (let i = 0; i < months.length; i++) {
            const cell = deptRow.getCell(i + 2);
            const deptCrew = crewMatrix[item.index] || [];
            const crewCount = deptCrew[i] || 0;
            
            // Only style cells with crew members
            if (crewCount > 0) {
              // Calculate color intensity based on value
              const intensity = Math.min(1, crewCount / 10);
              
              // Use the phase color as the base color for crew cells
              const baseColor = currentPhaseColor ? currentPhaseColor.substring(2) : 'D8E4BC';
              const colorArgb = adjustColorIntensityArgb(baseColor, intensity);
              
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: colorArgb }
              };
            }
            
            // Highlight the department's active duration
            const startMonth = dept.startMonth || 0;
            const endMonth = dept.endMonth || months.length - 1;
            
            if (i >= startMonth && i <= endMonth) {
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
        }
      }
    });
  } else {
    // Fallback if sortedItems is not available
    // First add all phases
    phases.forEach(phase => {
      const phaseRow = sheet.addRow([phase.name]);
      rowIndex++;
      
      const phaseColor = phaseColorMap[phase.id || phase.name];
      
      phaseRow.getCell(1).font = { bold: true, italic: true };
      phaseRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: phaseColor }
      };
      
      // Highlight phase duration
      const startMonth = phase.startMonth || 0;
      const endMonth = phase.endMonth || months.length - 1;
      
      for (let i = 0; i <= endMonth - startMonth; i++) {
        const cell = phaseRow.getCell(i + 2 + startMonth);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: phaseColor }
        };
      }
    });
    
    // Then add all departments
    departments.forEach((dept, deptIndex) => {
      const rowData = [dept.name];
      
      // Add crew counts for each month
      months.forEach((_, monthIndex) => {
        const deptCrew = crewMatrix[deptIndex] || [];
        const crewCount = deptCrew[monthIndex] || 0;
        rowData.push(crewCount);
      });
      
      const deptRow = sheet.addRow(rowData);
      rowIndex++;
      
      // Style department name
      deptRow.getCell(1).font = { bold: true };
      
      // Style crew counts
      for (let i = 0; i < months.length; i++) {
        const cell = deptRow.getCell(i + 2);
        const deptCrew = crewMatrix[deptIndex] || [];
        const crewCount = deptCrew[i] || 0;
        
        // Only style cells with crew members
        if (crewCount > 0) {
          // Calculate color intensity based on value
          const intensity = Math.min(1, crewCount / 10);
          const colorArgb = adjustColorIntensityArgb('D8E4BC', intensity);
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colorArgb }
          };
        }
        
        // Highlight the department's active duration
        const startMonth = dept.startMonth || 0;
        const endMonth = dept.endMonth || months.length - 1;
        
        if (i >= startMonth && i <= endMonth) {
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
  }
  
  // Add total row
  const totalRowData = ['TOTAL'];
  
  // Calculate totals for each month
  months.forEach((_, monthIndex) => {
    let total = 0;
    departments.forEach((_, deptIndex) => {
      const deptCrew = crewMatrix[deptIndex] || [];
      total += deptCrew[monthIndex] || 0;
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
    cell.alignment = { horizontal: 'center' };
  });
  
  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 1, ySplit: 1, activeCell: 'B2' }
  ];
}

/**
 * Lighten a color by a specified amount
 * @param {string} argbColor - The ARGB color to lighten
 * @param {number} factor - The lightening factor (0-1)
 * @returns {string} - The lightened ARGB color
 */
function lightenColor(argbColor, factor) {
  // Extract RGB components (skip alpha)
  const r = parseInt(argbColor.substring(2, 4), 16);
  const g = parseInt(argbColor.substring(4, 6), 16);
  const b = parseInt(argbColor.substring(6, 8), 16);
  
  // Lighten each component
  const newR = Math.min(255, r + Math.floor((255 - r) * factor));
  const newG = Math.min(255, g + Math.floor((255 - g) * factor));
  const newB = Math.min(255, b + Math.floor((255 - b) * factor));
  
  // Convert back to hex
  const rr = newR.toString(16).padStart(2, '0');
  const gg = newG.toString(16).padStart(2, '0');
  const bb = newB.toString(16).padStart(2, '0');
  
  // Return with original alpha
  return `${argbColor.substring(0, 2)}${rr}${gg}${bb}`;
}

/**
 * Create an enhanced stats sheet with proper formatting
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
async function createEnhancedStatsSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Stats');
  
  // Get data safely
  const totalProjectCost = appState.totalProjectCost || 0;
  const peakMonthlyCost = appState.peakMonthlyCost || 0;
  const peakCrewSize = appState.peakCrewSize || 0;
  const monthlyLaborCosts = appState.monthlyLaborCosts || [];
  const monthlyFacilityCosts = appState.monthlyFacilityCosts || [];
  const monthlyWorkstationCosts = appState.monthlyWorkstationCosts || [];
  const monthlyBackendCosts = appState.monthlyBackendCosts || [];
  
  // Set column widths
  sheet.columns = [
    { header: 'Category', width: 35 },
    { header: 'Value', width: 20 },
    { header: 'Additional Info', width: 20 },
    { header: '', width: 20 }
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
  
  // Add project statistics
  let rowIndex = 2;
  
  const titleRow = sheet.addRow(['Project Statistics']);
  titleRow.getCell(1).font = { bold: true, size: 14 };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E0E0E0' }
  };
  rowIndex++;
  
  sheet.addRow([]);
  rowIndex++;
  
  // Add key metrics
  sheet.addRow(['Total Project Cost', formatCurrency(totalProjectCost)]);
  rowIndex++;
  
  sheet.addRow(['Peak Monthly Cost', formatCurrency(peakMonthlyCost)]);
  rowIndex++;
  
  sheet.addRow(['Peak Crew Size', `${peakCrewSize} crew members`]);
  rowIndex++;
  
  sheet.addRow([]);
  rowIndex++;
  
  // Add cost breakdown
  const breakdownTitleRow = sheet.addRow(['Cost Breakdown']);
  breakdownTitleRow.getCell(1).font = { bold: true, size: 14 };
  breakdownTitleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E0E0E0' }
  };
  rowIndex++;
  
  sheet.addRow([]);
  rowIndex++;
  
  const headerRow = sheet.addRow(['Category', 'Amount', '% of Total']);
  headerRow.eachCell((cell) => {
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
  rowIndex++;
  
  // Calculate total labor cost
  const totalLaborCost = monthlyLaborCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Calculate total facility cost
  const totalFacilityCost = monthlyFacilityCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Calculate total workstation cost
  const totalWorkstationCost = monthlyWorkstationCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Calculate total backend cost
  const totalBackendCost = monthlyBackendCosts.reduce((sum, cost) => sum + cost, 0);
  
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
      fgColor: { argb: 'D8E4BC' } // Light green
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  rowIndex++;
  
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
      fgColor: { argb: 'E6B8B7' } // Light red
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  rowIndex++;
  
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
      fgColor: { argb: 'B8CCE4' } // Light blue
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  rowIndex++;
  
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
      fgColor: { argb: 'CCC0DA' } // Light purple
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  rowIndex++;
  
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
      fgColor: { argb: 'FCD5B4' } // Light orange
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
 * Create an enhanced facilities sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
async function createEnhancedFacilitiesSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Facilities');
  
  // Set column widths
  sheet.columns = [
    { header: 'Category', width: 25 },
    { header: 'Item', width: 35 },
    { header: 'Cost', width: 20 },
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
  
  // Get facilities data safely
  const facilitiesData = appState.facilitiesData || {};
  const fixedFacilityCosts = facilitiesData.fixedFacilityCosts || [];
  const variableFacilityCosts = facilitiesData.variableFacilityCosts || [];
  
  // Add fixed facilities costs
  let rowIndex = 2;
  
  // Add section header
  const fixedHeader = sheet.addRow(['Fixed Facilities Costs']);
  fixedHeader.getCell(1).font = { bold: true, size: 14 };
  fixedHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E0E0E0' }
  };
  rowIndex++;
  
  // Add fixed costs
  fixedFacilityCosts.forEach(category => {
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
      const itemRow = sheet.addRow(['', item.name, item.cost, item.notes || '']);
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
  variableHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E0E0E0' }
  };
  rowIndex++;
  
  // Add variable costs
  variableFacilityCosts.forEach(category => {
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
      const itemRow = sheet.addRow(['', item.name, item.cost, item.notes || '']);
      itemRow.getCell(3).numFmt = '$#,##0';
      rowIndex++;
    });
  });
  
  // Freeze the top row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Create an enhanced workstation sheet
 * @param {ExcelJS.Workbook} workbook - The Excel workbook
 * @param {Object} appState - The application state
 */
async function createEnhancedWorkstationSheet(workbook, appState) {
  const sheet = workbook.addWorksheet('Workstations');
  
  // Set column widths
  sheet.columns = [
    { header: 'Category', width: 25 },
    { header: 'Item', width: 35 },
    { header: 'Cost', width: 20 },
    { header: 'Quantity', width: 15 },
    { header: 'Total', width: 20 },
    { header: 'Notes', width: 35 }
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
  bundlesHeader.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E0E0E0' }
  };
  rowIndex++;
  
  // Get workstation data safely
  const workstationData = appState.workstationData || {};
  const bundles = workstationData.workstationBundles || workstationData.bundles || [];
  
  // Add bundles
  bundles.forEach(bundle => {
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
    rowIndex++;
    
    // Add components if they exist
    if (bundle.components && bundle.components.length > 0) {
      bundle.components.forEach(component => {
        const componentRow = sheet.addRow([
          '',
          `- ${component.name}`,
          component.cost,
          component.quantity,
          component.cost * component.quantity,
          component.notes || ''
        ]);
        componentRow.getCell(3).numFmt = '$#,##0';
        componentRow.getCell(5).numFmt = '$#,##0';
        rowIndex++;
      });
    }
  });
  
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
function getPhaseColorArgb(phaseName) {
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
function adjustColorIntensityArgb(hexColor, intensity) {
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