<template>
  <div>
    <v-card color="info" class="draggable-card">
      <v-card-title class="d-flex justify-space-between align-center text-white">
        <span>Facilities Cost Editor</span>
        <div>
          <v-btn icon="mdi-refresh" @click="resetEditorPosition" variant="text" color="white" density="compact"></v-btn>
          <v-btn icon="mdi-close" @click="closeFacilitiesEditor" variant="text" color="white" density="compact"></v-btn>
        </div>
      </v-card-title>
      <v-card-text class="bg-white">
        <div class="editor-content">
          <div class="tabs">
            <button 
              :class="{ active: activeTab === 'fixed' }" 
              @click="activeTab = 'fixed'"
            >
              Fixed Costs
            </button>
            <button 
              :class="{ active: activeTab === 'variable' }" 
              @click="activeTab = 'variable'"
            >
              Variable Costs
            </button>
            <button 
              :class="{ active: activeTab === 'allocation' }" 
              @click="activeTab = 'allocation'"
            >
              Department Allocation
            </button>
          </div>
          
          <div v-if="activeTab === 'fixed'" class="tab-content">
            <div class="cost-list">
              <div class="cost-header">
                <div class="cost-name">Item</div>
                <div class="cost-amount">Monthly Cost</div>
                <div class="cost-actions"></div>
              </div>
              <div 
                v-for="(category, catIndex) in facilitiesData.fixedFacilityCosts" 
                :key="'cat-' + catIndex"
                class="cost-category"
              >
                <div class="category-header">
                  <input 
                    type="text" 
                    v-model="category.category" 
                    @input="updateFacilitiesData"
                    class="category-name-input"
                    placeholder="Category name"
                  >
                  <button @click="removeFixedCostCategory(catIndex)" class="remove-button">×</button>
                </div>
                <div 
                  v-for="(item, itemIndex) in category.items" 
                  :key="'item-' + catIndex + '-' + itemIndex"
                  class="cost-item"
                >
                  <input 
                    type="text" 
                    v-model="item.name" 
                    @input="updateFacilitiesData"
                    class="cost-name-input"
                    placeholder="Cost item name"
                  >
                  <div class="cost-amount-wrapper">
                    <span class="currency-symbol">$</span>
                    <input 
                      type="number" 
                      v-model.number="item.cost" 
                      @input="updateFacilitiesData"
                      class="cost-amount-input"
                      min="0"
                      step="100"
                    >
                  </div>
                  <button @click="removeFixedCostItem(catIndex, itemIndex)" class="remove-button">×</button>
                </div>
                <button @click="addFixedCostItem(catIndex)" class="add-item-button">+ Add Item</button>
              </div>
              <button @click="addFixedCostCategory" class="add-category-button">+ Add Category</button>
            </div>
            <div class="cost-summary">
              <div class="summary-label">Total Monthly Fixed Costs:</div>
              <div class="summary-amount">${{ formatCurrency(getTotalFixedCosts()) }}</div>
            </div>
          </div>
          
          <div v-if="activeTab === 'variable'" class="tab-content">
            <div class="cost-list">
              <div class="cost-header">
                <div class="cost-name">Item</div>
                <div class="cost-amount">Cost Per Person</div>
                <div class="cost-actions"></div>
              </div>
              <div 
                v-for="(category, catIndex) in facilitiesData.variableFacilityCosts" 
                :key="'cat-' + catIndex"
                class="cost-category"
              >
                <div class="category-header">
                  <input 
                    type="text" 
                    v-model="category.category" 
                    @input="updateFacilitiesData"
                    class="category-name-input"
                    placeholder="Category name"
                  >
                  <button @click="removeVariableCostCategory(catIndex)" class="remove-button">×</button>
                </div>
                <div 
                  v-for="(item, itemIndex) in category.items" 
                  :key="'item-' + catIndex + '-' + itemIndex"
                  class="cost-item"
                >
                  <input 
                    type="text" 
                    v-model="item.name" 
                    @input="updateFacilitiesData"
                    class="cost-name-input"
                    placeholder="Cost item name"
                  >
                  <div class="cost-amount-wrapper">
                    <span class="currency-symbol">$</span>
                    <input 
                      type="number" 
                      v-model.number="item.cost" 
                      @input="updateFacilitiesData"
                      class="cost-amount-input"
                      min="0"
                      step="5"
                    >
                  </div>
                  <button @click="removeVariableCostItem(catIndex, itemIndex)" class="remove-button">×</button>
                </div>
                <button @click="addVariableCostItem(catIndex)" class="add-item-button">+ Add Item</button>
              </div>
              <button @click="addVariableCostCategory" class="add-category-button">+ Add Category</button>
            </div>
            <div class="cost-summary">
              <div class="summary-label">Total Variable Costs Per Person:</div>
              <div class="summary-amount">${{ formatCurrency(getTotalVariableCostsPerPerson()) }}</div>
            </div>
            <div class="cost-summary">
              <div class="summary-label">Total Variable Costs ({{ peakCrewSize }} people):</div>
              <div class="summary-amount">${{ formatCurrency(getTotalVariableCostsPerPerson() * peakCrewSize) }}</div>
            </div>
          </div>
          
          <div v-if="activeTab === 'allocation'" class="tab-content">
            <div class="allocation-controls">
              <button @click="allocateEvenly" class="allocation-button">Allocate Evenly</button>
              <button @click="allocateByCrewSize" class="allocation-button">Allocate by Crew Size</button>
              <button @click="clearAllocation" class="allocation-button">Clear Allocation</button>
            </div>
            <div class="allocation-list">
              <div class="allocation-header">
                <div class="allocation-department">Department</div>
                <div class="allocation-percentage">% of Facilities Cost</div>
                <div class="allocation-amount">Allocated Amount</div>
              </div>
              <div 
                v-for="(dept, index) in departments" 
                :key="index"
                class="allocation-item"
              >
                <div class="allocation-department">{{ dept.name }}</div>
                <div class="allocation-percentage">
                  <input 
                    type="number" 
                    v-model.number="facilitiesData.departmentAllocation[index]" 
                    @input="updateFacilitiesData"
                    class="allocation-percentage-input"
                    min="0"
                    max="100"
                    step="1"
                  >%
                </div>
                <div class="allocation-cell">${{ formatCurrency(getAllocationAmount(dept)) }}</div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { 
  calculateTotalFixedFacilityCosts, 
  calculateTotalVariableFacilityCostsPerPerson,
  calculateFacilityCostsForMonth
} from '../facilities-data.js';


export default {
  name: 'FacilitiesCostEditor',
  props: {
    facilitiesData: {
      type: Object,
      required: true
    },
    departments: {
      type: Array,
      required: true
    },
    peakCrewSize: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      activeTab: 'fixed'
    };
  },
  created() {
    // Initialize departmentAllocation if it doesn't exist
    if (!this.facilitiesData.departmentAllocation) {
      this.facilitiesData.departmentAllocation = Array(this.departments.length).fill(0);
    }
    
    // Ensure array length matches departments length
    while (this.facilitiesData.departmentAllocation.length < this.departments.length) {
      this.facilitiesData.departmentAllocation.push(0);
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    
    updateFacilitiesData() {
      // Ensure department allocation percentages are initialized
      if (!this.facilitiesData.departmentAllocation) {
        this.facilitiesData.departmentAllocation = Array(this.departments.length).fill(0);
      }
      
      // Ensure array length matches departments length
      while (this.facilitiesData.departmentAllocation.length < this.departments.length) {
        this.facilitiesData.departmentAllocation.push(0);
      }
      
      this.$emit('update-costs');
    },
    
    addFixedCostCategory() {
      this.facilitiesData.fixedFacilityCosts.push({
        category: 'New Category',
        items: []
      });
      this.updateFacilitiesData();
    },
    
    removeFixedCostCategory(catIndex) {
      if (this.facilitiesData.fixedFacilityCosts[catIndex].items.length > 0) {
        if (!confirm('This will remove all items in this category. Continue?')) {
          return;
        }
      }
      this.facilitiesData.fixedFacilityCosts.splice(catIndex, 1);
      this.updateFacilitiesData();
    },
    
    addFixedCostItem(catIndex) {
      this.facilitiesData.fixedFacilityCosts[catIndex].items.push({
        name: '',
        cost: 0
      });
      this.updateFacilitiesData();
    },
    
    removeFixedCostItem(catIndex, itemIndex) {
      this.facilitiesData.fixedFacilityCosts[catIndex].items.splice(itemIndex, 1);
      this.updateFacilitiesData();
    },
    
    addVariableCostCategory() {
      this.facilitiesData.variableFacilityCosts.push({
        category: 'New Category',
        items: []
      });
      this.updateFacilitiesData();
    },
    
    removeVariableCostCategory(catIndex) {
      if (this.facilitiesData.variableFacilityCosts[catIndex].items.length > 0) {
        if (!confirm('This will remove all items in this category. Continue?')) {
          return;
        }
      }
      this.facilitiesData.variableFacilityCosts.splice(catIndex, 1);
      this.updateFacilitiesData();
    },
    
    addVariableCostItem(catIndex) {
      this.facilitiesData.variableFacilityCosts[catIndex].items.push({
        name: '',
        cost: 0
      });
      this.updateFacilitiesData();
    },
    
    removeVariableCostItem(catIndex, itemIndex) {
      this.facilitiesData.variableFacilityCosts[catIndex].items.splice(itemIndex, 1);
      this.updateFacilitiesData();
    },
    
    getTotalFixedCosts() {
      return calculateTotalFixedFacilityCosts(this.facilitiesData);
    },
    
    getTotalVariableCostsPerPerson() {
      return calculateTotalVariableFacilityCostsPerPerson(this.facilitiesData);
    },
    
    getAllocationAmount(dept) {
      const index = this.departments.indexOf(dept);
      if (index === -1) return 0;
      
      // Ensure departmentAllocation exists
      if (!this.facilitiesData.departmentAllocation) {
        this.facilitiesData.departmentAllocation = Array(this.departments.length).fill(0);
      }
      
      const percentage = this.facilitiesData.departmentAllocation[index] || 0;
      const totalCost = this.getTotalFixedCosts() + (this.getTotalVariableCostsPerPerson() * this.peakCrewSize);
      
      return (percentage / 100) * totalCost;
    },
    
    // startDrag method removed as it's now handled by the parent component
    
    allocateEvenly() {
      // Allocate facilities costs evenly among all departments
      const departmentCount = this.departments.length;
      if (departmentCount === 0) return;
      
      const evenPercentage = Math.floor(100 / departmentCount);
      let remaining = 100 - (evenPercentage * departmentCount);
      
      // Initialize departmentAllocation if it doesn't exist
      if (!this.facilitiesData.departmentAllocation) {
        this.facilitiesData.departmentAllocation = [];
      }
      
      // Set even percentages
      this.facilitiesData.departmentAllocation = this.departments.map((_, index) => {
        // Add the remainder to the first department
        if (index === 0) {
          return evenPercentage + remaining;
        }
        return evenPercentage;
      });
      
      this.updateFacilitiesData();
    },
    
    allocateByCrewSize() {
      // Allocate facilities costs proportionally to crew size
      const totalCrew = this.departments.reduce((sum, dept) => sum + dept.maxCrew, 0);
      if (totalCrew === 0) {
        this.allocateEvenly();
        return;
      }
      
      // Initialize departmentAllocation if it doesn't exist
      if (!this.facilitiesData.departmentAllocation) {
        this.facilitiesData.departmentAllocation = [];
      }
      
      // Calculate percentages based on crew size
      let totalPercentage = 0;
      const rawPercentages = this.departments.map(dept => {
        const percentage = Math.floor((dept.maxCrew / totalCrew) * 100);
        totalPercentage += percentage;
        return percentage;
      });
      
      // Distribute any remaining percentage to the largest department
      let remaining = 100 - totalPercentage;
      if (remaining > 0) {
        let maxCrewIndex = 0;
        let maxCrew = 0;
        
        this.departments.forEach((dept, index) => {
          if (dept.maxCrew > maxCrew) {
            maxCrew = dept.maxCrew;
            maxCrewIndex = index;
          }
        });
        
        rawPercentages[maxCrewIndex] += remaining;
      }
      
      this.facilitiesData.departmentAllocation = rawPercentages;
      this.updateFacilitiesData();
    },
    
    clearAllocation() {
      // Clear all allocation percentages
      if (!this.facilitiesData.departmentAllocation) {
        this.facilitiesData.departmentAllocation = [];
      }
      
      this.facilitiesData.departmentAllocation = Array(this.departments.length).fill(0);
      this.updateFacilitiesData();
    },
    
    resetEditorPosition() {
      this.$emit('reset-position');
    },
    
    closeFacilitiesEditor() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
/* Draggable editor panels */
.floating-editor {
  position: fixed !important;
  z-index: 1000 !important;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
  border-radius: 8px;
  overflow: hidden;
  transition: none !important; /* Disable transitions for smooth dragging */
  user-select: none; /* Prevent text selection during drag */
}

.draggable-card {
  cursor: move !important;
  width: 100%;
  height: 100%;
}

.draggable-card .v-card-title {
  cursor: move !important;
  user-select: none !important;
  touch-action: none !important;
  background-color: var(--info-color) !important;
}

.facilities-editor {
  position: absolute;
  width: 600px;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #0284c7;
  color: white;
  cursor: move;
}

.editor-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.editor-controls {
  display: flex;
  gap: 8px;
}

.reset-button, .close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.reset-button:hover, .close-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.v-card-text {
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.editor-content {
  padding: 16px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.tabs button {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #64748b;
}

.tabs button.active {
  color: #0284c7;
  border-bottom-color: #0284c7;
}

.tab-content {
  margin-top: 16px;
}

.cost-list, .allocation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cost-header, .allocation-header {
  display: grid;
  padding: 8px 16px;
  background-color: #f8fafc;
  border-radius: 6px;
  font-weight: 500;
  color: #64748b;
}

.cost-header {
  grid-template-columns: 2fr 1fr 0.5fr;
}

.allocation-header {
  grid-template-columns: 2fr 1fr 1fr;
}

.cost-item, .allocation-item {
  display: grid;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  align-items: center;
}

.cost-category {
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.category-name-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-weight: 500;
  background-color: white;
}

.cost-item {
  grid-template-columns: 2fr 1fr 0.5fr;
  margin: 8px;
}

.add-item-button {
  margin: 8px;
  width: calc(100% - 16px);
  padding: 6px;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  background-color: #f8fafc;
  color: #64748b;
  cursor: pointer;
  text-align: center;
  font-size: 0.9rem;
}

.add-category-button {
  width: 100%;
  padding: 8px;
  border: 1px dashed #94a3b8;
  border-radius: 6px;
  background-color: #f1f5f9;
  color: #475569;
  cursor: pointer;
  text-align: center;
  font-weight: 500;
  margin-bottom: 16px;
}

.allocation-item {
  grid-template-columns: 2fr 1fr 1fr;
}

.cost-name-input, .allocation-percentage-input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  width: 100%;
}

.cost-amount-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-symbol {
  color: #64748b;
}

.cost-amount-input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  width: 100%;
}

.remove-button {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.remove-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.add-cost-button {
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
}

.add-cost-button:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #475569;
}

.cost-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-radius: 6px;
}

.summary-label {
  font-weight: 500;
  color: #64748b;
}

.summary-amount {
  font-weight: 600;
  color: #0284c7;
}

.allocation-percentage {
  display: flex;
  align-items: center;
  gap: 4px;
}

.allocation-percentage-input {
  width: 60px;
  text-align: right;
}

.allocation-cell {
  display: flex;
  align-items: center;
}

.allocation-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.allocation-button {
  padding: 8px 12px;
  background-color: #e2e8f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.allocation-button:hover {
  background-color: #cbd5e1;
}
</style>