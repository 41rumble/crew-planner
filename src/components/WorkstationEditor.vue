<template>
  <div class="floating-editor workstation-editor" :class="editorPosition" :style="editorStyle" ref="workstationEditor" @mousedown="startDrag($event)">
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
      
      <!-- Workstation Bundles Tab -->
      <div v-if="activeTab === 'bundles'" class="tab-content">
        <div class="tab-actions">
          <button @click="addWorkstationBundle" class="action-button">Add Workstation Bundle</button>
        </div>
        
        <div class="bundles-list">
          <div v-for="(bundle, bundleIndex) in workstationData.workstationBundles" :key="'bundle-' + bundleIndex" class="bundle">
            <div class="bundle-header" @click="toggleBundle(bundleIndex)">
              <div class="bundle-name">
                <span v-if="editingBundle === 'name-' + bundleIndex">
                  <input 
                    v-model="bundle.name" 
                    @blur="editingBundle = null" 
                    @keyup.enter="editingBundle = null"
                    ref="bundleNameInput"
                    class="bundle-edit-input"
                  >
                </span>
                <span v-else @dblclick="startEditingBundle(bundleIndex, 'name')">
                  {{ bundle.name }} ({{ bundle.id }})
                </span>
              </div>
              <div class="bundle-cost">${{ formatCurrency(bundle.cost) }}</div>
              <div class="bundle-actions">
                <button @click.stop="removeBundle(bundleIndex)" class="delete-button">X</button>
              </div>
            </div>
            
            <div class="bundle-details" v-if="selectedBundle === bundleIndex">
              <div class="bundle-id">
                <label>Bundle ID:</label>
                <span v-if="editingBundle === 'id-' + bundleIndex">
                  <input 
                    v-model="bundle.id" 
                    @blur="editingBundle = null" 
                    @keyup.enter="editingBundle = null"
                    ref="bundleIdInput"
                    class="bundle-edit-input"
                  >
                </span>
                <span v-else @dblclick="startEditingBundle(bundleIndex, 'id')">
                  {{ bundle.id }}
                </span>
              </div>
              
              <div class="bundle-description">
                <label>Description:</label>
                <span v-if="editingBundle === 'description-' + bundleIndex">
                  <input 
                    v-model="bundle.description" 
                    @blur="editingBundle = null" 
                    @keyup.enter="editingBundle = null"
                    ref="bundleDescriptionInput"
                    class="bundle-edit-input"
                  >
                </span>
                <span v-else @dblclick="startEditingBundle(bundleIndex, 'description')">
                  {{ bundle.description }}
                </span>
              </div>
              
              <div class="components-header">
                <h3>Components</h3>
                <button @click="addComponent(bundleIndex)" class="action-button small">Add Component</button>
              </div>
              
              <div class="components-list">
                <div class="component-header">
                  <div class="component-name">Name</div>
                  <div class="component-type">Type</div>
                  <div class="component-cost">Cost</div>
                  <div class="component-quantity">Qty</div>
                  <div class="component-total">Total</div>
                  <div class="component-actions"></div>
                </div>
                <div v-for="(component, componentIndex) in bundle.components" :key="'component-' + bundleIndex + '-' + componentIndex" class="component">
                  <div class="component-name">
                    <span v-if="editingComponent === 'name-' + bundleIndex + '-' + componentIndex">
                      <input 
                        v-model="component.name" 
                        @blur="editingComponent = null" 
                        @keyup.enter="editingComponent = null"
                        ref="componentNameInput"
                        class="component-edit-input"
                      >
                    </span>
                    <span v-else @dblclick="startEditingComponent(bundleIndex, componentIndex, 'name')">
                      {{ component.name }}
                    </span>
                  </div>
                  <div class="component-type">
                    <span v-if="editingComponent === 'type-' + bundleIndex + '-' + componentIndex">
                      <select 
                        v-model="component.type" 
                        @blur="editingComponent = null" 
                        @change="editingComponent = null"
                        ref="componentTypeInput"
                        class="component-edit-select"
                      >
                        <option value="hardware">Hardware</option>
                        <option value="software">Software</option>
                      </select>
                    </span>
                    <span v-else @dblclick="startEditingComponent(bundleIndex, componentIndex, 'type')">
                      {{ component.type }}
                    </span>
                  </div>
                  <div class="component-cost">
                    <span v-if="editingComponent === 'cost-' + bundleIndex + '-' + componentIndex">
                      <input 
                        v-model.number="component.cost" 
                        @blur="editingComponent = null; updateBundleCost(bundleIndex)" 
                        @keyup.enter="editingComponent = null; updateBundleCost(bundleIndex)"
                        ref="componentCostInput"
                        class="component-edit-input cost-input"
                        type="number"
                        min="0"
                      >
                    </span>
                    <span v-else @dblclick="startEditingComponent(bundleIndex, componentIndex, 'cost')">
                      ${{ formatCurrency(component.cost) }}
                    </span>
                  </div>
                  <div class="component-quantity">
                    <span v-if="editingComponent === 'quantity-' + bundleIndex + '-' + componentIndex">
                      <input 
                        v-model.number="component.quantity" 
                        @blur="editingComponent = null; updateBundleCost(bundleIndex)" 
                        @keyup.enter="editingComponent = null; updateBundleCost(bundleIndex)"
                        ref="componentQuantityInput"
                        class="component-edit-input quantity-input"
                        type="number"
                        min="1"
                      >
                    </span>
                    <span v-else @dblclick="startEditingComponent(bundleIndex, componentIndex, 'quantity')">
                      {{ component.quantity }}
                    </span>
                  </div>
                  <div class="component-total">
                    ${{ formatCurrency(component.cost * component.quantity) }}
                  </div>
                  <div class="component-actions">
                    <button @click="removeComponent(bundleIndex, componentIndex)" class="delete-button">X</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Department Assignments Tab -->
      <div v-if="activeTab === 'assignments'" class="tab-content">
        <div class="tab-actions">
          <button @click="initializeAssignments" class="action-button">Reset to Default Assignments</button>
        </div>
        
        <div class="assignments-list">
          <div class="assignment-header">
            <div class="assignment-department">Department</div>
            <div class="assignment-workstation">Workstation Type</div>
            <div class="assignment-quantity">Quantity</div>
            <div class="assignment-purchase-month">Purchase Month</div>
            <div class="assignment-cost">Total Cost</div>
            <div class="assignment-notes">Notes</div>
          </div>
          <div v-for="(assignment, assignmentIndex) in workstationData.departmentAssignments" :key="'assignment-' + assignmentIndex" class="assignment">
            <div class="assignment-department">
              {{ assignment.departmentName }}
            </div>
            <div class="assignment-workstation">
              <span v-if="editingAssignment === 'workstation-' + assignmentIndex">
                <select 
                  v-model="assignment.workstationId" 
                  @blur="editingAssignment = null; updateCosts()" 
                  @change="editingAssignment = null; updateCosts()"
                  ref="assignmentWorkstationInput"
                  class="assignment-edit-select"
                >
                  <option v-for="bundle in workstationData.workstationBundles" :key="bundle.id" :value="bundle.id">
                    {{ bundle.name }} ({{ bundle.id }})
                  </option>
                </select>
              </span>
              <span v-else @dblclick="startEditingAssignment(assignmentIndex, 'workstation')">
                {{ getWorkstationName(assignment.workstationId) }}
              </span>
            </div>
            <div class="assignment-quantity">
              <span v-if="editingAssignment === 'quantity-' + assignmentIndex">
                <input 
                  v-model.number="assignment.quantity" 
                  @blur="editingAssignment = null; updateCosts()" 
                  @keyup.enter="editingAssignment = null; updateCosts()"
                  ref="assignmentQuantityInput"
                  class="assignment-edit-input quantity-input"
                  type="number"
                  min="1"
                >
              </span>
              <span v-else @dblclick="startEditingAssignment(assignmentIndex, 'quantity')">
                {{ assignment.quantity }}
              </span>
            </div>
            <div class="assignment-purchase-month">
              <span v-if="editingAssignment === 'purchaseMonth-' + assignmentIndex">
                <input 
                  v-model.number="assignment.purchaseMonth" 
                  @blur="editingAssignment = null; updateCosts()" 
                  @keyup.enter="editingAssignment = null; updateCosts()"
                  ref="assignmentPurchaseMonthInput"
                  class="assignment-edit-input purchase-month-input"
                  type="number"
                  min="0"
                  :max="maxPurchaseMonth"
                >
              </span>
              <span v-else @dblclick="startEditingAssignment(assignmentIndex, 'purchaseMonth')">
                {{ assignment.purchaseMonth || 0 }}
              </span>
            </div>
            <div class="assignment-cost">
              ${{ formatCurrency(getAssignmentMonthlyCost(assignment)) }}
            </div>
            <div class="assignment-notes">
              <span v-if="editingAssignment === 'notes-' + assignmentIndex">
                <input 
                  v-model="assignment.notes" 
                  @blur="editingAssignment = null" 
                  @keyup.enter="editingAssignment = null"
                  ref="assignmentNotesInput"
                  class="assignment-edit-input notes-input"
                >
              </span>
              <span v-else @dblclick="startEditingAssignment(assignmentIndex, 'notes')">
                {{ assignment.notes || 'Add notes...' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Backend Infrastructure Tab -->
      <div v-if="activeTab === 'backend'" class="tab-content">
        <div class="tab-actions">
          <button @click="addBackendCategory" class="action-button">Add Category</button>
          <button @click="addBackendItem" class="action-button" :disabled="!selectedBackendCategory">Add Item</button>
        </div>
        
        <div class="cost-summary">
          <div class="summary-label">One-time Backend Infrastructure Cost:</div>
          <div class="summary-value">${{ formatCurrency(backendCosts.oneTime) }}</div>
        </div>
        <div class="cost-summary">
          <div class="summary-label">Monthly Backend Infrastructure Cost:</div>
          <div class="summary-value">${{ formatCurrency(backendCosts.monthly) }}</div>
        </div>
        
        <div class="categories-list">
          <div v-for="(category, categoryIndex) in workstationData.backendInfrastructure" :key="'backend-' + categoryIndex" class="category">
            <div class="category-header" @click="toggleBackendCategory(categoryIndex)">
              <div class="category-name">
                <span v-if="editingBackendCategory === categoryIndex">
                  <input 
                    v-model="category.category" 
                    @blur="editingBackendCategory = null" 
                    @keyup.enter="editingBackendCategory = null"
                    ref="backendCategoryInput"
                    class="category-edit-input"
                  >
                </span>
                <span v-else @dblclick="startEditingBackendCategory(categoryIndex)">
                  {{ category.category }}
                </span>
              </div>
              <div class="category-actions">
                <button @click.stop="removeBackendCategory(categoryIndex)" class="delete-button">X</button>
              </div>
            </div>
            
            <div class="category-items" v-if="selectedBackendCategory === categoryIndex">
              <div class="backend-item-header">
                <div class="item-name">Name</div>
                <div class="item-cost">Cost</div>
                <div class="item-quantity">Qty</div>
                <div class="item-total">Total</div>
                <div class="item-cost-type">Type</div>
                <div class="item-purchase-month">Month</div>
                <div class="item-notes">Notes</div>
                <div class="item-actions"></div>
              </div>
              <div v-for="(item, itemIndex) in category.items" :key="'backend-' + categoryIndex + '-' + itemIndex" class="backend-item">
                <div class="item-name">
                  <span v-if="editingBackendItem === 'name-' + categoryIndex + '-' + itemIndex">
                    <input 
                      v-model="item.name" 
                      @blur="editingBackendItem = null" 
                      @keyup.enter="editingBackendItem = null"
                      ref="backendItemNameInput"
                      class="item-edit-input"
                    >
                  </span>
                  <span v-else @dblclick="startEditingBackendItem(categoryIndex, itemIndex, 'name')">
                    {{ item.name }}
                  </span>
                </div>
                <div class="item-cost">
                  <span v-if="editingBackendItem === 'cost-' + categoryIndex + '-' + itemIndex">
                    <input 
                      v-model.number="item.cost" 
                      @blur="editingBackendItem = null; updateCosts()" 
                      @keyup.enter="editingBackendItem = null; updateCosts()"
                      ref="backendItemCostInput"
                      class="item-edit-input cost-input"
                      type="number"
                      min="0"
                    >
                  </span>
                  <span v-else @dblclick="startEditingBackendItem(categoryIndex, itemIndex, 'cost')">
                    ${{ formatCurrency(item.cost) }}
                  </span>
                </div>
                <div class="item-quantity">
                  <span v-if="editingBackendItem === 'quantity-' + categoryIndex + '-' + itemIndex">
                    <input 
                      v-model.number="item.quantity" 
                      @blur="editingBackendItem = null; updateCosts()" 
                      @keyup.enter="editingBackendItem = null; updateCosts()"
                      ref="backendItemQuantityInput"
                      class="item-edit-input quantity-input"
                      type="number"
                      min="1"
                    >
                  </span>
                  <span v-else @dblclick="startEditingBackendItem(categoryIndex, itemIndex, 'quantity')">
                    {{ item.quantity }}
                  </span>
                </div>
                <div class="item-total">
                  ${{ formatCurrency(item.cost * item.quantity) }}
                </div>
                <div class="item-cost-type">
                  <select v-model="item.costType" @change="updateCosts()">
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div class="item-purchase-month" v-if="item.costType === 'one-time'">
                  <span class="purchase-month-label">Month:</span>
                  <input 
                    type="number" 
                    v-model.number="item.purchaseMonth" 
                    min="0" 
                    :max="maxPurchaseMonth" 
                    @change="updateCosts()"
                    class="purchase-month-input"
                  >
                </div>
                <div class="item-notes">
                  <span v-if="editingBackendItem === 'notes-' + categoryIndex + '-' + itemIndex">
                    <input 
                      v-model="item.notes" 
                      @blur="editingBackendItem = null" 
                      @keyup.enter="editingBackendItem = null"
                      ref="backendItemNotesInput"
                      class="item-edit-input notes-input"
                    >
                  </span>
                  <span v-else @dblclick="startEditingBackendItem(categoryIndex, itemIndex, 'notes')">
                    {{ item.notes || 'Add notes...' }}
                  </span>
                </div>
                <div class="item-actions">
                  <button @click="removeBackendItem(categoryIndex, itemIndex)" class="delete-button">X</button>
                </div>
              </div>
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
  calculateWorkstationBundleCost, 
  calculateBackendInfrastructureCost,
  initializeDepartmentAssignments
} from '../workstation-data.js';

export default {
  props: {
    workstationData: {
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
    months: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    maxPurchaseMonth() {
      return this.months.length > 0 ? this.months.length - 1 : 47; // Default to 48 months (4 years) if not provided
    }
  },
  data() {
    return {
      activeTab: 'bundles',
      selectedBundle: null,
      editingBundle: null,
      editingComponent: null,
      selectedBackendCategory: null,
      editingBackendCategory: null,
      editingBackendItem: null,
      editingAssignment: null,
      backendCosts: {
        oneTime: 0,
        monthly: 0
      }
    };
  },
  mounted() {
    this.updateCosts();
    
    // Initialize department assignments if empty
    if (this.workstationData.departmentAssignments.length === 0) {
      this.initializeAssignments();
    }
  },
  methods: {
    closeWorkstationEditor() {
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
    toggleBundle(bundleIndex) {
      this.selectedBundle = this.selectedBundle === bundleIndex ? null : bundleIndex;
    },
    startEditingBundle(bundleIndex, field) {
      this.editingBundle = field + '-' + bundleIndex;
      this.$nextTick(() => {
        const refName = 'bundle' + field.charAt(0).toUpperCase() + field.slice(1) + 'Input';
        if (this.$refs[refName]) {
          this.$refs[refName].focus();
        }
      });
    },
    startEditingComponent(bundleIndex, componentIndex, field) {
      this.editingComponent = field + '-' + bundleIndex + '-' + componentIndex;
      this.$nextTick(() => {
        const refName = 'component' + field.charAt(0).toUpperCase() + field.slice(1) + 'Input';
        if (this.$refs[refName]) {
          this.$refs[refName].focus();
        }
      });
    },
    addWorkstationBundle() {
      const newId = 'WS' + (this.workstationData.workstationBundles.length + 1);
      this.workstationData.workstationBundles.push({
        id: newId,
        name: 'New Workstation Bundle',
        description: 'Description of the new workstation bundle',
        cost: 0,
        components: []
      });
      this.selectedBundle = this.workstationData.workstationBundles.length - 1;
      this.updateCosts();
    },
    removeBundle(bundleIndex) {
      if (confirm('Are you sure you want to remove this workstation bundle? This will affect any department assignments using this bundle.')) {
        // Check if any departments are using this bundle
        const bundleId = this.workstationData.workstationBundles[bundleIndex].id;
        const usedByDepartments = this.workstationData.departmentAssignments.filter(a => a.workstationId === bundleId);
        
        if (usedByDepartments.length > 0) {
          const departmentNames = usedByDepartments.map(a => a.departmentName).join(', ');
          alert(`This bundle is currently assigned to the following departments: ${departmentNames}. Please reassign these departments before removing the bundle.`);
          return;
        }
        
        this.workstationData.workstationBundles.splice(bundleIndex, 1);
        if (this.selectedBundle === bundleIndex) {
          this.selectedBundle = null;
        } else if (this.selectedBundle > bundleIndex) {
          this.selectedBundle--;
        }
        this.updateCosts();
      }
    },
    addComponent(bundleIndex) {
      this.workstationData.workstationBundles[bundleIndex].components.push({
        name: 'New Component',
        type: 'hardware',
        cost: 0,
        quantity: 1
      });
      this.updateBundleCost(bundleIndex);
    },
    removeComponent(bundleIndex, componentIndex) {
      if (confirm('Are you sure you want to remove this component?')) {
        this.workstationData.workstationBundles[bundleIndex].components.splice(componentIndex, 1);
        this.updateBundleCost(bundleIndex);
      }
    },
    updateBundleCost(bundleIndex) {
      const bundle = this.workstationData.workstationBundles[bundleIndex];
      bundle.cost = calculateWorkstationBundleCost(bundle);
      this.updateCosts();
    },
    toggleBackendCategory(categoryIndex) {
      this.selectedBackendCategory = this.selectedBackendCategory === categoryIndex ? null : categoryIndex;
    },
    startEditingBackendCategory(categoryIndex) {
      this.editingBackendCategory = categoryIndex;
      this.$nextTick(() => {
        if (this.$refs.backendCategoryInput) {
          this.$refs.backendCategoryInput.focus();
        }
      });
    },
    startEditingBackendItem(categoryIndex, itemIndex, field) {
      this.editingBackendItem = field + '-' + categoryIndex + '-' + itemIndex;
      this.$nextTick(() => {
        const refName = 'backendItem' + field.charAt(0).toUpperCase() + field.slice(1) + 'Input';
        if (this.$refs[refName]) {
          this.$refs[refName].focus();
        }
      });
    },
    addBackendCategory() {
      this.workstationData.backendInfrastructure.push({
        category: 'New Category',
        items: []
      });
      this.selectedBackendCategory = this.workstationData.backendInfrastructure.length - 1;
      this.updateCosts();
    },
    removeBackendCategory(categoryIndex) {
      if (confirm('Are you sure you want to remove this category and all its items?')) {
        this.workstationData.backendInfrastructure.splice(categoryIndex, 1);
        if (this.selectedBackendCategory === categoryIndex) {
          this.selectedBackendCategory = null;
        } else if (this.selectedBackendCategory > categoryIndex) {
          this.selectedBackendCategory--;
        }
        this.updateCosts();
      }
    },
    addBackendItem() {
      if (this.selectedBackendCategory !== null) {
        this.workstationData.backendInfrastructure[this.selectedBackendCategory].items.push({
          name: 'New Item',
          cost: 0,
          quantity: 1,
          notes: '',
          costType: 'one-time', // Default to one-time cost
          purchaseMonth: 0 // Default to first month
        });
        this.updateCosts();
      }
    },
    removeBackendItem(categoryIndex, itemIndex) {
      if (confirm('Are you sure you want to remove this item?')) {
        this.workstationData.backendInfrastructure[categoryIndex].items.splice(itemIndex, 1);
        this.updateCosts();
      }
    },
    startEditingAssignment(assignmentIndex, field) {
      this.editingAssignment = field + '-' + assignmentIndex;
      this.$nextTick(() => {
        const refName = 'assignment' + field.charAt(0).toUpperCase() + field.slice(1) + 'Input';
        if (this.$refs[refName]) {
          this.$refs[refName].focus();
        }
      });
    },
    getWorkstationName(workstationId) {
      const bundle = this.workstationData.workstationBundles.find(b => b.id === workstationId);
      return bundle ? bundle.name : 'Unknown';
    },
    getAssignmentMonthlyCost(assignment) {
      const bundle = this.workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
      if (bundle) {
        // Return the total cost (one-time purchase)
        return bundle.cost * assignment.quantity;
      }
      return 0;
    },
    initializeAssignments() {
      if (confirm('This will reset all department assignments to default values. Are you sure?')) {
        initializeDepartmentAssignments(this.workstationData, this.departments);
        this.updateCosts();
      }
    },
    updateCosts() {
      this.backendCosts = calculateBackendInfrastructureCost(this.workstationData.backendInfrastructure);
      this.$emit('update-costs');
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
}

.draggable-card .v-card-title {
  cursor: move !important;
  user-select: none !important;
  touch-action: none !important;
}

.workstation-editor {
  position: absolute;
  width: 800px;
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

.action-button.small {
  padding: 4px 8px;
  font-size: 12px;
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

.bundles-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bundle {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.bundle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  cursor: pointer;
}

.bundle-name {
  font-weight: bold;
  flex-grow: 1;
}

.bundle-cost {
  font-weight: bold;
  color: #2196f3;
  margin-right: 10px;
}

.bundle-edit-input {
  width: 200px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.bundle-details {
  padding: 15px;
  background-color: #fafafa;
}

.bundle-id, .bundle-description {
  margin-bottom: 10px;
}

.bundle-id label, .bundle-description label {
  font-weight: bold;
  margin-right: 10px;
}

.components-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0 10px;
}

.components-header h3 {
  margin: 0;
  font-size: 16px;
}

.components-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.component-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 0.5fr;
  gap: 10px;
  background-color: #f5f5f5;
  font-weight: bold;
  padding: 8px;
}

.component {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 0.5fr;
  gap: 10px;
  padding: 8px;
  border-top: 1px solid #eee;
  align-items: center;
}

.component-edit-input, .component-edit-select {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.cost-input, .quantity-input {
  text-align: right;
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

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.backend-item {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 1fr 1fr 0.8fr 2fr 0.5fr;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.backend-item:last-child {
  border-bottom: none;
}

.item-edit-input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.notes-input {
  font-size: 0.9em;
}

.assignments-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.assignment-header {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 0.5fr 0.5fr 1fr 2fr;
  gap: 10px;
  background-color: #f5f5f5;
  font-weight: bold;
  padding: 10px;
}

.assignment {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 0.5fr 0.5fr 1fr 2fr;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #eee;
  align-items: center;
}

.assignment-edit-input, .assignment-edit-select {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.item-purchase-month {
  display: flex;
  align-items: center;
  gap: 5px;
}

.purchase-month-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.purchase-month-input {
  width: 50px;
  padding: 3px 5px;
  border-radius: 4px;
  border: 1px solid #ddd;
  text-align: center;
}

.backend-item-header {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 1fr 1fr 0.8fr 2fr 0.5fr;
  gap: 10px;
  background-color: #f5f5f5;
  font-weight: bold;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 0.85rem;
}
</style>