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
    monthlyBackendCosts,
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
  const backendCostRow = ["Backend Infrastructure Cost"];
  const totalCostRow = ["Total Monthly Cost"];
  const cumulativeCostRow = ["Cumulative Cost"];
  
  for (let i = 0; i < months.length; i++) {
    laborCostRow.push(monthlyLaborCosts[i]);
    facilityCostRow.push(monthlyFacilityCosts[i]);
    workstationCostRow.push(monthlyWorkstationCosts[i]);
    backendCostRow.push(monthlyBackendCosts[i]);
    totalCostRow.push(monthlyCosts[i]);
    cumulativeCostRow.push(cumulativeCosts[i]);
  }
  
  timelineData.push(laborCostRow);
  timelineData.push(facilityCostRow);
  timelineData.push(workstationCostRow);
  timelineData.push(backendCostRow);
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
    ["Cost Breakdown"],
    [""],
    ["Category", "Amount", "% of Total Project Cost"]
  ];
  
  // Calculate total labor cost
  const totalLaborCost = monthlyLaborCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Calculate total facility cost
  const totalFacilityCost = monthlyFacilityCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Calculate total workstation cost from monthly costs
  const totalWorkstationCostFromMonthly = monthlyWorkstationCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Calculate total backend infrastructure cost
  const totalBackendCost = monthlyBackendCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Add cost breakdown
  statsData.push(["Labor", totalLaborCost, `${(totalLaborCost / totalProjectCost * 100).toFixed(1)}%`]);
  statsData.push(["Facilities", totalFacilityCost, `${(totalFacilityCost / totalProjectCost * 100).toFixed(1)}%`]);
  statsData.push(["Workstations", totalWorkstationCostFromMonthly, `${(totalWorkstationCostFromMonthly / totalProjectCost * 100).toFixed(1)}%`]);
  statsData.push(["Backend Infrastructure", totalBackendCost, `${(totalBackendCost / totalProjectCost * 100).toFixed(1)}%`]);
  
  statsData.push([""]);
  statsData.push([""]);
  statsData.push(["Monthly Cost Analysis"]);
  statsData.push([""]);
  
  // Find the month with peak cost
  let peakCostMonth = 0;
  for (let i = 0; i < monthlyCosts.length; i++) {
    if (monthlyCosts[i] === peakMonthlyCost) {
      peakCostMonth = i;
      break;
    }
  }
  
  statsData.push(["Peak Cost Month", months[peakCostMonth]]);
  statsData.push(["Peak Cost Breakdown:"]);
  statsData.push(["  Labor", monthlyLaborCosts[peakCostMonth], `${(monthlyLaborCosts[peakCostMonth] / peakMonthlyCost * 100).toFixed(1)}%`]);
  statsData.push(["  Facilities", monthlyFacilityCosts[peakCostMonth], `${(monthlyFacilityCosts[peakCostMonth] / peakMonthlyCost * 100).toFixed(1)}%`]);
  statsData.push(["  Workstations", monthlyWorkstationCosts[peakCostMonth], `${(monthlyWorkstationCosts[peakCostMonth] / peakMonthlyCost * 100).toFixed(1)}%`]);
  statsData.push(["  Backend Infrastructure", monthlyBackendCosts[peakCostMonth], `${(monthlyBackendCosts[peakCostMonth] / peakMonthlyCost * 100).toFixed(1)}%`]);
  
  statsData.push([""]);
  statsData.push([""]);
  statsData.push(["Department Rates by Phase:"]);
  statsData.push([""]);
  
  
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
    ["Total Fixed Monthly Facility Costs", calculateTotalFixedFacilityCosts(facilitiesData)],
    ["Total Variable Facility Costs Per Person", calculateTotalVariableFacilityCostsPerPerson(facilitiesData)],
    [""]
  ];
  
  // Add breakdown of fixed facility costs by category
  facilitiesSummaryData.push(["Fixed Facility Costs Breakdown by Category"]);
  facilitiesSummaryData.push([""]);
  facilitiesSummaryData.push(["Category", "Monthly Cost", "% of Total Fixed Costs"]);
  
  const totalFixedCost = calculateTotalFixedFacilityCosts(facilitiesData);
  const fixedCostsByCategory = {};
  
  // Calculate costs by category
  facilitiesData.fixedFacilityCosts.forEach(category => {
    let categoryCost = 0;
    category.items.forEach(item => {
      categoryCost += item.cost;
    });
    fixedCostsByCategory[category.category] = categoryCost;
  });
  
  // Add each category to the summary
  Object.entries(fixedCostsByCategory).forEach(([category, cost]) => {
    const percentage = totalFixedCost > 0 ? (cost / totalFixedCost * 100).toFixed(1) : 0;
    facilitiesSummaryData.push([category, cost, `${percentage}%`]);
  });
  
  facilitiesSummaryData.push([""]);
  facilitiesSummaryData.push([""]);
  
  // Add breakdown of variable facility costs by category
  facilitiesSummaryData.push(["Variable Facility Costs Breakdown by Category"]);
  facilitiesSummaryData.push([""]);
  facilitiesSummaryData.push(["Category", "Cost Per Person", "% of Total Variable Costs"]);
  
  const totalVariableCost = calculateTotalVariableFacilityCostsPerPerson(facilitiesData);
  const variableCostsByCategory = {};
  
  // Calculate costs by category
  facilitiesData.variableFacilityCosts.forEach(category => {
    let categoryCost = 0;
    category.items.forEach(item => {
      categoryCost += item.cost;
    });
    variableCostsByCategory[category.category] = categoryCost;
  });
  
  // Add each category to the summary
  Object.entries(variableCostsByCategory).forEach(([category, cost]) => {
    const percentage = totalVariableCost > 0 ? (cost / totalVariableCost * 100).toFixed(1) : 0;
    facilitiesSummaryData.push([category, cost, `${percentage}%`]);
  });
  
  facilitiesSummaryData.push([""]);
  facilitiesSummaryData.push([""]);
  
  // Add detailed breakdown of all facility costs
  facilitiesSummaryData.push(["Detailed Facility Costs Breakdown"]);
  facilitiesSummaryData.push([""]);
  facilitiesSummaryData.push(["Category", "Item", "Cost", "Type", "Notes"]);
  
  // Add fixed facility costs
  facilitiesData.fixedFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      facilitiesSummaryData.push([
        category.category,
        item.name,
        item.cost,
        "Fixed (Monthly)",
        item.notes || ""
      ]);
    });
  });
  
  // Add variable facility costs
  facilitiesData.variableFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      facilitiesSummaryData.push([
        category.category,
        item.name,
        item.cost,
        "Variable (Per Person)",
        item.notes || ""
      ]);
    });
  });
  
  // Create the facilities summary worksheet
  const facilitiesSummaryWorksheet = XLSX.utils.aoa_to_sheet(facilitiesSummaryData);
  XLSX.utils.book_append_sheet(workbook, facilitiesSummaryWorksheet, "Facilities Summary");
  
  // 4. Workstation Summary Sheet
  const workstationSummaryData = [
    ["Workstation Summary"],
    [""],
    ["Total Workstation Costs by Department"],
    [""],
    ["Department", "Workstation Type", "Quantity", "Purchase Month", "Total Cost"]
  ];
  
  // Calculate total workstation cost from assignments
  let totalWorkstationCostFromAssignments = 0;
  const departmentWorkstationCosts = {};
  const workstationTypeCosts = {};
  
  workstationData.departmentAssignments.forEach(assignment => {
    const bundle = workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
    if (bundle) {
      const cost = bundle.cost * assignment.quantity;
      totalWorkstationCostFromAssignments += cost;
      
      // Track costs by department
      if (!departmentWorkstationCosts[assignment.departmentName]) {
        departmentWorkstationCosts[assignment.departmentName] = 0;
      }
      departmentWorkstationCosts[assignment.departmentName] += cost;
      
      // Track costs by workstation type
      if (!workstationTypeCosts[bundle.name]) {
        workstationTypeCosts[bundle.name] = {
          cost: 0,
          quantity: 0
        };
      }
      workstationTypeCosts[bundle.name].cost += cost;
      workstationTypeCosts[bundle.name].quantity += assignment.quantity;
      
      // Add to the detailed list
      workstationSummaryData.push([
        assignment.departmentName,
        bundle.name,
        assignment.quantity,
        assignment.purchaseMonth || 0,
        cost
      ]);
    }
  });
  
  workstationSummaryData.push([""]);
  workstationSummaryData.push([""]);
  workstationSummaryData.push(["Total Workstation Cost", totalWorkstationCostFromAssignments]);
  workstationSummaryData.push([""]);
  
  // Add breakdown by department
  workstationSummaryData.push(["Workstation Costs by Department"]);
  workstationSummaryData.push([""]);
  workstationSummaryData.push(["Department", "Total Cost", "% of Total Workstation Cost"]);
  
  Object.entries(departmentWorkstationCosts).forEach(([department, cost]) => {
    const percentage = totalWorkstationCostFromAssignments > 0 ? (cost / totalWorkstationCostFromAssignments * 100).toFixed(1) : 0;
    workstationSummaryData.push([department, cost, `${percentage}%`]);
  });
  
  workstationSummaryData.push([""]);
  workstationSummaryData.push([""]);
  
  // Add breakdown by workstation type
  workstationSummaryData.push(["Workstation Costs by Type"]);
  workstationSummaryData.push([""]);
  workstationSummaryData.push(["Workstation Type", "Quantity", "Total Cost", "% of Total Workstation Cost"]);
  
  Object.entries(workstationTypeCosts).forEach(([type, data]) => {
    const percentage = totalWorkstationCostFromAssignments > 0 ? (data.cost / totalWorkstationCostFromAssignments * 100).toFixed(1) : 0;
    workstationSummaryData.push([type, data.quantity, data.cost, `${percentage}%`]);
  });
  
  workstationSummaryData.push([""]);
  workstationSummaryData.push([""]);
  
  // Add workstation bundle details
  workstationSummaryData.push(["Workstation Bundle Details"]);
  workstationSummaryData.push([""]);
  workstationSummaryData.push(["Bundle Name", "Cost", "Components"]);
  
  workstationData.workstationBundles.forEach(bundle => {
    const componentsList = bundle.components.map(c => `${c.name} (${c.quantity}x)`).join(", ");
    workstationSummaryData.push([bundle.name, bundle.cost, componentsList]);
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