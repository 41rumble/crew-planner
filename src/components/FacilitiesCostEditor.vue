<template>
  <div class="facilities-editor" :class="editorPosition" :style="editorStyle" ref="facilitiesEditor" @mousedown="startDrag($event)">
    <div class="editor-header">
      <h2>Facilities Cost Editor</h2>
      <div class="editor-controls">
        <button @click="resetEditorPosition" class="reset-button" title="Reset Position">⟲</button>
        <button @click="closeFacilitiesEditor" class="close-button">X</button>
      </div>
    </div>
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
          Allocation
        </button>
      </div>
      
      <!-- Fixed Costs Tab -->
      <div v-if="activeTab === 'fixed'" class="tab-content">
        <div class="tab-actions">
          <button @click="addFixedCategory" class="action-button">Add Category</button>
          <button @click="addFixedItem" class="action-button" :disabled="!selectedFixedCategory">Add Item</button>
        </div>
        
        <div class="cost-summary">
          <div class="summary-label">Total Fixed Monthly Costs:</div>
          <div class="summary-value">${{ formatCurrency(totalFixedCosts) }}</div>
        </div>
        
        <div class="categories-list">
          <div v-for="(category, categoryIndex) in facilitiesData.fixedFacilityCosts" :key="'fixed-' + categoryIndex" class="category">
            <div class="category-header" @click="toggleCategory(categoryIndex, 'fixed')">
              <div class="category-name">
                <span v-if="editingCategory === 'fixed-' + categoryIndex">
                  <input 
                    v-model="category.category" 
                    @blur="editingCategory = null" 
                    @keyup.enter="editingCategory = null"
                    ref="categoryInput"
                    class="category-edit-input"
                  >
                </span>
                <span v-else @dblclick="startEditingCategory(categoryIndex, 'fixed')">
                  {{ category.category }}
                </span>
              </div>
              <div class="category-actions">
                <button @click.stop="removeCategory(categoryIndex, 'fixed')" class="delete-button">X</button>
              </div>
            </div>
            
            <div class="category-items">
              <div v-for="(item, itemIndex) in category.items" :key="'fixed-' + categoryIndex + '-' + itemIndex" class="cost-item">
                <div class="item-name">
                  <span v-if="editingItem === 'fixed-' + categoryIndex + '-' + itemIndex + '-name'">
                    <input 
                      v-model="item.name" 
                      @blur="editingItem = null" 
                      @keyup.enter="editingItem = null"
                      ref="itemNameInput"
                      class="item-edit-input"
                    >
                  </span>
                  <span v-else @dblclick="startEditingItem(categoryIndex, itemIndex, 'fixed', 'name')">
                    {{ item.name }}
                  </span>
                </div>
                <div class="item-cost">
                  <span v-if="editingItem === 'fixed-' + categoryIndex + '-' + itemIndex + '-cost'">
                    <input 
                      v-model.number="item.cost" 
                      @blur="editingItem = null; updateCosts()" 
                      @keyup.enter="editingItem = null; updateCosts()"
                      ref="itemCostInput"
                      class="item-edit-input cost-input"
                      type="number"
                      min="0"
                    >
                  </span>
                  <span v-else @dblclick="startEditingItem(categoryIndex, itemIndex, 'fixed', 'cost')">
                    ${{ formatCurrency(item.cost) }}
                  </span>
                </div>
                <div class="item-notes">
                  <span v-if="editingItem === 'fixed-' + categoryIndex + '-' + itemIndex + '-notes'">
                    <input 
                      v-model="item.notes" 
                      @blur="editingItem = null" 
                      @keyup.enter="editingItem = null"
                      ref="itemNotesInput"
                      class="item-edit-input notes-input"
                    >
                  </span>
                  <span v-else @dblclick="startEditingItem(categoryIndex, itemIndex, 'fixed', 'notes')">
                    {{ item.notes || 'Add notes...' }}
                  </span>
                </div>
                <div class="item-actions">
                  <button @click="removeItem(categoryIndex, itemIndex, 'fixed')" class="delete-button">X</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Variable Costs Tab -->
      <div v-if="activeTab === 'variable'" class="tab-content">
        <div class="tab-actions">
          <button @click="addVariableCategory" class="action-button">Add Category</button>
          <button @click="addVariableItem" class="action-button" :disabled="!selectedVariableCategory">Add Item</button>
        </div>
        
        <div class="cost-summary">
          <div class="summary-label">Total Variable Costs Per Person:</div>
          <div class="summary-value">${{ formatCurrency(totalVariableCostsPerPerson) }}</div>
        </div>
        
        <div class="categories-list">
          <div v-for="(category, categoryIndex) in facilitiesData.variableFacilityCosts" :key="'variable-' + categoryIndex" class="category">
            <div class="category-header" @click="toggleCategory(categoryIndex, 'variable')">
              <div class="category-name">
                <span v-if="editingCategory === 'variable-' + categoryIndex">
                  <input 
                    v-model="category.category" 
                    @blur="editingCategory = null" 
                    @keyup.enter="editingCategory = null"
                    ref="categoryInput"
                    class="category-edit-input"
                  >
                </span>
                <span v-else @dblclick="startEditingCategory(categoryIndex, 'variable')">
                  {{ category.category }}
                </span>
              </div>
              <div class="category-actions">
                <button @click.stop="removeCategory(categoryIndex, 'variable')" class="delete-button">X</button>
              </div>
            </div>
            
            <div class="category-items">
              <div v-for="(item, itemIndex) in category.items" :key="'variable-' + categoryIndex + '-' + itemIndex" class="cost-item">
                <div class="item-name">
                  <span v-if="editingItem === 'variable-' + categoryIndex + '-' + itemIndex + '-name'">
                    <input 
                      v-model="item.name" 
                      @blur="editingItem = null" 
                      @keyup.enter="editingItem = null"
                      ref="itemNameInput"
                      class="item-edit-input"
                    >
                  </span>
                  <span v-else @dblclick="startEditingItem(categoryIndex, itemIndex, 'variable', 'name')">
                    {{ item.name }}
                  </span>
                </div>
                <div class="item-cost">
                  <span v-if="editingItem === 'variable-' + categoryIndex + '-' + itemIndex + '-cost'">
                    <input 
                      v-model.number="item.cost" 
                      @blur="editingItem = null; updateCosts()" 
                      @keyup.enter="editingItem = null; updateCosts()"
                      ref="itemCostInput"
                      class="item-edit-input cost-input"
                      type="number"
                      min="0"
                    >
                  </span>
                  <span v-else @dblclick="startEditingItem(categoryIndex, itemIndex, 'variable', 'cost')">
                    ${{ formatCurrency(item.cost) }}
                  </span>
                </div>
                <div class="item-notes">
                  <span v-if="editingItem === 'variable-' + categoryIndex + '-' + itemIndex + '-notes'">
                    <input 
                      v-model="item.notes" 
                      @blur="editingItem = null" 
                      @keyup.enter="editingItem = null"
                      ref="itemNotesInput"
                      class="item-edit-input notes-input"
                    >
                  </span>
                  <span v-else @dblclick="startEditingItem(categoryIndex, itemIndex, 'variable', 'notes')">
                    {{ item.notes || 'Add notes...' }}
                  </span>
                </div>
                <div class="item-actions">
                  <button @click="removeItem(categoryIndex, itemIndex, 'variable')" class="delete-button">X</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Allocation Tab -->
      <div v-if="activeTab === 'allocation'" class="tab-content">
        <div class="allocation-methods">
          <div class="allocation-method">
            <input 
              type="radio" 
              id="equal" 
              value="equal" 
              v-model="facilitiesData.facilityCostAllocation.method"
              @change="updateCosts"
            >
            <label for="equal">Equal Distribution</label>
          </div>
          <div class="allocation-method">
            <input 
              type="radio" 
              id="weighted" 
              value="weighted" 
              v-model="facilitiesData.facilityCostAllocation.method"
              @change="updateCosts"
            >
            <label for="weighted">Weighted by Department</label>
          </div>
          <div class="allocation-method">
            <input 
              type="radio" 
              id="space" 
              value="space" 
              v-model="facilitiesData.facilityCostAllocation.method"
              @change="updateCosts"
            >
            <label for="space">Space-Based Allocation</label>
          </div>
          <div class="allocation-method">
            <input 
              type="radio" 
              id="custom" 
              value="custom" 
              v-model="facilitiesData.facilityCostAllocation.method"
              @change="updateCosts"
            >
            <label for="custom">Custom Weights</label>
          </div>
        </div>
        
        <div v-if="facilitiesData.facilityCostAllocation.method === 'custom'" class="custom-weights">
          <h3>Custom Department Weights</h3>
          <div v-for="(weight, index) in facilitiesData.facilityCostAllocation.customWeights" :key="'weight-' + index" class="weight-item">
            <div class="weight-department">{{ weight.departmentName }}</div>
            <div class="weight-value">
              <input 
                type="number" 
                v-model.number="weight.weight" 
                min="0.1" 
                step="0.1"
                @change="updateCosts"
                class="weight-input"
              >
            </div>
          </div>
        </div>
        
        <div class="allocation-preview">
          <h3>Monthly Allocation Preview</h3>
          <div class="allocation-table">
            <div class="allocation-header">
              <div class="allocation-cell">Department</div>
              <div class="allocation-cell">Weight</div>
              <div class="allocation-cell">Monthly Allocation</div>
            </div>
            <div v-for="(dept, index) in departments" :key="'allocation-' + index" class="allocation-row">
              <div class="allocation-cell">{{ dept.name }}</div>
              <div class="allocation-cell">{{ getAllocationWeight(dept) }}</div>
              <div class="allocation-cell">${{ formatCurrency(getAllocationAmount(dept)) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { calculateTotalFixedFacilityCosts, calculateTotalVariableFacilityCostsPerPerson } from '../facilities-data.js';

export default {
  props: {
    facilitiesData: {
      type: Object,
      required: true
    },
    departments: {
      type: Array,
      required: true
    },
    editorPosition: {
      type: String,
      default: 'position-right'
    },
    editorStyle: {
      type: Object,
      default: () => ({ top: '150px', right: '20px' })
    },
    peakCrewSize: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'fixed',
      editingCategory: null,
      editingItem: null,
      selectedFixedCategory: null,
      selectedVariableCategory: null,
      totalFixedCosts: 0,
      totalVariableCostsPerPerson: 0
    };
  },
  mounted() {
    this.updateCosts();
    this.initializeCustomWeights();
  },
  methods: {
    closeFacilitiesEditor() {
      this.$emit('close');
    },
    resetEditorPosition() {
      this.$emit('reset-position');
    },
    startDrag(event) {
      // Only start drag if clicking on the header
      if (event.target.closest('.editor-header') && !event.target.closest('.editor-controls')) {
        this.$emit('start-drag', event);
      }
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    toggleCategory(categoryIndex, type) {
      if (type === 'fixed') {
        this.selectedFixedCategory = this.selectedFixedCategory === categoryIndex ? null : categoryIndex;
      } else {
        this.selectedVariableCategory = this.selectedVariableCategory === categoryIndex ? null : categoryIndex;
      }
    },
    startEditingCategory(categoryIndex, type) {
      this.editingCategory = type + '-' + categoryIndex;
      this.$nextTick(() => {
        if (this.$refs.categoryInput) {
          this.$refs.categoryInput.focus();
        }
      });
    },
    startEditingItem(categoryIndex, itemIndex, type, field) {
      this.editingItem = type + '-' + categoryIndex + '-' + itemIndex + '-' + field;
      this.$nextTick(() => {
        const refName = 'item' + field.charAt(0).toUpperCase() + field.slice(1) + 'Input';
        if (this.$refs[refName]) {
          this.$refs[refName].focus();
        }
      });
    },
    addFixedCategory() {
      this.facilitiesData.fixedFacilityCosts.push({
        category: "New Category",
        items: []
      });
      this.selectedFixedCategory = this.facilitiesData.fixedFacilityCosts.length - 1;
      this.updateCosts();
    },
    addVariableCategory() {
      this.facilitiesData.variableFacilityCosts.push({
        category: "New Category",
        items: []
      });
      this.selectedVariableCategory = this.facilitiesData.variableFacilityCosts.length - 1;
      this.updateCosts();
    },
    addFixedItem() {
      if (this.selectedFixedCategory !== null) {
        this.facilitiesData.fixedFacilityCosts[this.selectedFixedCategory].items.push({
          name: "New Item",
          cost: 0,
          notes: ""
        });
        this.updateCosts();
      }
    },
    addVariableItem() {
      if (this.selectedVariableCategory !== null) {
        this.facilitiesData.variableFacilityCosts[this.selectedVariableCategory].items.push({
          name: "New Item",
          cost: 0,
          notes: ""
        });
        this.updateCosts();
      }
    },
    removeCategory(categoryIndex, type) {
      if (confirm("Are you sure you want to remove this category and all its items?")) {
        if (type === 'fixed') {
          this.facilitiesData.fixedFacilityCosts.splice(categoryIndex, 1);
          if (this.selectedFixedCategory === categoryIndex) {
            this.selectedFixedCategory = null;
          } else if (this.selectedFixedCategory > categoryIndex) {
            this.selectedFixedCategory--;
          }
        } else {
          this.facilitiesData.variableFacilityCosts.splice(categoryIndex, 1);
          if (this.selectedVariableCategory === categoryIndex) {
            this.selectedVariableCategory = null;
          } else if (this.selectedVariableCategory > categoryIndex) {
            this.selectedVariableCategory--;
          }
        }
        this.updateCosts();
      }
    },
    removeItem(categoryIndex, itemIndex, type) {
      if (confirm("Are you sure you want to remove this item?")) {
        if (type === 'fixed') {
          this.facilitiesData.fixedFacilityCosts[categoryIndex].items.splice(itemIndex, 1);
        } else {
          this.facilitiesData.variableFacilityCosts[categoryIndex].items.splice(itemIndex, 1);
        }
        this.updateCosts();
      }
    },
    updateCosts() {
      this.totalFixedCosts = calculateTotalFixedFacilityCosts(this.facilitiesData);
      this.totalVariableCostsPerPerson = calculateTotalVariableFacilityCostsPerPerson(this.facilitiesData);
      this.$emit('update-costs');
    },
    initializeCustomWeights() {
      // Initialize custom weights if they don't exist
      if (!this.facilitiesData.facilityCostAllocation.customWeights || 
          this.facilitiesData.facilityCostAllocation.customWeights.length === 0) {
        this.facilitiesData.facilityCostAllocation.customWeights = this.departments.map(dept => ({
          departmentId: dept.name.toLowerCase().replace(/\s+/g, '-'),
          departmentName: dept.name,
          weight: 1.0
        }));
      } else {
        // Update custom weights if departments have changed
        const existingDeptIds = this.facilitiesData.facilityCostAllocation.customWeights.map(w => w.departmentId);
        
        // Add weights for new departments
        this.departments.forEach(dept => {
          const deptId = dept.name.toLowerCase().replace(/\s+/g, '-');
          if (!existingDeptIds.includes(deptId)) {
            this.facilitiesData.facilityCostAllocation.customWeights.push({
              departmentId: deptId,
              departmentName: dept.name,
              weight: 1.0
            });
          }
        });
        
        // Remove weights for departments that no longer exist
        const currentDeptIds = this.departments.map(dept => dept.name.toLowerCase().replace(/\s+/g, '-'));
        this.facilitiesData.facilityCostAllocation.customWeights = 
          this.facilitiesData.facilityCostAllocation.customWeights.filter(w => currentDeptIds.includes(w.departmentId));
      }
    },
    getAllocationWeight(department) {
      const method = this.facilitiesData.facilityCostAllocation.method;
      
      if (method === 'equal') {
        return '1.0';
      } else if (method === 'custom') {
        const deptId = department.name.toLowerCase().replace(/\s+/g, '-');
        const weight = this.facilitiesData.facilityCostAllocation.customWeights.find(w => w.departmentId === deptId);
        return weight ? weight.weight.toFixed(1) : '1.0';
      } else if (method === 'weighted') {
        // Simple weighting based on crew size
        return (department.maxCrew / 10 + 0.5).toFixed(1);
      } else if (method === 'space') {
        // Space-based weighting (simplified)
        return (department.maxCrew / 5 + 0.8).toFixed(1);
      }
      
      return '1.0';
    },
    getAllocationAmount(department) {
      const method = this.facilitiesData.facilityCostAllocation.method;
      const totalFixedCosts = this.totalFixedCosts;
      
      if (method === 'equal') {
        // Equal distribution
        return Math.round(totalFixedCosts / this.departments.length);
      } else if (method === 'custom') {
        // Custom weights
        const deptId = department.name.toLowerCase().replace(/\s+/g, '-');
        const weight = this.facilitiesData.facilityCostAllocation.customWeights.find(w => w.departmentId === deptId);
        const weightValue = weight ? weight.weight : 1.0;
        
        // Calculate total weights
        const totalWeights = this.facilitiesData.facilityCostAllocation.customWeights.reduce((sum, w) => sum + w.weight, 0);
        
        return Math.round(totalFixedCosts * (weightValue / totalWeights));
      } else if (method === 'weighted' || method === 'space') {
        // Weighted or space-based allocation (simplified for preview)
        const weight = parseFloat(this.getAllocationWeight(department));
        
        // Calculate total weights for all departments
        let totalWeights = 0;
        this.departments.forEach(dept => {
          totalWeights += parseFloat(this.getAllocationWeight(dept));
        });
        
        return Math.round(totalFixedCosts * (weight / totalWeights));
      }
      
      return 0;
    }
  }
};
</script>

<style scoped>
.facilities-editor {
  position: absolute;
  width: 600px;
  max-height: 80vh;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.position-left {
  left: 20px;
}

.position-right {
  right: 20px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  cursor: move;
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
}

.editor-controls {
  display: flex;
  gap: 5px;
}

.editor-controls button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  border-radius: 4px;
}

.editor-controls button:hover {
  background-color: #e0e0e0;
}

.close-button {
  color: #ff5252;
}

.reset-button {
  color: #2196f3;
}

.editor-content {
  padding: 15px;
  padding-bottom: 100px; /* Add extra padding at the bottom for scrolling */
  overflow-y: auto;
  flex-grow: 1;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
}

.tabs button {
  padding: 10px 15px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 2px solid transparent;
}

.tabs button.active {
  border-bottom: 2px solid #2196f3;
  font-weight: bold;
}

.tab-content {
  margin-top: 15px;
}

.tab-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.action-button {
  padding: 8px 12px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.action-button:disabled {
  background-color: #b0bec5;
  cursor: not-allowed;
}

.cost-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 15px;
}

.summary-label {
  font-weight: bold;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #2196f3;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.category {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  cursor: pointer;
}

.category-name {
  font-weight: bold;
}

.category-edit-input {
  width: 200px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.category-items {
  padding: 10px;
}

.cost-item {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 40px;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.cost-item:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
}

.item-cost {
  text-align: right;
  font-weight: bold;
}

.item-notes {
  color: #757575;
  font-size: 0.9em;
}

.item-edit-input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.cost-input {
  text-align: right;
}

.notes-input {
  font-size: 0.9em;
}

.delete-button {
  background: none;
  border: none;
  color: #ff5252;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 5px;
  border-radius: 4px;
}

.delete-button:hover {
  background-color: #ffebee;
}

.allocation-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.allocation-method {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-weights {
  margin-bottom: 20px;
}

.custom-weights h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.weight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.weight-department {
  font-weight: 500;
}

.weight-input {
  width: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
}

.allocation-preview h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.allocation-table {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.allocation-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  background-color: #f5f5f5;
  font-weight: bold;
  padding: 10px;
}

.allocation-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #eee;
}

.allocation-cell {
  display: flex;
  align-items: center;
}
</style>