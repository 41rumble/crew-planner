/**
 * Facilities cost data structure for the crew planning tool
 */

export const facilitiesData = {
  // Fixed facility costs (monthly)
  fixedFacilityCosts: [
    {
      category: "Rent",
      items: [
        { name: "Office Space", cost: 25000, notes: "2000 sq ft @ $12.50/sq ft" },
        { name: "Studio Space", cost: 15000, notes: "1000 sq ft @ $15/sq ft" }
      ]
    },
    {
      category: "Utilities",
      items: [
        { name: "Electricity", cost: 3500, notes: "Based on previous 3-month average" },
        { name: "Water", cost: 500 },
        { name: "Internet", cost: 1200, notes: "100Mbps dedicated fiber" },
        { name: "Phone", cost: 800 }
      ]
    },
    {
      category: "Building Services",
      items: [
        { name: "Security", cost: 2000 },
        { name: "Cleaning", cost: 1500 },
        { name: "Maintenance", cost: 1000 }
      ]
    },
    {
      category: "Insurance",
      items: [
        { name: "Property", cost: 1200 },
        { name: "Liability", cost: 800 },
        { name: "Equipment", cost: 1500 }
      ]
    }
  ],
  
  // Variable facility costs (per person, monthly)
  variableFacilityCosts: [
    {
      category: "Amenities",
      items: [
        { name: "Kitchen Supplies", cost: 15 },
        { name: "Coffee/Tea", cost: 25 },
        { name: "Snacks", cost: 20 }
      ]
    },
    {
      category: "Office Supplies",
      items: [
        { name: "Printing", cost: 10 },
        { name: "Stationery", cost: 5 },
        { name: "Miscellaneous", cost: 10 }
      ]
    }
  ],
  
  // Space allocation by department (optional)
  departmentSpaceAllocation: [
    // Will be populated based on departments
  ],
  
  // Allocation method settings
  facilityCostAllocation: {
    method: "equal", // "equal", "weighted", "space", or "custom"
    customWeights: [
      // Will be populated based on departments
    ]
  }
};

// Helper function to calculate total fixed facility costs per month
export function calculateTotalFixedFacilityCosts(facilitiesData) {
  let total = 0;
  
  facilitiesData.fixedFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      total += item.cost;
    });
  });
  
  return total;
}

// Helper function to calculate total variable facility costs per person per month
export function calculateTotalVariableFacilityCostsPerPerson(facilitiesData) {
  let total = 0;
  
  facilitiesData.variableFacilityCosts.forEach(category => {
    category.items.forEach(item => {
      total += item.cost;
    });
  });
  
  return total;
}

// Helper function to calculate total facility costs for a given month based on crew size
export function calculateFacilityCostsForMonth(facilitiesData, totalCrewSize) {
  const fixedCosts = calculateTotalFixedFacilityCosts(facilitiesData);
  const variableCostsPerPerson = calculateTotalVariableFacilityCostsPerPerson(facilitiesData);
  
  return fixedCosts + (variableCostsPerPerson * totalCrewSize);
}