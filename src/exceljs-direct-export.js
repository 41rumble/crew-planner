/**
 * Direct Excel export using ExcelJS with the exact same data as the original export
 */
import * as XLSX from 'xlsx';

/**
 * Export project data to a colored Excel file with the exact same data
 * @param {Object} appState - The current application state
 * @returns {Promise<Blob>} - A promise that resolves to a Blob containing the Excel file
 */
export async function exportToColoredExcel(appState) {
  try {
    console.log('Starting ExcelJS direct export with app colors...');
    
    // Log phase colors for debugging
    if (appState.phases) {
      console.log('Phase colors from app state:');
      appState.phases.forEach(phase => {
        console.log(`  ${phase.name}: ${phase.color || 'no color'}`);
      });
    }
    
    // Ensure all phases have colors
    if (appState.phases) {
      const { defaultPhaseColors } = await import('./phaseColors.js');
      appState.phases.forEach((phase, index) => {
        if (!phase.color) {
          phase.color = defaultPhaseColors[index % defaultPhaseColors.length];
          console.log(`Added default color ${phase.color} to phase ${phase.name}`);
        }
      });
    }
    
    // First, use the original export function to get the exact data
    const { exportToExcel } = await import('./export-excel.js');
    const xlsxWorkbook = exportToExcel(appState, true);
    
    // Import ExcelJS
    const ExcelJS = (await import('exceljs')).default;
    
    // Create a new ExcelJS workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Crew Planner';
    workbook.lastModifiedBy = 'Crew Planner';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Process each sheet in the XLSX workbook
    for (const sheetName of xlsxWorkbook.SheetNames) {
      console.log(`Processing sheet: ${sheetName}`);
      const xlsxWorksheet = xlsxWorkbook.Sheets[sheetName];
      
      // Convert XLSX worksheet to array of arrays (rows and columns)
      let data = XLSX.utils.sheet_to_json(xlsxWorksheet, { header: 1 });
      
      // For Timeline sheet, filter out empty rows between departments
      if (sheetName === 'Timeline') {
        // Process the data to remove empty rows
        const filteredData = [];
        let isEmptyRow = false;
        
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          
          // Check if this is an empty row (all cells are empty or undefined)
          const isEmpty = row.every((cell, index) => 
            cell === undefined || cell === "" || (index > 0 && cell === 0)
          );
          
          if (isEmpty) {
            // Only keep empty rows after phase headers (which end with ":")
            if (i > 0 && 
                data[i-1][0] && 
                typeof data[i-1][0] === 'string' && 
                data[i-1][0].endsWith(':')) {
              filteredData.push(row);
            }
            // Skip other empty rows
          } else {
            filteredData.push(row);
          }
        }
        
        data = filteredData;
      }
      
      // Create a new worksheet in the ExcelJS workbook
      const worksheet = workbook.addWorksheet(sheetName);
      
      // Add the data to the worksheet, replacing zeros with empty cells
      data.forEach(row => {
        // Replace zeros with null (empty cell) in the row
        const processedRow = row.map(cell => (cell === 0 ? null : cell));
        worksheet.addRow(processedRow);
      });
      
      // Store department colors from Timeline sheet
      let departmentColorMap = {};
      
      // Apply styling based on sheet type
      if (sheetName === 'Timeline') {
        // Get department colors from Timeline sheet
        departmentColorMap = styleTimelineSheet(worksheet, data, appState);
        
        // After all styling, explicitly remove background colors from cost rows
        // Find cost rows by their labels
        const costRowLabels = [
          'Monthly Labor Cost',
          'Monthly Facility Cost',
          'Workstation Cost (One-time)',
          'Backend Infrastructure Cost',
          'Total Monthly Cost',
          'Cumulative Cost'
        ];
        
        // First, find the row numbers of the cost rows
        const costRowNumbers = [];
        worksheet.eachRow((row, rowNumber) => {
          const firstCell = row.getCell(1);
          if (firstCell.value && costRowLabels.includes(firstCell.value)) {
            costRowNumbers.push(rowNumber);
          }
        });
        
        // Now, apply a white background to these rows to override any inherited colors
        costRowNumbers.forEach(rowNumber => {
          const row = worksheet.getRow(rowNumber);
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' } // White background
            };
          });
        });
        
        // Store department colors for use in other sheets
        workbook.departmentColorMap = departmentColorMap;
      } else if (sheetName === 'Stats') {
        // Pass department colors to Stats sheet
        styleStatsSheet(worksheet, data, workbook.departmentColorMap || {});
      } else if (sheetName.includes('Facilities')) {
        styleFacilitiesSheet(worksheet, data);
      } else if (sheetName.includes('Workstation')) {
        styleWorkstationSheet(worksheet, data);
      }
    }
    
    // Generate Excel file as a blob
    console.log('Generating Excel file...');
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error('Error in ExcelJS direct export:', error);
    
    // Fall back to the original export function
    console.log('Falling back to original export function...');
    const { exportToExcel } = await import('./export-excel.js');
    return exportToExcel(appState, false);
  }
}

/**
 * Style the Timeline sheet
 * @param {Object} worksheet - The ExcelJS worksheet
 * @param {Array} data - The sheet data as array of arrays
 * @param {Object} appState - The application state
 * @returns {Object} - A map of department names to their colors
 */
function styleTimelineSheet(worksheet, data, appState) {
  // Set column widths
  worksheet.columns.forEach((column, index) => {
    column.width = index === 0 ? 30 : 15;
  });
  
  // Style year header row (row 1)
  const yearHeaderRow = worksheet.getRow(1);
  yearHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  });
  
  // Style month header row (row 2)
  const monthHeaderRow = worksheet.getRow(2);
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
  
  // Create a map to store department colors for use in the Stats sheet
  const departmentColorMap = {};
  
  for (let rowIndex = 3; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string' && value.endsWith(':')) {
      // This is a phase header row
      const phaseName = value.slice(0, -1);
      
      // Find the phase in appState to get its actual color
      const phase = appState.phases.find(p => p.name === phaseName);
      if (phase && phase.color) {
        // Use the color from the app state (remove # if present)
        currentPhaseColor = phase.color.replace('#', '');
        console.log(`Using color ${phase.color} for phase ${phaseName} in Excel`);
      } else {
        // Fallback to generated color if not found
        currentPhaseColor = getPhaseColor(phaseName);
        console.log(`Using generated color #${currentPhaseColor} for phase ${phaseName} in Excel (not found in app state)`);
      }
      
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
    } else if (value && typeof value === 'string' && !value.endsWith(':')) {
      // This is a department row
      firstCell.font = { bold: true };
      
      // Apply a much lighter version of the phase color to the department name
      if (currentPhaseColor) {
        // Use a higher lightening factor (0.85) for better readability
        const lightColor = lightenColor(currentPhaseColor, 0.85);
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + lightColor }
        };
        
        // Store the department color for use in the Stats sheet
        departmentColorMap[value] = lightColor;
      }
      
      // Apply color intensity to crew count cells
      for (let colIndex = 2; colIndex <= row.cellCount; colIndex++) {
        const cell = row.getCell(colIndex);
        const crewCount = cell.value;
        
        if (crewCount && typeof crewCount === 'number' && crewCount > 0) {
          // Calculate color intensity based on crew size, but limit the maximum intensity
          // to ensure text remains readable
          const intensity = Math.min(0.7, crewCount / 15); // Scale based on crew size with a max of 0.7
          
          // Use the phase color as the base color for crew cells, but start with a lighter version
          const baseColor = lightenColor(currentPhaseColor || 'D8E4BC', 0.7);
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
      
      const colorIndex = costRowLabels.findIndex(label => value === label);
      
      if (colorIndex !== -1) {
        // This is a cost row
        
        // Make the label bold
        firstCell.font = { bold: true };
        
        // Ensure the first cell also has a white background
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' } // White background
        };
        
        // Apply formatting to all cells in the row (with white background)
        for (let colIndex = 2; colIndex <= row.cellCount; colIndex++) {
          const cell = row.getCell(colIndex);
          if (cell.value !== null && cell.value !== undefined) {
            // Explicitly set white background
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' } // White background
            };
            
            cell.numFmt = '$#,##0';
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Make total and cumulative rows bold
            if (colorIndex >= 4) {
              cell.font = { bold: true };
            }
          }
        }
      }
    }
  }
  
  // Freeze the top rows
  worksheet.views = [
    { state: 'frozen', xSplit: 1, ySplit: 2, activeCell: 'B3' }
  ];
  
  // Return the department color map for use in other sheets
  return departmentColorMap;
}

/**
 * Style the Stats sheet
 * @param {Object} worksheet - The ExcelJS worksheet
 * @param {Array} data - The sheet data as array of arrays
 * @param {Object} departmentColorMap - Map of department names to their colors
 */
function styleStatsSheet(worksheet, data, departmentColorMap = {}) {
  // Set column widths
  worksheet.columns = [
    { width: 35 },
    { width: 20 },
    { width: 20 },
    { width: 20 }
  ];
  
  // Process each row
  worksheet.eachRow((row, rowIndex) => {
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string') {
      // Format section headers
      if (value === 'Project Statistics' || 
          value === 'Cost Breakdown' || 
          value === 'Monthly Cost Analysis' || 
          value === 'Department Rates by Phase:') {
        firstCell.font = { bold: true, size: 14 };
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
      
      // Format table headers
      if (value === 'Category' || value === 'Department') {
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
      
      // Apply department colors from Timeline sheet
      if (Object.keys(departmentColorMap).includes(value)) {
        // This is a department name that exists in the Timeline sheet
        const color = departmentColorMap[value];
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF' + color }
        };
        firstCell.font = { bold: true };
      }
      
      // Format cost cells
      const lowerValue = value.toLowerCase();
      let isBold = false;
      
      if (lowerValue.includes('total')) {
        isBold = true;
        row.eachCell((cell) => {
          cell.font = { bold: true };
        });
      } else if (lowerValue.includes('cumulative')) {
        isBold = true;
        row.eachCell((cell) => {
          cell.font = { bold: true };
        });
      }
      
      // Apply formatting to numeric cells in the row (without background color)
      for (let colIndex = 2; colIndex <= row.cellCount; colIndex++) {
        const cell = row.getCell(colIndex);
        if (cell.value !== null && cell.value !== undefined && typeof cell.value === 'number') {
          cell.numFmt = '$#,##0';
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          if (isBold) {
            cell.font = { bold: true };
          }
        }
      }
    }
  });
  
  // Freeze the top row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Style the Facilities sheets
 * @param {Object} worksheet - The ExcelJS worksheet
 * @param {Array} data - The sheet data as array of arrays
 */
function styleFacilitiesSheet(worksheet, data) {
  // Set column widths
  if (worksheet.name === 'Facilities Summary') {
    worksheet.columns = [
      { width: 35 },
      { width: 20 },
      { width: 20 },
      { width: 20 }
    ];
  } else {
    worksheet.columns = [
      { width: 25 },
      { width: 35 },
      { width: 20 },
      { width: 45 }
    ];
  }
  
  // Process each row
  worksheet.eachRow((row, rowIndex) => {
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string') {
      // Format section headers
      if (value.includes('Fixed') || value.includes('Variable') || 
          value.includes('Summary') || value.includes('Allocation')) {
        firstCell.font = { bold: true, size: 14 };
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
      
      // Format category rows
      if (!value.includes('Fixed') && !value.includes('Variable') && 
          !value.includes('Summary') && !value.includes('Allocation') &&
          !value.includes('Category')) {
        firstCell.font = { bold: true };
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }
    }
    
    // Format cost cells
    for (let colIndex = 3; colIndex <= row.cellCount; colIndex++) {
      const cell = row.getCell(colIndex);
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
  
  // Freeze the top row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
}

/**
 * Style the Workstation sheets
 * @param {Object} worksheet - The ExcelJS worksheet
 * @param {Array} data - The sheet data as array of arrays
 */
function styleWorkstationSheet(worksheet, data) {
  // Set column widths
  if (worksheet.name === 'Workstation Summary') {
    worksheet.columns = [
      { width: 35 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 20 }
    ];
  } else {
    worksheet.columns = [
      { width: 25 },
      { width: 35 },
      { width: 20 },
      { width: 15 },
      { width: 20 },
      { width: 35 }
    ];
  }
  
  // Process each row
  worksheet.eachRow((row, rowIndex) => {
    const firstCell = row.getCell(1);
    const value = firstCell.value;
    
    if (value && typeof value === 'string') {
      // Format section headers
      if (value.includes('Bundle') || value.includes('Assignment') || 
          value.includes('Backend') || value.includes('Summary')) {
        firstCell.font = { bold: true, size: 14 };
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }
      
      // Format bundle/category rows
      if (value === 'Bundle') {
        firstCell.font = { bold: true };
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }
    }
    
    // Format cost and total cells
    for (let colIndex = 3; colIndex <= row.cellCount; colIndex++) {
      const cell = row.getCell(colIndex);
      if (cell.value !== null && cell.value !== undefined && 
          typeof cell.value === 'number' && 
          (colIndex === 3 || colIndex === 5)) {
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
  
  // Freeze the top row
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }
  ];
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
 * Lighten a color by a specified amount
 * @param {string} hexColor - The color to lighten
 * @param {number} factor - The lightening factor (0-1)
 * @returns {string} - The lightened color
 */
function lightenColor(hexColor, factor) {
  // Extract RGB components
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Lighten each component
  const newR = Math.min(255, r + Math.floor((255 - r) * factor));
  const newG = Math.min(255, g + Math.floor((255 - g) * factor));
  const newB = Math.min(255, b + Math.floor((255 - b) * factor));
  
  // Convert back to hex
  const rr = newR.toString(16).padStart(2, '0');
  const gg = newG.toString(16).padStart(2, '0');
  const bb = newB.toString(16).padStart(2, '0');
  
  return `${rr}${gg}${bb}`;
}