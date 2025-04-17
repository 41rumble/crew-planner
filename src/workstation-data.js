/**
 * Workstation data structure for the crew planning tool
 */

export const workstationData = {
  // Workstation bundles
  workstationBundles: [
    {
      id: "LTWS",
      name: "Lighting Workstation",
      description: "Standard workstation for lighting artists",
      cost: 10248,
      components: [
        { name: "HP WX8400", type: "hardware", cost: 3600, quantity: 1 },
        { name: "24inch monitors", type: "hardware", cost: 990, quantity: 2 },
        { name: "Maya2014", type: "software", cost: 4658, quantity: 1 },
        { name: "Digital Fusion", type: "software", cost: 1000, quantity: 1 }
      ]
    },
    {
      id: "CDWS",
      name: "Crowd Workstation",
      description: "Workstation for crowd simulation",
      cost: 17066,
      components: [
        { name: "HP WX8400", type: "hardware", cost: 3600, quantity: 1 },
        { name: "24inch monitors", type: "hardware", cost: 990, quantity: 2 },
        { name: "Maya2014", type: "software", cost: 4658, quantity: 1 },
        { name: "Massive", type: "software", cost: 6818, quantity: 1 },
        { name: "Digital Fusion", type: "software", cost: 1000, quantity: 1 }
      ]
    },
    {
      id: "MTWS",
      name: "Model/Texture Workstation",
      description: "Workstation for modeling and texturing",
      cost: 12048,
      components: [
        { name: "Dell Precision T3610 CTO Base", type: "hardware", cost: 3600, quantity: 1 },
        { name: "24 inch monitor", type: "hardware", cost: 990, quantity: 2 },
        { name: "Maya2014", type: "software", cost: 4658, quantity: 1 },
        { name: "ZBrush", type: "software", cost: 1000, quantity: 1 },
        { name: "Digital Fusion", type: "software", cost: 1000, quantity: 1 },
        { name: "Photoshop CS6", type: "software", cost: 800, quantity: 1 }
      ]
    },
    {
      id: "ANWS",
      name: "Animation Workstation",
      description: "Workstation for animators",
      cost: 9248,
      components: [
        { name: "Dell Precision T3610 CTO Base", type: "hardware", cost: 3600, quantity: 1 },
        { name: "24 inch monitor", type: "hardware", cost: 990, quantity: 2 },
        { name: "Maya2014", type: "software", cost: 4658, quantity: 1 }
      ]
    },
    {
      id: "RNWS",
      name: "IT & R&D Workstation",
      description: "Workstation for IT and R&D staff",
      cost: 4590,
      components: [
        { name: "Dell Precision T3610 CTO Base", type: "hardware", cost: 3600, quantity: 1 },
        { name: "24 inch monitor", type: "hardware", cost: 990, quantity: 2 }
      ]
    },
    {
      id: "PRWS",
      name: "Production Workstation",
      description: "Workstation for production staff",
      cost: 2515,
      components: [
        { name: "15 inch Laptop", type: "hardware", cost: 1800, quantity: 1 },
        { name: "Microsoft Office", type: "software", cost: 220, quantity: 1 },
        { name: "24 inch monitor", type: "hardware", cost: 495, quantity: 1 }
      ]
    },
    {
      id: "EDWS",
      name: "Editorial Workstation",
      description: "Workstation for editorial staff",
      cost: 18974,
      components: [
        { name: "Mac Pro", type: "hardware", cost: 3999, quantity: 1 },
        { name: "22 inch monitor", type: "hardware", cost: 475, quantity: 1 },
        { name: "40 inch TV/Monitor (Sony Bravia W series)", type: "hardware", cost: 3000, quantity: 1 },
        { name: "Fast/Large Disk Array – 12TB, 600MB/s", type: "hardware", cost: 10000, quantity: 1 },
        { name: "Final Cut Pro Studio", type: "software", cost: 1500, quantity: 1 }
      ]
    }
  ],
  
  // Backend infrastructure
  backendInfrastructure: [
    {
      category: "Rendering",
      items: [
        { name: "3Delight", cost: 1370, quantity: 80, notes: "Renderer licenses" },
        { name: "Maintenance", cost: 515, quantity: 160, notes: "Annual maintenance" },
        { name: "Smedge - Site License", cost: 2000, quantity: 2, notes: "Render farm management" }
      ]
    },
    {
      category: "Networking",
      items: [
        { name: "Routers", cost: 900, quantity: 6 },
        { name: "Cabling", cost: 2000, quantity: 1 }
      ]
    },
    {
      category: "Storage",
      items: [
        { name: "SYD 36TB Server", cost: 12000, quantity: 1 },
        { name: "BKK 36TB Server", cost: 12000, quantity: 1 },
        { name: "SYD Backup Tape Library", cost: 14000, quantity: 1 },
        { name: "BKK Backup Tape Library", cost: 14000, quantity: 1 },
        { name: "LTO5 Tapes", cost: 100, quantity: 100 }
      ]
    }
  ],
  
  // Department workstation assignments
  departmentAssignments: []
};

// Helper function to calculate total cost for a workstation bundle
export function calculateWorkstationBundleCost(bundle) {
  let total = 0;
  
  bundle.components.forEach(component => {
    total += component.cost * component.quantity;
  });
  
  return total;
}

// Helper function to calculate total backend infrastructure cost
export function calculateBackendInfrastructureCost(infrastructure) {
  let total = 0;
  
  infrastructure.forEach(category => {
    category.items.forEach(item => {
      total += item.cost * item.quantity;
    });
  });
  
  return total;
}

// Helper function to calculate total workstation costs for all departments
export function calculateTotalWorkstationCosts(workstationData, departments) {
  let total = 0;
  
  // Calculate costs from department assignments
  workstationData.departmentAssignments.forEach(assignment => {
    const bundle = workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
    if (bundle) {
      total += bundle.cost * assignment.quantity;
    }
  });
  
  return total;
}

// Helper function to initialize department assignments based on departments
export function initializeDepartmentAssignments(workstationData, departments) {
  // Clear existing assignments
  workstationData.departmentAssignments = [];
  
  // Create default assignments for each department
  departments.forEach(dept => {
    // Try to find a matching workstation type based on department name
    let workstationId = "ANWS"; // Default to animation workstation
    
    const deptName = dept.name.toLowerCase();
    
    if (deptName.includes("light")) {
      workstationId = "LTWS";
    } else if (deptName.includes("crowd")) {
      workstationId = "CDWS";
    } else if (deptName.includes("model") || deptName.includes("texture") || deptName.includes("tex")) {
      workstationId = "MTWS";
    } else if (deptName.includes("anim")) {
      workstationId = "ANWS";
    } else if (deptName.includes("it") || deptName.includes("r&d") || deptName.includes("research")) {
      workstationId = "RNWS";
    } else if (deptName.includes("prod")) {
      workstationId = "PRWS";
    } else if (deptName.includes("edit")) {
      workstationId = "EDWS";
    }
    
    // Create the assignment
    workstationData.departmentAssignments.push({
      departmentId: dept.name.toLowerCase().replace(/\s+/g, '-'),
      departmentName: dept.name,
      workstationId: workstationId,
      quantity: dept.maxCrew, // Default to max crew size
      notes: `Default assignment for ${dept.name}`
    });
  });
  
  return workstationData.departmentAssignments;
}

// Helper function to calculate monthly workstation costs based on peak crew size
export function calculateMonthlyWorkstationCosts(workstationData, crewMatrix, departments) {
  const monthlyCosts = new Array(crewMatrix[0]?.length || 0).fill(0);
  const totalWorkstationCost = calculateTotalWorkstationCost(workstationData, crewMatrix, departments);
  
  // Distribute the total workstation cost evenly across the project duration
  // This represents the depreciation of the workstations over the project
  const monthlyDepreciationCost = totalWorkstationCost / monthlyCosts.length;
  
  // Apply the monthly depreciation cost to all months
  for (let m = 0; m < monthlyCosts.length; m++) {
    monthlyCosts[m] = monthlyDepreciationCost;
  }
  
  return monthlyCosts;
}

// Helper function to calculate the total workstation cost based on peak crew size per department
export function calculateTotalWorkstationCost(workstationData, crewMatrix, departments) {
  let totalCost = 0;
  
  // For each department, find the peak crew size and calculate workstation cost
  for (let d = 0; d < departments.length; d++) {
    // Find the workstation assignment for this department
    const deptId = departments[d].name.toLowerCase().replace(/\s+/g, '-');
    const assignment = workstationData.departmentAssignments.find(a => a.departmentId === deptId);
    
    if (assignment) {
      // Find the workstation bundle
      const bundle = workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
      
      if (bundle) {
        // Calculate cost per workstation
        const costPerWorkstation = bundle.cost;
        
        // Find peak crew size for this department
        let peakCrewSize = 0;
        for (let m = 0; m < crewMatrix[d].length; m++) {
          peakCrewSize = Math.max(peakCrewSize, crewMatrix[d][m]);
        }
        
        // Calculate workstation cost for this department based on peak crew size
        if (peakCrewSize > 0) {
          // Use the minimum of peak crew size and assigned quantity
          const workstationCount = Math.min(peakCrewSize, assignment.quantity);
          
          // Calculate total cost for this department
          const departmentCost = costPerWorkstation * workstationCount;
          
          // Add to total cost
          totalCost += departmentCost;
        }
      }
    }
  }
  
  return totalCost;
}