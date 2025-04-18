/**
 * Project export and import utilities for the crew planning tool
 */

import { generateCSV } from './csv-loader.js';

/**
 * Export the entire project as a JSON file
 * @param {Object} projectData - The project data to export
 * @returns {Blob} - A JSON blob containing the project data
 */
export function exportProjectAsJSON(projectData) {
  const jsonData = JSON.stringify(projectData, null, 2);
  return new Blob([jsonData], { type: 'application/json' });
}

/**
 * Import a project from a JSON file
 * @param {String} jsonContent - The JSON content to import
 * @returns {Object} - The imported project data
 */
export function importProjectFromJSON(jsonContent) {
  try {
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Invalid JSON format');
  }
}

/**
 * Export the project as multiple CSV files in a ZIP archive
 * @param {Object} projectData - The project data to export
 * @returns {Promise<Blob>} - A ZIP blob containing the CSV files
 */
export async function exportProjectAsCSV(projectData) {
  // We'll need to use JSZip to create a ZIP file with multiple CSV files
  // For now, we'll just return the timeline CSV
  const timelineCSV = generateCSV(projectData.departments, projectData.phases, projectData.crewMatrix, projectData.months);
  
  // Create a blob for the timeline CSV
  return new Blob([timelineCSV], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generate a facilities CSV export
 * @param {Object} facilitiesData - The facilities data to export
 * @returns {String} - The CSV content
 */
export function generateFacilitiesCSV(facilitiesData) {
  let csvContent = "Facilities Cost Data\n\n";
  
  // Fixed Facility Costs
  csvContent += "Fixed Facility Costs\n";
  csvContent += "Category,Item,Cost,Notes\n";
  
  facilitiesData.fixedFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      csvContent += `${category.category},${item.name},${item.cost},"${item.notes || ''}"\n`;
    });
  });
  
  csvContent += "\nVariable Facility Costs (Per Person)\n";
  csvContent += "Category,Item,Cost,Notes\n";
  
  facilitiesData.variableFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      csvContent += `${category.category},${item.name},${item.cost},"${item.notes || ''}"\n`;
    });
  });
  
  csvContent += "\nAllocation Method\n";
  csvContent += `Method,${facilitiesData.facilityCostAllocation.method}\n`;
  
  if (facilitiesData.facilityCostAllocation.method === 'custom') {
    csvContent += "\nCustom Weights\n";
    csvContent += "Department,Weight\n";
    
    facilitiesData.facilityCostAllocation.customWeights.forEach(weight => {
      csvContent += `${weight.departmentName},${weight.weight}\n`;
    });
  }
  
  return csvContent;
}

/**
 * Generate a workstations CSV export
 * @param {Object} workstationData - The workstation data to export
 * @returns {String} - The CSV content
 */
export function generateWorkstationsCSV(workstationData) {
  let csvContent = "Workstation Data\n\n";
  
  // Workstation Bundles
  csvContent += "Workstation Bundles\n";
  csvContent += "ID,Name,Description,Total Cost\n";
  
  workstationData.workstationBundles.forEach(bundle => {
    csvContent += `${bundle.id},${bundle.name},"${bundle.description}",${bundle.cost}\n`;
  });
  
  // Components for each bundle
  csvContent += "\nWorkstation Components\n";
  csvContent += "Bundle ID,Component Name,Type,Cost,Quantity,Total\n";
  
  workstationData.workstationBundles.forEach(bundle => {
    bundle.components.forEach(component => {
      const total = component.cost * component.quantity;
      csvContent += `${bundle.id},${component.name},${component.type},${component.cost},${component.quantity},${total}\n`;
    });
  });
  
  // Department Assignments
  csvContent += "\nDepartment Assignments\n";
  csvContent += "Department,Workstation Type,Quantity,Purchase Month,Total Cost,Notes\n";
  
  workstationData.departmentAssignments.forEach(assignment => {
    // Calculate total cost for this assignment
    const bundle = workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
    const totalCost = bundle ? bundle.cost * assignment.quantity : 0;
    const purchaseMonth = assignment.purchaseMonth || 0;
    
    csvContent += `${assignment.departmentName},${assignment.workstationId},${assignment.quantity},${purchaseMonth},${totalCost},"${assignment.notes || ''}"\n`;
  });
  
  // Backend Infrastructure
  csvContent += "\nBackend Infrastructure\n";
  csvContent += "Category,Item,Cost,Quantity,Total,Notes\n";
  
  workstationData.backendInfrastructure.forEach(category => {
    category.items.forEach(item => {
      const total = item.cost * item.quantity;
      csvContent += `${category.category},${item.name},${item.cost},${item.quantity},${total},"${item.notes || ''}"\n`;
    });
  });
  
  return csvContent;
}

/**
 * Create a project data object from the current state
 * @param {Object} appState - The current application state
 * @returns {Object} - The project data object
 */
export function createProjectData(appState) {
  return {
    // Timeline data
    years: appState.years,
    months: appState.months,
    departments: appState.departments,
    phases: appState.phases,
    crewMatrix: appState.crewMatrix,
    
    // Facilities data
    facilitiesData: appState.facilitiesData,
    
    // Workstation data
    workstationData: appState.workstationData,
    
    // Settings
    facilitiesIncludedInTotals: appState.facilitiesIncludedInTotals,
    
    // Version info
    version: '1.0',
    exportDate: new Date().toISOString()
  };
}

/**
 * Apply imported project data to the application state
 * @param {Object} projectData - The imported project data
 * @param {Object} appState - The current application state to update
 * @returns {Object} - The updated application state
 */
export function applyProjectData(projectData, appState) {
  // Update timeline data
  if (projectData.years) appState.years = projectData.years;
  if (projectData.months) appState.months = projectData.months;
  if (projectData.departments) appState.departments = projectData.departments;
  if (projectData.phases) appState.phases = projectData.phases;
  if (projectData.crewMatrix) appState.crewMatrix = projectData.crewMatrix;
  
  // Update facilities data
  if (projectData.facilitiesData) appState.facilitiesData = projectData.facilitiesData;
  
  // Update workstation data
  if (projectData.workstationData) appState.workstationData = projectData.workstationData;
  
  // Update settings
  if (projectData.facilitiesIncludedInTotals !== undefined) {
    appState.facilitiesIncludedInTotals = projectData.facilitiesIncludedInTotals;
  }
  
  return appState;
}