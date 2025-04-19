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
          </div>
          
          <div v-if="activeTab === 'bundles'" class="tab-content">
            <div class="bundle-list">
              <div 
                v-for="(bundle, index) in workstationData.bundles" 
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
                v-for="(assignment, index) in workstationData.assignments" 
                :key="index"
                class="assignment-item"
              >
                <select 
                  v-model="assignment.departmentIndex" 
                  @change="updateWorkstationData"
                  class="assignment-department-select"
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
                  v-model="assignment.bundleIndex" 
                  @change="updateWorkstationData"
                  class="assignment-bundle-select"
                >
                  <option 
                    v-for="(bundle, bundleIndex) in workstationData.bundles" 
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
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { 
  calculateWorkstationBundleCost, 
  calculateTotalWorkstationCosts 
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
    },
    editorPosition: {
      type: String,
      default: 'position-right'
    },
    editorStyle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeTab: 'bundles'
    };
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
      this.workstationData.bundles.forEach(bundle => {
        bundle.cost = calculateWorkstationBundleCost(bundle);
      });
      
      this.$emit('update-costs');
    },
    
    addBundle() {
      this.workstationData.bundles.push({
        name: 'New Hardware Bundle',
        cost: 0,
        components: []
      });
      this.updateWorkstationData();
    },
    
    removeBundle(index) {
      // Check if this bundle is used in any assignments
      const isUsed = this.workstationData.assignments.some(
        assignment => assignment.bundleIndex === index
      );
      
      if (isUsed) {
        alert('Cannot remove this bundle as it is assigned to one or more departments.');
        return;
      }
      
      this.workstationData.bundles.splice(index, 1);
      
      // Update any assignments that reference bundles with higher indices
      this.workstationData.assignments.forEach(assignment => {
        if (assignment.bundleIndex > index) {
          assignment.bundleIndex--;
        }
      });
      
      this.updateWorkstationData();
    },
    
    addComponent(bundleIndex) {
      this.workstationData.bundles[bundleIndex].components.push({
        name: '',
        type: 'hardware',
        cost: 0,
        quantity: 1
      });
      this.updateWorkstationData();
    },
    
    removeComponent(bundleIndex, componentIndex) {
      this.workstationData.bundles[bundleIndex].components.splice(componentIndex, 1);
      this.updateWorkstationData();
    },
    
    addAssignment() {
      if (this.workstationData.bundles.length === 0) {
        alert('Please create at least one hardware bundle first.');
        this.activeTab = 'bundles';
        return;
      }
      
      if (this.departments.length === 0) {
        alert('Please create at least one department first.');
        return;
      }
      
      this.workstationData.assignments.push({
        departmentIndex: 0,
        bundleIndex: 0,
        quantity: 1
      });
      this.updateWorkstationData();
    },
    
    removeAssignment(index) {
      this.workstationData.assignments.splice(index, 1);
      this.updateWorkstationData();
    },
    
    getAssignmentCost(assignment) {
      const bundle = this.workstationData.bundles[assignment.bundleIndex];
      if (!bundle) return 0;
      return bundle.cost * assignment.quantity;
    },
    
    startDrag(event) {
      // Only start drag if clicking on the header (card title)
      if (event.target.closest('.v-card-title')) {
        this.$emit('start-drag', event);
      }
    },
    
    resetEditorPosition() {
      this.$emit('reset-position');
    },
    
    closeWorkstationEditor() {
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

.editor-content {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
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
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 0.5fr;
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
}
</style>