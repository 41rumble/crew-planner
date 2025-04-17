/**
 * Export project data to Excel file
 */
import * as XLSX from 'xlsx';

/**
 * Export project data to a single Excel file with multiple sheets
 * @param {Object} appState - The current application state
 */
export function exportToExcel(appState) {
  const {
    years,
    monthsPerYear,
    months,
    sortedItems,
    phases,
    departments,
    crewMatrix,
    monthlyLaborCosts,
    monthlyFacilityCosts,
    monthlyWorkstationCosts,
    monthlyCosts,
    cumulativeCosts,
    totalProjectCost,
    peakMonthlyCost,
    peakCrewSize,
    facilitiesData,
    workstationData
  } = appState;

  // Import required functions
  const { 
    calculateTotalFixedFacilityCosts, 
    calculateTotalVariableFacilityCostsPerPerson 
  } = appState.facilitiesFunctions;

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // 1. Timeline Sheet
  const timelineData = [];
  
  // Add header rows with year and month names
  const yearHeaderRow = [""];
  const monthHeaderRow = [""];
  
  years.forEach(year => {
    // Add the year followed by empty cells for each month
    yearHeaderRow.push(year);
    for (let i = 0; i < 11; i++) {
      yearHeaderRow.push("");
    }
  });
  
  years.forEach(year => {
    // Add all months for this year
    monthsPerYear.forEach(month => {
      monthHeaderRow.push(month);
    });
  });
  
  timelineData.push(yearHeaderRow);
  timelineData.push(monthHeaderRow);
  timelineData.push(Array(monthHeaderRow.length).fill(""));  // Empty row
  
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
  Object.keys(sections).forEach(sectionName => {
    // Add section header
    const sectionRow = [sectionName + ":"];
    for (let i = 1; i < monthHeaderRow.length; i++) {
      sectionRow.push("");
    }
    timelineData.push(sectionRow);
    
    // Add departments in this section
    sections[sectionName].forEach(deptInfo => {
      // Create department row
      const deptRow = [deptInfo.dept.name];
      
      // Add crew counts for each month
      for (let i = 0; i < months.length; i++) {
        deptRow.push(crewMatrix[deptInfo.index][i]);
      }
      
      timelineData.push(deptRow);
      
      // Add an empty row after each department (only if not the last department in the section)
      if (sections[sectionName].indexOf(deptInfo) < sections[sectionName].length - 1) {
        timelineData.push(Array(monthHeaderRow.length).fill(""));
      }
    });
    
    // Add empty rows after each section
    timelineData.push(Array(monthHeaderRow.length).fill(""));
    timelineData.push(Array(monthHeaderRow.length).fill(""));
  });
  
  // Add monthly costs to timeline
  const laborCostRow = ["Monthly Labor Cost"];
  const facilityCostRow = ["Monthly Facility Cost"];
  const workstationCostRow = ["Workstation Cost (One-time)"];
  const totalCostRow = ["Total Monthly Cost"];
  const cumulativeCostRow = ["Cumulative Cost"];
  
  for (let i = 0; i < months.length; i++) {
    laborCostRow.push(monthlyLaborCosts[i]);
    facilityCostRow.push(monthlyFacilityCosts[i]);
    workstationCostRow.push(monthlyWorkstationCosts[i]);
    totalCostRow.push(monthlyCosts[i]);
    cumulativeCostRow.push(cumulativeCosts[i]);
  }
  
  timelineData.push(laborCostRow);
  timelineData.push(facilityCostRow);
  timelineData.push(workstationCostRow);
  timelineData.push(totalCostRow);
  timelineData.push(cumulativeCostRow);
  
  // Create the timeline worksheet
  const timelineWorksheet = XLSX.utils.aoa_to_sheet(timelineData);
  XLSX.utils.book_append_sheet(workbook, timelineWorksheet, "Timeline");
  
  // 2. Stats Sheet
  const statsData = [
    ["Project Statistics"],
    [""],
    ["Total Project Cost", totalProjectCost],
    ["Peak Monthly Cost", peakMonthlyCost],
    ["Peak Crew Size", peakCrewSize],
    [""],
    ["Department Rates by Phase:"],
    [""]
  ];
  
  // Group departments by phase using the sortedItems
  const phaseMap = {};
  let currentPhase = "No Phase";
  
  sortedItems.forEach(item => {
    if (item.type === 'phase') {
      currentPhase = phases[item.index].name;
      if (!phaseMap[currentPhase]) {
        phaseMap[currentPhase] = [];
      }
    } else if (item.type === 'department') {
      if (!phaseMap[currentPhase]) {
        phaseMap[currentPhase] = [];
      }
      phaseMap[currentPhase].push(departments[item.index]);
    }
  });
  
  // Add departments and rates by phase
  for (const [phaseName, phaseDepts] of Object.entries(phaseMap)) {
    statsData.push([phaseName]);
    statsData.push(["Department", "Rate ($/month)"]);
    
    phaseDepts.forEach(dept => {
      statsData.push([dept.name, dept.rate]);
    });
    
    statsData.push([""]);
  }
  
  // Create the stats worksheet
  const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Stats");
  
  // 3. Facilities Summary Sheet
  const facilitiesSummaryData = [
    ["Facilities Summary"],
    [""],
    ["Fixed Monthly Facility Costs", calculateTotalFixedFacilityCosts(facilitiesData)],
    ["Variable Facility Costs Per Person", calculateTotalVariableFacilityCostsPerPerson(facilitiesData)]
  ];
  
  // Create the facilities summary worksheet
  const facilitiesSummaryWorksheet = XLSX.utils.aoa_to_sheet(facilitiesSummaryData);
  XLSX.utils.book_append_sheet(workbook, facilitiesSummaryWorksheet, "Facilities Summary");
  
  // 4. Workstation Summary Sheet
  const workstationSummaryData = [
    ["Workstation Summary"],
    [""],
    ["Department", "Workstation Type", "Quantity", "Total Cost"]
  ];
  
  workstationData.departmentAssignments.forEach(assignment => {
    const bundle = workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
    if (bundle) {
      const totalCost = bundle.cost * assignment.quantity;
      workstationSummaryData.push([
        assignment.departmentName,
        bundle.name,
        assignment.quantity,
        totalCost
      ]);
    }
  });
  
  // Create the workstation summary worksheet
  const workstationSummaryWorksheet = XLSX.utils.aoa_to_sheet(workstationSummaryData);
  XLSX.utils.book_append_sheet(workbook, workstationSummaryWorksheet, "Workstation Summary");
  
  // 5. Detailed Facilities Sheet
  const facilitiesDetailData = [
    ["Fixed Facility Costs"],
    [""],
    ["Category", "Item", "Cost", "Notes"]
  ];
  
  // Add fixed facility costs
  facilitiesData.fixedFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      facilitiesDetailData.push([
        category.category,
        item.name,
        item.cost,
        item.notes || ""
      ]);
    });
  });
  
  facilitiesDetailData.push([""]);
  facilitiesDetailData.push([""]);
  facilitiesDetailData.push(["Variable Facility Costs"]);
  facilitiesDetailData.push([""]);
  facilitiesDetailData.push(["Category", "Item", "Cost Per Person", "Notes"]);
  
  // Add variable facility costs
  facilitiesData.variableFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      facilitiesDetailData.push([
        category.category,
        item.name,
        item.cost,
        item.notes || ""
      ]);
    });
  });
  
  // Create the facilities detail worksheet
  const facilitiesDetailWorksheet = XLSX.utils.aoa_to_sheet(facilitiesDetailData);
  XLSX.utils.book_append_sheet(workbook, facilitiesDetailWorksheet, "Facilities Detail");
  
  // 6. Detailed Workstations Sheet
  const workstationsDetailData = [
    ["Workstation Bundles"],
    [""],
    ["ID", "Name", "Description", "Total Cost"]
  ];
  
  // Add workstation bundles
  workstationData.workstationBundles.forEach(bundle => {
    workstationsDetailData.push([
      bundle.id,
      bundle.name,
      bundle.description,
      bundle.cost
    ]);
  });
  
  workstationsDetailData.push([""]);
  workstationsDetailData.push([""]);
  workstationsDetailData.push(["Workstation Components"]);
  workstationsDetailData.push([""]);
  workstationsDetailData.push(["Bundle ID", "Component Name", "Type", "Cost", "Quantity", "Total"]);
  
  // Add components for each bundle
  workstationData.workstationBundles.forEach(bundle => {
    bundle.components.forEach(component => {
      const total = component.cost * component.quantity;
      workstationsDetailData.push([
        bundle.id,
        component.name,
        component.type,
        component.cost,
        component.quantity,
        total
      ]);
    });
  });
  
  workstationsDetailData.push([""]);
  workstationsDetailData.push([""]);
  workstationsDetailData.push(["Department Assignments"]);
  workstationsDetailData.push([""]);
  workstationsDetailData.push(["Department", "Workstation Type", "Quantity", "Notes"]);
  
  // Add department assignments
  workstationData.departmentAssignments.forEach(assignment => {
    workstationsDetailData.push([
      assignment.departmentName,
      assignment.workstationId,
      assignment.quantity,
      assignment.notes || ""
    ]);
  });
  
  workstationsDetailData.push([""]);
  workstationsDetailData.push([""]);
  workstationsDetailData.push(["Backend Infrastructure"]);
  workstationsDetailData.push([""]);
  workstationsDetailData.push(["Category", "Item", "Cost", "Quantity", "Total", "Cost Type", "Purchase Month", "Notes"]);
  
  // Add backend infrastructure
  workstationData.backendInfrastructure.forEach(category => {
    category.items.forEach(item => {
      const total = item.cost * item.quantity;
      workstationsDetailData.push([
        category.category,
        item.name,
        item.cost,
        item.quantity,
        total,
        item.costType || "one-time",
        item.purchaseMonth || 0,
        item.notes || ""
      ]);
    });
  });
  
  // Create the workstations detail worksheet
  const workstationsDetailWorksheet = XLSX.utils.aoa_to_sheet(workstationsDetailData);
  XLSX.utils.book_append_sheet(workbook, workstationsDetailWorksheet, "Workstations Detail");
  
  // Generate the Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Create a Blob from the buffer
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'crew_planning_data.xlsx';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  
  // Click the link to download the file
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}