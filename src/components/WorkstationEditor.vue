<template>
  <div>
    <v-card color="success" class="draggable-card">
      <v-card-title class="d-flex justify-space-between align-center text-white">
        <span>Hardware Editor</span>
        <div>
          <v-btn icon="mdi-refresh" @click="resetEditorPosition" variant="text" color="white" density="compact"></v-btn>
          <v-btn icon="mdi-close" @click="closeWorkstationEditor" variant="text" color="white" density="compact"></v-btn>
        </div>
      </v-card-title>
      <v-card-text class="bg-white">
        <div class="editor-content">
          <div class="tabs">
            <button 
              :class="{ active: activeTab === 'bundles' }" 
              @click="activeTab = 'bundles'"
            >
              Hardware Bundles
            </button>
            <button 
              :class="{ active: activeTab === 'assignments' }" 
              @click="activeTab = 'assignments'"
            >
              Department Assignments
            </button>
            <button 
              :class="{ active: activeTab === 'backend' }" 
              @click="activeTab = 'backend'"
            >
              Backend Infrastructure
            </button>
          </div>
          
          <div v-if="activeTab === 'bundles'" class="tab-content">
            <div class="bundle-list">
              <div 
                v-for="(bundle, index) in workstationData.workstationBundles" 
                :key="index"
                class="bundle-item"
              >
                <div class="bundle-header">
                  <div class="bundle-name">
                    <input 
                      type="text" 
                      v-model="bundle.name" 
                      @input="updateWorkstationData"
                      class="bundle-name-input"
                    >
                  </div>
                  <div class="bundle-cost">${{ formatCurrency(bundle.cost) }}</div>
                  <button @click="removeBundle(index)" class="remove-button">×</button>
                </div>
                <div class="bundle-components">
                  <div 
                    v-for="(component, compIndex) in bundle.components" 
                    :key="compIndex"
                    class="component-item"
                  >
                    <input 
                      type="text" 
                      v-model="component.name" 
                      @input="updateWorkstationData"
                      class="component-name-input"
                      placeholder="Component name"
                    >
                    <select 
                      v-model="component.type" 
                      @change="updateWorkstationData"
                      class="component-type-select"
                    >
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="peripheral">Peripheral</option>
                      <option value="other">Other</option>
                    </select>
                    <input 
                      type="number" 
                      v-model.number="component.cost" 
                      @input="updateWorkstationData"
                      class="component-cost-input"
                      min="0"
                      step="10"
                    >
                    <input 
                      type="number" 
                      v-model.number="component.quantity" 
                      @input="updateWorkstationData"
                      class="component-quantity-input"
                      min="1"
                      step="1"
                    >
                    <div class="component-total">${{ formatCurrency(component.cost * component.quantity) }}</div>
                    <button @click="removeComponent(index, compIndex)" class="remove-button">×</button>
                  </div>
                  <button @click="addComponent(index)" class="add-component-button">+ Add Component</button>
                </div>
              </div>
              <button @click="addBundle" class="add-bundle-button">+ Add Hardware Bundle</button>
            </div>
          </div>
          
          <div v-if="activeTab === 'assignments'" class="tab-content">
            <div class="assignment-list">
              <div class="assignment-header">
                <div class="assignment-department">Department</div>
                <div class="assignment-bundle">Hardware Bundle</div>
                <div class="assignment-quantity">Quantity</div>
                <div class="assignment-total">Total Cost</div>
                <div class="assignment-actions"></div>
              </div>
              <div 
                v-for="(assignment, index) in workstationData.departmentAssignments" 
                :key="index"
                class="assignment-item"
              >
                <select 
                  @change="updateDepartmentAssignment(index, $event.target.value)"
                  class="assignment-department-select"
                  :value="getDepartmentIndexById(assignment.departmentId)"
                >
                  <option 
                    v-for="(dept, deptIndex) in departments" 
                    :key="deptIndex" 
                    :value="deptIndex"
                  >
                    {{ dept.name }}
                  </option>
                </select>
                <select 
                  @change="updateBundleAssignment(index, $event.target.value)"
                  class="assignment-bundle-select"
                  :value="getBundleIndexById(assignment.workstationId)"
                >
                  <option 
                    v-for="(bundle, bundleIndex) in workstationData.workstationBundles" 
                    :key="bundleIndex" 
                    :value="bundleIndex"
                  >
                    {{ bundle.name }}
                  </option>
                </select>
                <input 
                  type="number" 
                  v-model.number="assignment.quantity" 
                  @input="updateWorkstationData"
                  class="assignment-quantity-input"
                  min="1"
                  step="1"
                >
                <div class="assignment-total">${{ formatCurrency(getAssignmentCost(assignment)) }}</div>
                <button @click="removeAssignment(index)" class="remove-button">×</button>
              </div>
              <button @click="addAssignment" class="add-assignment-button">+ Add Assignment</button>
            </div>
          </div>
          
          <div v-if="activeTab === 'backend'" class="tab-content">
            <div class="backend-list">
              <div 
                v-for="(category, catIndex) in workstationData.backendInfrastructure" 
                :key="'cat-' + catIndex"
                class="backend-category"
              >
                <div class="category-header">
                  <input 
                    type="text" 
                    v-model="category.category" 
                    @input="updateWorkstationData"
                    class="category-name-input"
                    placeholder="Category name"
                  >
                  <button @click="removeBackendCategory(catIndex)" class="remove-button">×</button>
                </div>
                <div class="backend-items">
                  <div class="backend-header">
                    <div class="backend-name">Item</div>
                    <div class="backend-cost">Cost</div>
                    <div class="backend-quantity">Qty</div>
                    <div class="backend-type">Type</div>
                    <div class="backend-month">Month</div>
                    <div class="backend-actions"></div>
                  </div>
                  <div 
                    v-for="(item, itemIndex) in category.items" 
                    :key="'item-' + catIndex + '-' + itemIndex"
                    class="backend-item"
                  >
                    <input 
                      type="text" 
                      v-model="item.name" 
                      @input="updateWorkstationData"
                      class="backend-name-input"
                      placeholder="Item name"
                    >
                    <div class="cost-amount-wrapper">
                      <span class="currency-symbol">$</span>
                      <input 
                        type="number" 
                        v-model.number="item.cost" 
                        @input="updateWorkstationData"
                        class="backend-cost-input"
                        min="0"
                        step="100"
                      >
                    </div>
                    <input 
                      type="number" 
                      v-model.number="item.quantity" 
                      @input="updateWorkstationData"
                      class="backend-quantity-input"
                      min="1"
                      step="1"
                    >
                    <select 
                      v-model="item.costType" 
                      @change="updateWorkstationData"
                      class="backend-type-select"
                    >
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <div v-if="item.costType === 'one-time'" class="payment-schedule-container">
                      <select 
                        v-model="item.paymentSchedule" 
                        @change="updateWorkstationData"
                        class="payment-schedule-select"
                      >
                        <option value="single">Single Payment</option>
                        <option value="staged">Staged Payments</option>
                      </select>
                      
                      <div v-if="item.paymentSchedule === 'single'">
                        <input 
                          type="number" 
                          v-model.number="item.purchaseMonth" 
                          @input="updateWorkstationData"
                          class="backend-month-input"
                          min="0"
                          :max="months.length - 1"
                          step="1"
                        >
                      </div>
                      
                      <div v-else class="staged-payments-container">
                        <button @click="showPaymentStagesModal(catIndex, itemIndex)" class="edit-stages-button">
                          Edit Payment Stages
                        </button>
                        <div class="payment-stages-summary" v-if="item.paymentStages && item.paymentStages.length > 0">
                          {{ getPaymentStagesSummary(item.paymentStages) }}
                        </div>
                      </div>
                    </div>
                    <div v-else class="backend-month-input disabled">-</div>
                    <button @click="removeBackendItem(catIndex, itemIndex)" class="remove-button">×</button>
                  </div>
                  <button @click="addBackendItem(catIndex)" class="add-item-button">+ Add Item</button>
                </div>
              </div>
              <button @click="addBackendCategory" class="add-category-button">+ Add Category</button>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Payment Stages Modal -->
    <div v-if="showPaymentStagesEditor" class="payment-stages-modal">
      <div class="payment-stages-modal-content">
        <div class="payment-stages-modal-header">
          <h3>Edit Payment Stages</h3>
          <button @click="closePaymentStagesModal" class="close-button">×</button>
        </div>
        <div class="payment-stages-modal-body">
          <div class="payment-stages-info">
            <p>Define payment stages for: <strong>{{ currentItem ? currentItem.name : '' }}</strong></p>
            <p>Total Cost: <strong>${{ formatCurrency((currentItem ? currentItem.cost * currentItem.quantity : 0)) }}</strong></p>
            <p class="payment-stages-validation" :class="{ 'valid': isPaymentStagesValid, 'invalid': !isPaymentStagesValid }">
              {{ isPaymentStagesValid ? 'Payment stages are valid (100%)' : 'Payment stages must add up to 100%' }}
            </p>
          </div>
          
          <div class="payment-stages-list">
            <div class="payment-stage-header">
              <div class="payment-stage-month">Month</div>
              <div class="payment-stage-percentage">Percentage</div>
              <div class="payment-stage-amount">Amount</div>
              <div class="payment-stage-actions"></div>
            </div>
            
            <div 
              v-for="(stage, stageIndex) in tempPaymentStages" 
              :key="stageIndex"
              class="payment-stage-item"
            >
              <input 
                type="number" 
                v-model.number="stage.month" 
                class="payment-stage-month-input"
                min="0"
                :max="months.length - 1"
                step="1"
              >
              <div class="percentage-input-wrapper">
                <input 
                  type="number" 
                  v-model.number="stage.percentage" 
                  class="payment-stage-percentage-input"
                  min="0"
                  max="100"
                  step="5"
                >
                <span class="percentage-symbol">%</span>
              </div>
              <div class="payment-stage-amount">
                ${{ formatCurrency((currentItem ? currentItem.cost * currentItem.quantity : 0) * (stage.percentage / 100)) }}
              </div>
              <button @click="removePaymentStage(stageIndex)" class="remove-button">×</button>
            </div>
            
            <button @click="addPaymentStage" class="add-payment-stage-button">+ Add Payment Stage</button>
          </div>
        </div>
        <div class="payment-stages-modal-footer">
          <button @click="closePaymentStagesModal" class="cancel-button">Cancel</button>
          <button @click="savePaymentStages" class="save-button" :disabled="!isPaymentStagesValid">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  calculateWorkstationBundleCost, 
  calculateTotalWorkstationCosts,
  validatePaymentStages
} from '../workstation-data.js';

export default {
  name: 'WorkstationEditor',
  props: {
    workstationData: {
      type: Object,
      required: true
    },
    departments: {
      type: Array,
      required: true
    },
    months: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'bundles', // Default tab is 'bundles', other options are 'assignments' and 'backend'
      showPaymentStagesEditor: false,
      currentCategoryIndex: null,
      currentItemIndex: null,
      currentItem: null,
      tempPaymentStages: [],
      isPaymentStagesValid: false
    };
  },
  
  watch: {
    tempPaymentStages: {
      handler() {
        this.validateTempPaymentStages();
      },
      deep: true
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    },
    
    updateWorkstationData() {
      // Recalculate costs
      this.workstationData.workstationBundles.forEach(bundle => {
        bundle.cost = calculateWorkstationBundleCost(bundle);
      });
      
      this.$emit('update-costs');
    },
    
    addBundle() {
      this.workstationData.workstationBundles.push({
        id: "NEW" + Date.now().toString().slice(-4),
        name: 'New Hardware Bundle',
        cost: 0,
        components: []
      });
      this.updateWorkstationData();
    },
    
    removeBundle(index) {
      // Check if this bundle is used in any assignments
      const bundleId = this.workstationData.workstationBundles[index].id;
      const isUsed = this.workstationData.departmentAssignments.some(
        assignment => assignment.workstationId === bundleId
      );
      
      if (isUsed) {
        alert('Cannot remove this bundle as it is assigned to one or more departments.');
        return;
      }
      
      this.workstationData.workstationBundles.splice(index, 1);
      
      // Update any assignments that reference bundles with higher indices
      this.workstationData.departmentAssignments.forEach(assignment => {
        const bundleIndex = this.workstationData.workstationBundles.findIndex(b => b.id === assignment.workstationId);
        if (bundleIndex === -1) {
          // If the bundle was removed, assign to the first available bundle
          assignment.workstationId = this.workstationData.workstationBundles[0]?.id || '';
        }
      });
      
      this.updateWorkstationData();
    },
    
    addComponent(bundleIndex) {
      this.workstationData.workstationBundles[bundleIndex].components.push({
        name: '',
        type: 'hardware',
        cost: 0,
        quantity: 1
      });
      this.updateWorkstationData();
    },
    
    removeComponent(bundleIndex, componentIndex) {
      this.workstationData.workstationBundles[bundleIndex].components.splice(componentIndex, 1);
      this.updateWorkstationData();
    },
    
    addAssignment() {
      if (this.workstationData.workstationBundles.length === 0) {
        alert('Please create at least one hardware bundle first.');
        this.activeTab = 'bundles';
        return;
      }
      
      if (this.departments.length === 0) {
        alert('Please create at least one department first.');
        return;
      }
      
      const newAssignment = {
        departmentId: this.departments[0].name.toLowerCase().replace(/\s+/g, '-'),
        departmentName: this.departments[0].name,
        workstationId: this.workstationData.workstationBundles[0].id,
        quantity: 1,
        purchaseMonth: 0,
        notes: 'New assignment'
      };
      
      this.workstationData.departmentAssignments.push(newAssignment);
      this.updateWorkstationData();
    },
    
    removeAssignment(index) {
      this.workstationData.departmentAssignments.splice(index, 1);
      this.updateWorkstationData();
    },
    
    getAssignmentCost(assignment) {
      const bundleIndex = this.workstationData.workstationBundles.findIndex(b => b.id === assignment.workstationId);
      const bundle = this.workstationData.workstationBundles[bundleIndex];
      if (!bundle) return 0;
      return bundle.cost * assignment.quantity;
    },
    
    // startDrag method removed as it's now handled by the parent component
    
    resetEditorPosition() {
      this.$emit('reset-position');
    },
    
    closeWorkstationEditor() {
      this.$emit('close');
    },
    
    addBackendCategory() {
      this.workstationData.backendInfrastructure.push({
        category: 'New Category',
        items: []
      });
      this.updateWorkstationData();
    },
    
    removeBackendCategory(catIndex) {
      if (this.workstationData.backendInfrastructure[catIndex].items.length > 0) {
        if (!confirm('This will remove all items in this category. Continue?')) {
          return;
        }
      }
      this.workstationData.backendInfrastructure.splice(catIndex, 1);
      this.updateWorkstationData();
    },
    
    addBackendItem(catIndex) {
      this.workstationData.backendInfrastructure[catIndex].items.push({
        name: '',
        cost: 0,
        quantity: 1,
        costType: 'one-time',
        purchaseMonth: 0,
        paymentSchedule: 'single',
        paymentStages: []
      });
      this.updateWorkstationData();
    },
    
    showPaymentStagesModal(catIndex, itemIndex) {
      this.currentCategoryIndex = catIndex;
      this.currentItemIndex = itemIndex;
      this.currentItem = this.workstationData.backendInfrastructure[catIndex].items[itemIndex];
      
      // Create a deep copy of payment stages for editing
      this.tempPaymentStages = this.currentItem.paymentStages ? 
        JSON.parse(JSON.stringify(this.currentItem.paymentStages)) : [];
      
      // If no payment stages exist yet, create a default one
      if (this.tempPaymentStages.length === 0) {
        this.tempPaymentStages.push({
          month: this.currentItem.purchaseMonth || 0,
          percentage: 100
        });
      }
      
      this.validateTempPaymentStages();
      this.showPaymentStagesEditor = true;
    },
    
    closePaymentStagesModal() {
      this.showPaymentStagesEditor = false;
      this.currentCategoryIndex = null;
      this.currentItemIndex = null;
      this.currentItem = null;
      this.tempPaymentStages = [];
    },
    
    addPaymentStage() {
      // Find the next available month
      let nextMonth = 0;
      if (this.tempPaymentStages.length > 0) {
        const usedMonths = this.tempPaymentStages.map(stage => stage.month);
        while (usedMonths.includes(nextMonth)) {
          nextMonth++;
        }
      }
      
      this.tempPaymentStages.push({
        month: nextMonth,
        percentage: 0
      });
      
      this.validateTempPaymentStages();
    },
    
    removePaymentStage(index) {
      this.tempPaymentStages.splice(index, 1);
      this.validateTempPaymentStages();
    },
    
    validateTempPaymentStages() {
      this.isPaymentStagesValid = validatePaymentStages(this.tempPaymentStages);
    },
    
    savePaymentStages() {
      if (!this.isPaymentStagesValid) {
        alert('Payment stages must add up to 100%');
        return;
      }
      
      // Sort stages by month
      this.tempPaymentStages.sort((a, b) => a.month - b.month);
      
      // Save the payment stages to the item
      if (this.currentItem) {
        this.currentItem.paymentStages = JSON.parse(JSON.stringify(this.tempPaymentStages));
        
        // If there's only one stage at 100%, we could simplify to a single payment
        if (this.tempPaymentStages.length === 1 && this.tempPaymentStages[0].percentage === 100) {
          this.currentItem.purchaseMonth = this.tempPaymentStages[0].month;
          // Keep the staged payment option selected, but user could switch to single if desired
        }
        
        this.updateWorkstationData();
      }
      
      this.closePaymentStagesModal();
    },
    
    getPaymentStagesSummary(stages) {
      if (!stages || stages.length === 0) return 'No stages defined';
      
      // Sort stages by month
      const sortedStages = [...stages].sort((a, b) => a.month - b.month);
      
      // Create a summary string
      return sortedStages.map(stage => 
        `Month ${stage.month}: ${stage.percentage}%`
      ).join(', ');
    },
    
    removeBackendItem(catIndex, itemIndex) {
      this.workstationData.backendInfrastructure[catIndex].items.splice(itemIndex, 1);
      this.updateWorkstationData();
    },
    
    getDepartmentIndexById(departmentId) {
      return this.departments.findIndex(d => 
        d.name.toLowerCase().replace(/\s+/g, '-') === departmentId
      );
    },
    
    getBundleIndexById(workstationId) {
      return this.workstationData.workstationBundles.findIndex(b => b.id === workstationId);
    },
    
    updateDepartmentAssignment(assignmentIndex, departmentIndex) {
      const dept = this.departments[departmentIndex];
      if (dept) {
        this.workstationData.departmentAssignments[assignmentIndex].departmentId = 
          dept.name.toLowerCase().replace(/\s+/g, '-');
        this.workstationData.departmentAssignments[assignmentIndex].departmentName = dept.name;
        this.updateWorkstationData();
      }
    },
    
    updateBundleAssignment(assignmentIndex, bundleIndex) {
      const bundle = this.workstationData.workstationBundles[bundleIndex];
      if (bundle) {
        this.workstationData.departmentAssignments[assignmentIndex].workstationId = bundle.id;
        this.updateWorkstationData();
      }
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
  background-color: var(--success-color) !important;
}

.workstation-editor {
  position: absolute;
  width: 800px;
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
  background-color: #4CAF50;
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
  color: #4CAF50;
  border-bottom-color: #4CAF50;
}

.tab-content {
  margin-top: 16px;
}

.bundle-list, .assignment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bundle-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.bundle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.bundle-name {
  flex: 1;
  font-weight: 500;
}

.bundle-name-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-weight: 500;
}

.bundle-cost {
  font-weight: 500;
  color: #4CAF50;
  margin-right: 16px;
}

.bundle-components {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.component-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 40px;
  gap: 8px;
  align-items: center;
}

.component-name-input, .component-type-select, .component-cost-input, .component-quantity-input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.component-total {
  font-weight: 500;
  color: #4CAF50;
  text-align: right;
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

.add-component-button, .add-bundle-button, .add-assignment-button {
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

.add-component-button:hover, .add-bundle-button:hover, .add-assignment-button:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #475569;
}

.assignment-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 0.5fr;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f8fafc;
  border-radius: 6px;
  font-weight: 500;
  color: #64748b;
}

.assignment-item {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 0.5fr;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  align-items: center;
}

.assignment-department-select, .assignment-bundle-select, .assignment-quantity-input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.assignment-total {
  font-weight: 500;
  color: #4CAF50;
}

/* Backend infrastructure styles */
.backend-category {
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

.backend-items {
  padding: 12px;
}

.backend-header {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 1fr 0.5fr 0.5fr;
  gap: 8px;
  padding: 8px 0;
  font-weight: 500;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 8px;
}

.backend-item {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 1fr 0.5fr 0.5fr;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: #f8fafc;
  align-items: center;
}

.backend-name-input, .backend-cost-input, .backend-quantity-input, .backend-type-select, .backend-month-input {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  width: 100%;
}

.backend-month-input.disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.add-item-button {
  width: 100%;
  padding: 6px;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  background-color: #f8fafc;
  color: #64748b;
  cursor: pointer;
  text-align: center;
  font-size: 0.9rem;
  margin-top: 8px;
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

@media (max-width: 768px) {
  .workstation-editor {
    width: 90vw;
  }
  
  .component-item {
    grid-template-columns: 1fr 1fr;
    row-gap: 8px;
  }
  
  .assignment-header, .assignment-item {
    grid-template-columns: 1fr 1fr;
    row-gap: 8px;
  }
  
  .payment-stages-modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .payment-stage-item {
    grid-template-columns: 1fr 1fr 1fr 30px;
  }
}

/* Payment Schedule Styles */
.payment-schedule-container {
  display: flex;
  flex-direction: column;
}

.payment-schedule-select {
  width: 100%;
  padding: 4px;
  margin-bottom: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.staged-payments-container {
  display: flex;
  flex-direction: column;
}

.edit-stages-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 5px;
}

.payment-stages-summary {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* Payment Stages Modal Styles */
.payment-stages-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.payment-stages-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.payment-stages-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.payment-stages-modal-header h3 {
  margin: 0;
  color: #4CAF50;
}

.payment-stages-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.payment-stages-info {
  margin-bottom: 20px;
}

.payment-stages-validation {
  font-weight: bold;
  margin-top: 10px;
}

.payment-stages-validation.valid {
  color: #4CAF50;
}

.payment-stages-validation.invalid {
  color: #F44336;
}

.payment-stages-list {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.payment-stage-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 40px;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-weight: bold;
}

.payment-stage-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 40px;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.payment-stage-month-input,
.payment-stage-percentage-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.percentage-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.percentage-symbol {
  position: absolute;
  right: 10px;
  color: #666;
}

.payment-stage-amount {
  font-weight: bold;
}

.add-payment-stage-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
}

.payment-stages-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid #eee;
  gap: 10px;
}

.cancel-button {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.save-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.save-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>