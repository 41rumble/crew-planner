/**
 * Export project data to multiple CSV files
 * @param {Object} appState - The current application state
 */
export function exportToMultipleCSV(appState) {
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
  
  const { 
    generateFacilitiesCSV, 
    generateWorkstationsCSV 
  } = appState.exportFunctions;

  // Create a set of CSV files for different sections
  const files = [];
  
  // 1. Timeline CSV
  let timelineCSV = "Timeline Data\n\n";
  
  // Add header row with year and month names
  timelineCSV += ",";
  years.forEach(year => {
    // Add the year followed by empty cells for each month
    timelineCSV += year + "," + ",".repeat(11) + ",";
  });
  timelineCSV += "\n";
  
  timelineCSV += ",";
  years.forEach(year => {
    // Add all months for this year
    monthsPerYear.forEach(month => {
      timelineCSV += month + ",";
    });
  });
  timelineCSV += "\n";
  
  // Add an empty row
  timelineCSV += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
  
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
    timelineCSV += sectionName + ":,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
    
    // Add departments in this section
    sections[sectionName].forEach(deptInfo => {
      // Add department name
      timelineCSV += deptInfo.dept.name + ",";
      
      // Add crew counts for each month
      for (let i = 0; i < months.length; i++) {
        timelineCSV += crewMatrix[deptInfo.index][i] + ",";
      }
      
      // Do NOT add rate at the end - this causes issues with the import
      timelineCSV += "\n";
      
      // Add an empty row after each department (only if not the last department in the section)
      if (sections[sectionName].indexOf(deptInfo) < sections[sectionName].length - 1) {
        timelineCSV += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
      }
    });
    
    // Add an empty row after each section
    timelineCSV += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
    timelineCSV += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
  });
  
  // Add monthly costs to timeline
  timelineCSV += "Monthly Labor Cost,";
  for (let i = 0; i < months.length; i++) {
    timelineCSV += monthlyLaborCosts[i] + ",";
  }
  timelineCSV += "\n";
  
  timelineCSV += "Monthly Facility Cost,";
  for (let i = 0; i < months.length; i++) {
    timelineCSV += monthlyFacilityCosts[i] + ",";
  }
  timelineCSV += "\n";
  
  timelineCSV += "Workstation Cost (One-time),";
  for (let i = 0; i < months.length; i++) {
    timelineCSV += monthlyWorkstationCosts[i] + ",";
  }
  timelineCSV += "\n";

  timelineCSV += "Total Monthly Cost,";
  for (let i = 0; i < months.length; i++) {
    timelineCSV += monthlyCosts[i] + ",";
  }
  timelineCSV += "\n";
  
  timelineCSV += "Cumulative Cost,";
  for (let i = 0; i < months.length; i++) {
    timelineCSV += cumulativeCosts[i] + ",";
  }
  timelineCSV += "\n";
  
  files.push({
    name: "1_timeline.csv",
    content: timelineCSV
  });
  
  // 2. Stats CSV
  let statsCSV = "Project Statistics\n\n";
  statsCSV += "Total Project Cost," + totalProjectCost + "\n";
  statsCSV += "Peak Monthly Cost," + peakMonthlyCost + "\n";
  statsCSV += "Peak Crew Size," + peakCrewSize + "\n\n";
  
  // Add department rates by phase
  statsCSV += "Department Rates by Phase:\n";
  
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
    statsCSV += phaseName + "\n";
    statsCSV += "Department,Rate ($/month)\n";
    
    phaseDepts.forEach(dept => {
      statsCSV += dept.name + "," + dept.rate + "\n";
    });
    
    statsCSV += "\n";
  }
  
  files.push({
    name: "2_stats.csv",
    content: statsCSV
  });
  
  // 3. Facilities Summary CSV
  let facilitiesSummaryCSV = "Facilities Summary\n\n";
  facilitiesSummaryCSV += "Fixed Monthly Facility Costs," + calculateTotalFixedFacilityCosts(facilitiesData) + "\n";
  facilitiesSummaryCSV += "Variable Facility Costs Per Person," + calculateTotalVariableFacilityCostsPerPerson(facilitiesData) + "\n";
  
  files.push({
    name: "3_facilities_summary.csv",
    content: facilitiesSummaryCSV
  });
  
  // 4. Workstation Summary CSV
  let workstationSummaryCSV = "Workstation Summary\n\n";
  workstationSummaryCSV += "Department,Workstation Type,Quantity,Total Cost\n";
  
  workstationData.departmentAssignments.forEach(assignment => {
    const bundle = workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
    if (bundle) {
      const totalCost = bundle.cost * assignment.quantity;
      workstationSummaryCSV += assignment.departmentName + "," + bundle.name + "," + assignment.quantity + "," + totalCost + "\n";
    }
  });
  
  files.push({
    name: "4_workstation_summary.csv",
    content: workstationSummaryCSV
  });
  
  // 5. Detailed Facilities CSV
  const facilitiesCSV = generateFacilitiesCSV(facilitiesData);
  files.push({
    name: "5_facilities_detail.csv",
    content: facilitiesCSV
  });
  
  // 6. Detailed Workstations CSV
  const workstationsCSV = generateWorkstationsCSV(workstationData);
  files.push({
    name: "6_workstations_detail.csv",
    content: workstationsCSV
  });
  
  // Create a blob for each file and download them
  files.forEach(file => {
    const blob = new Blob([file.content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", file.name);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  });
}