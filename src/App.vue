<template>
  <div class="app-container">
    <header>
      <h1>Crew Planning Tool</h1>
    </header>
    <main>
      <div class="visualization">
        <h2>Crew Planning Visualization</h2>
        <div class="actions">
          <button @click="addNewDepartment" class="action-button add-button">
            <span class="icon">+</span> Add Department
          </button>
          <button @click="addNewPhase" class="action-button phase-button">
            <span class="icon">+</span> Add Phase Label
          </button>
          <div class="zoom-controls">
            <button @click="zoomOut" class="zoom-button" title="Zoom Out">-</button>
            <span>{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomIn" class="zoom-button" title="Zoom In">+</button>
            <button @click="resetZoom" class="zoom-button reset" title="Reset Zoom">Reset</button>
          </div>
        </div>
        <div class="table-container" :style="{ fontSize: zoomLevel + 'rem' }">
          <table class="crew-table">
            <thead>
              <tr>
                <th>Department</th>
                <th v-for="(month, index) in months" :key="index">{{ month }}</th>
              </tr>
            </thead>
            <tbody>
              <!-- Phase labels -->
              <tr v-for="(phase, pIndex) in phases" :key="`phase-${pIndex}`" 
                  class="phase-row" 
                  @click="editPhase(pIndex)"
                  draggable="true"
                  @dragstart="dragStart($event, 'phase', pIndex)"
                  @dragover.prevent
                  @dragenter.prevent
                  @drop="handleDrop($event, 'phase', pIndex)">
                <td class="phase-label" :class="{ 'selected': selectedPhaseIndex === pIndex }">
                  <span class="drag-handle">:::</span>
                  {{ phase.name }}
                </td>
                <td v-for="(month, mIndex) in months" :key="`phase-${pIndex}-${mIndex}`" 
                    :class="{ 'phase-active': isMonthInPhase(phase, mIndex) }">
                </td>
              </tr>
              
              <!-- Department rows -->
              <tr v-for="(department, dIndex) in departments" :key="`dept-${dIndex}`" 
                  @click="selectDepartment(dIndex)"
                  :class="{ 'selected-row': selectedDepartmentIndex === dIndex }"
                  draggable="true"
                  @dragstart="dragStart($event, 'department', dIndex)"
                  @dragover.prevent
                  @dragenter.prevent
                  @drop="handleDrop($event, 'department', dIndex)">
                <td>
                  <span class="drag-handle">:::</span>
                  {{ department.name }}
                </td>
                <td v-for="(month, mIndex) in months" :key="`dept-${dIndex}-${mIndex}`" 
                    :class="{ active: crewMatrix[dIndex][mIndex] > 0 }">
                  {{ crewMatrix[dIndex][mIndex] }}
                </td>
              </tr>
              
              <!-- Cost rows -->
              <tr class="cost-row">
                <td><strong>Monthly Cost ($)</strong></td>
                <td v-for="(cost, index) in monthlyCosts" :key="index" 
                    :class="{ active: cost > 0 }">
                  {{ formatCurrency(cost) }}
                </td>
              </tr>
              <tr class="total-row">
                <td><strong>Cumulative Cost ($)</strong></td>
                <td v-for="(cost, index) in cumulativeCosts" :key="index" 
                    :class="{ active: cost > 0 }">
                  {{ formatCurrency(cost) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="summary">
          <h3>Project Summary</h3>
          <p><strong>Total Project Cost:</strong> {{ formatCurrency(totalProjectCost) }}</p>
          <p><strong>Peak Monthly Cost:</strong> {{ formatCurrency(peakMonthlyCost) }}</p>
          <p><strong>Peak Crew Size:</strong> {{ peakCrewSize }}</p>
        </div>
      </div>
      
      <!-- Floating Editor Panel -->
      <div v-if="selectedDepartmentIndex !== null" class="floating-editor department-editor" :class="editorPosition">
        <div class="editor-header">
          <h2>Department Editor</h2>
          <div class="editor-controls">
            <button @click="moveEditorPosition" class="move-button" title="Move Editor">↕</button>
            <button @click="closeDepartmentEditor" class="close-button">X</button>
          </div>
        </div>
        <div class="editor-content">
          <div class="name-input">
            <label>Department Name:</label>
            <input 
              type="text" 
              v-model="departments[selectedDepartmentIndex].name" 
              class="text-input"
            >
          </div>
          <div class="slider-container">
            <label>Max Crew Size: {{ departments[selectedDepartmentIndex].maxCrew }}</label>
            <input 
              type="range" 
              v-model="departments[selectedDepartmentIndex].maxCrew" 
              min="0" 
              max="100" 
              class="slider"
              @input="updateDepartmentCrew(departments[selectedDepartmentIndex])"
            >
          </div>
          <div class="slider-container">
            <label>Start Month: {{ getMonthName(departments[selectedDepartmentIndex].startMonth) }}</label>
            <input 
              type="range" 
              v-model="departments[selectedDepartmentIndex].startMonth" 
              min="0" 
              :max="months.length - 1" 
              class="slider"
              @input="updateDepartmentTimeframe(departments[selectedDepartmentIndex])"
            >
          </div>
          <div class="slider-container">
            <label>End Month: {{ getMonthName(departments[selectedDepartmentIndex].endMonth) }}</label>
            <input 
              type="range" 
              v-model="departments[selectedDepartmentIndex].endMonth" 
              :min="departments[selectedDepartmentIndex].startMonth" 
              :max="months.length - 1" 
              class="slider"
              @input="updateDepartmentTimeframe(departments[selectedDepartmentIndex])"
            >
          </div>
          <div class="slider-container">
            <label>Ramp Up Duration (months): {{ departments[selectedDepartmentIndex].rampUpDuration }}</label>
            <input 
              type="range" 
              v-model="departments[selectedDepartmentIndex].rampUpDuration" 
              min="0" 
              :max="Math.max(1, Math.floor((departments[selectedDepartmentIndex].endMonth - departments[selectedDepartmentIndex].startMonth) / 2))" 
              class="slider"
              @input="updateDepartmentRamp(departments[selectedDepartmentIndex])"
            >
          </div>
          <div class="slider-container">
            <label>Ramp Down Duration (months): {{ departments[selectedDepartmentIndex].rampDownDuration }}</label>
            <input 
              type="range" 
              v-model="departments[selectedDepartmentIndex].rampDownDuration" 
              min="0" 
              :max="Math.max(1, Math.floor((departments[selectedDepartmentIndex].endMonth - departments[selectedDepartmentIndex].startMonth) / 2))" 
              class="slider"
              @input="updateDepartmentRamp(departments[selectedDepartmentIndex])"
            >
          </div>
          <div class="rate-input">
            <label>Rate ($/month): </label>
            <input 
              type="number" 
              v-model="departments[selectedDepartmentIndex].rate" 
              min="0" 
              step="100"
              @input="calculateCosts"
              class="number-input"
            >
          </div>
          <div class="editor-actions">
            <button @click="moveDepartmentUp" class="action-button move-up-button" :disabled="selectedDepartmentIndex === 0">
              Move Up
            </button>
            <button @click="moveDepartmentDown" class="action-button move-down-button" :disabled="selectedDepartmentIndex === departments.length - 1">
              Move Down
            </button>
            <button @click="removeDepartment" class="action-button delete-button">
              Remove Department
            </button>
          </div>
        </div>
      </div>
      
      <!-- Phase Editor Panel -->
      <div v-if="selectedPhaseIndex !== null" class="floating-editor phase-editor" :class="editorPosition">
        <div class="editor-header">
          <h2>Phase Editor</h2>
          <div class="editor-controls">
            <button @click="moveEditorPosition" class="move-button" title="Move Editor">↕</button>
            <button @click="closePhaseEditor" class="close-button">X</button>
          </div>
        </div>
        <div class="editor-content">
          <div class="name-input">
            <label>Phase Name:</label>
            <input 
              type="text" 
              v-model="phases[selectedPhaseIndex].name" 
              class="text-input"
            >
          </div>
          <div class="slider-container">
            <label>Start Month: {{ getMonthName(phases[selectedPhaseIndex].startMonth) }}</label>
            <input 
              type="range" 
              v-model="phases[selectedPhaseIndex].startMonth" 
              min="0" 
              :max="months.length - 1" 
              class="slider"
            >
          </div>
          <div class="slider-container">
            <label>End Month: {{ getMonthName(phases[selectedPhaseIndex].endMonth) }}</label>
            <input 
              type="range" 
              v-model="phases[selectedPhaseIndex].endMonth" 
              :min="phases[selectedPhaseIndex].startMonth" 
              :max="months.length - 1" 
              class="slider"
            >
          </div>
          <div class="editor-actions">
            <button @click="movePhaseUp" class="action-button move-up-button" :disabled="selectedPhaseIndex === 0">
              Move Up
            </button>
            <button @click="movePhaseDown" class="action-button move-down-button" :disabled="selectedPhaseIndex === phases.length - 1">
              Move Down
            </button>
            <button @click="removePhase" class="action-button delete-button">
              Remove Phase
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      years: [2022, 2023, 2024, 2025],
      monthsPerYear: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      months: [],
      selectedDepartmentIndex: null,
      selectedPhaseIndex: null,
      zoomLevel: 1,
      editorPosition: 'position-left',
      draggedItem: null,
      phases: [
        {
          name: 'Concept Stage',
          startMonth: 0,
          endMonth: 15
        },
        {
          name: 'Previs Stage',
          startMonth: 6,
          endMonth: 20
        },
        {
          name: 'Asset Build',
          startMonth: 11,
          endMonth: 36
        },
        {
          name: 'Shot Production',
          startMonth: 20,
          endMonth: 42
        }
      ],
      departments: [
        {
          name: 'Digital Supervision',
          maxCrew: 1,
          startMonth: 0,
          endMonth: 32,
          rampUpDuration: 0,
          rampDownDuration: 0,
          rate: 15000
        },
        {
          name: 'Character Supervision',
          maxCrew: 1,
          startMonth: 0,
          endMonth: 24,
          rampUpDuration: 0,
          rampDownDuration: 0,
          rate: 14000
        },
        {
          name: 'Modeling Supervision',
          maxCrew: 1,
          startMonth: 0,
          endMonth: 20,
          rampUpDuration: 0,
          rampDownDuration: 0,
          rate: 13000
        },
        {
          name: 'Lighting Supervision',
          maxCrew: 1,
          startMonth: 3,
          endMonth: 32,
          rampUpDuration: 0,
          rampDownDuration: 0,
          rate: 13500
        },
        {
          name: 'VFX Supervision',
          maxCrew: 1,
          startMonth: 4,
          endMonth: 32,
          rampUpDuration: 0,
          rampDownDuration: 0,
          rate: 14500
        },
        {
          name: 'Concept Artists (Character)',
          maxCrew: 4,
          startMonth: 0,
          endMonth: 15,
          rampUpDuration: 2,
          rampDownDuration: 2,
          rate: 8000
        },
        {
          name: 'Concept Artists (Environment)',
          maxCrew: 4,
          startMonth: 0,
          endMonth: 15,
          rampUpDuration: 2,
          rampDownDuration: 2,
          rate: 8000
        },
        {
          name: 'Character Modeller',
          maxCrew: 6,
          startMonth: 0,
          endMonth: 11,
          rampUpDuration: 2,
          rampDownDuration: 2,
          rate: 7500
        },
        {
          name: 'Character Rigger',
          maxCrew: 6,
          startMonth: 0,
          endMonth: 15,
          rampUpDuration: 2,
          rampDownDuration: 2,
          rate: 8500
        },
        {
          name: 'Technical Director',
          maxCrew: 4,
          startMonth: 6,
          endMonth: 32,
          rampUpDuration: 2,
          rampDownDuration: 1,
          rate: 12000
        },
        {
          name: 'Animators',
          maxCrew: 60,
          startMonth: 11,
          endMonth: 42,
          rampUpDuration: 4,
          rampDownDuration: 3,
          rate: 7000
        },
        {
          name: 'Lighters',
          maxCrew: 80,
          startMonth: 11,
          endMonth: 42,
          rampUpDuration: 4,
          rampDownDuration: 3,
          rate: 7500
        },
        {
          name: 'VFX Artists',
          maxCrew: 30,
          startMonth: 11,
          endMonth: 42,
          rampUpDuration: 3,
          rampDownDuration: 3,
          rate: 8000
        },
        {
          name: 'Composite',
          maxCrew: 40,
          startMonth: 11,
          endMonth: 42,
          rampUpDuration: 3,
          rampDownDuration: 3,
          rate: 7800
        }
      ],
      crewMatrix: [],
      monthlyCosts: [],
      cumulativeCosts: [],
      totalProjectCost: 0,
      peakMonthlyCost: 0,
      peakCrewSize: 0
    };
  },
  created() {
    // Generate all months across years
    this.years.forEach(year => {
      this.monthsPerYear.forEach(month => {
        this.months.push(`${month} ${year}`);
      });
    });
    
    // Initialize crew matrix
    this.initializeCrewMatrix();
    
    // Calculate initial crew distribution and costs
    this.updateAllDepartments();
    this.calculateCosts();
  },
  methods: {
    initializeCrewMatrix() {
      this.crewMatrix = [];
      for (let i = 0; i < this.departments.length; i++) {
        this.crewMatrix.push(new Array(this.months.length).fill(0));
      }
    },
    getMonthName(index) {
      return this.months[index] || '';
    },
    updateDepartmentCrew(department) {
      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
      this.calculateCosts();
    },
    updateDepartmentTimeframe(department) {
      // Ensure end month is after start month
      if (department.endMonth <= department.startMonth) {
        department.endMonth = department.startMonth + 1;
      }
      
      // Adjust ramp durations if they exceed the new timeframe
      const timeframeDuration = department.endMonth - department.startMonth;
      const maxRampDuration = Math.floor(timeframeDuration / 2);
      
      if (department.rampUpDuration > maxRampDuration) {
        department.rampUpDuration = maxRampDuration;
      }
      
      if (department.rampDownDuration > maxRampDuration) {
        department.rampDownDuration = maxRampDuration;
      }
      
      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
      this.calculateCosts();
    },
    updateDepartmentRamp(department) {
      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
      this.calculateCosts();
    },
    updateAllDepartments() {
      this.initializeCrewMatrix();
      for (let i = 0; i < this.departments.length; i++) {
        this.updateDepartmentDistribution(i);
      }
    },
    updateDepartmentDistribution(dIndex) {
      const department = this.departments[dIndex];
      const { startMonth, endMonth, maxCrew, rampUpDuration, rampDownDuration } = department;
      
      // Clear previous values
      this.crewMatrix[dIndex].fill(0);
      
      // Calculate the plateau duration (full crew period)
      const totalDuration = endMonth - startMonth + 1;
      const plateauStart = startMonth + rampUpDuration;
      const plateauEnd = endMonth - rampDownDuration;
      
      // Apply ramp up
      for (let i = 0; i < rampUpDuration; i++) {
        const month = startMonth + i;
        const crewSize = Math.round((i + 1) * maxCrew / rampUpDuration);
        this.crewMatrix[dIndex][month] = crewSize;
      }
      
      // Apply plateau (full crew)
      for (let month = plateauStart; month <= plateauEnd; month++) {
        this.crewMatrix[dIndex][month] = maxCrew;
      }
      
      // Apply ramp down
      for (let i = 0; i < rampDownDuration; i++) {
        const month = plateauEnd + 1 + i;
        const crewSize = Math.round(maxCrew * (rampDownDuration - i - 1) / rampDownDuration);
        this.crewMatrix[dIndex][month] = crewSize;
      }
    },
    calculateCosts() {
      // Reset cost arrays
      this.monthlyCosts = new Array(this.months.length).fill(0);
      this.cumulativeCosts = new Array(this.months.length).fill(0);
      
      // Calculate monthly costs
      for (let m = 0; m < this.months.length; m++) {
        for (let d = 0; d < this.departments.length; d++) {
          const crewSize = this.crewMatrix[d][m];
          const rate = this.departments[d].rate;
          this.monthlyCosts[m] += crewSize * rate;
        }
      }
      
      // Calculate cumulative costs
      let runningTotal = 0;
      for (let m = 0; m < this.months.length; m++) {
        runningTotal += this.monthlyCosts[m];
        this.cumulativeCosts[m] = runningTotal;
      }
      
      // Calculate summary statistics
      this.totalProjectCost = this.cumulativeCosts[this.cumulativeCosts.length - 1];
      this.peakMonthlyCost = Math.max(...this.monthlyCosts);
      
      // Calculate peak crew size
      let maxCrewSize = 0;
      for (let m = 0; m < this.months.length; m++) {
        let monthlyCrewSize = 0;
        for (let d = 0; d < this.departments.length; d++) {
          monthlyCrewSize += this.crewMatrix[d][m];
        }
        maxCrewSize = Math.max(maxCrewSize, monthlyCrewSize);
      }
      this.peakCrewSize = maxCrewSize;
    },
    formatCurrency(value) {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: 0
      }).format(value);
    },
    // Department selection and editing
    selectDepartment(index) {
      this.selectedDepartmentIndex = index;
      this.selectedPhaseIndex = null;
    },
    closeDepartmentEditor() {
      this.selectedDepartmentIndex = null;
    },
    addNewDepartment() {
      const newDepartment = {
        name: 'New Department',
        maxCrew: 5,
        startMonth: 0,
        endMonth: 12,
        rampUpDuration: 2,
        rampDownDuration: 2,
        rate: 8000
      };
      
      this.departments.push(newDepartment);
      this.crewMatrix.push(new Array(this.months.length).fill(0));
      this.updateDepartmentDistribution(this.departments.length - 1);
      this.calculateCosts();
      this.selectDepartment(this.departments.length - 1);
    },
    removeDepartment() {
      if (this.selectedDepartmentIndex !== null) {
        if (confirm(`Are you sure you want to remove "${this.departments[this.selectedDepartmentIndex].name}"?`)) {
          this.departments.splice(this.selectedDepartmentIndex, 1);
          this.crewMatrix.splice(this.selectedDepartmentIndex, 1);
          this.calculateCosts();
          this.selectedDepartmentIndex = null;
        }
      }
    },
    // Phase methods
    isMonthInPhase(phase, monthIndex) {
      return monthIndex >= phase.startMonth && monthIndex <= phase.endMonth;
    },
    editPhase(index) {
      this.selectedPhaseIndex = index;
      this.selectedDepartmentIndex = null;
    },
    closePhaseEditor() {
      this.selectedPhaseIndex = null;
    },
    addNewPhase() {
      const newPhase = {
        name: 'New Phase',
        startMonth: 0,
        endMonth: 12
      };
      
      this.phases.push(newPhase);
      this.selectedPhaseIndex = this.phases.length - 1;
    },
    removePhase() {
      if (this.selectedPhaseIndex !== null) {
        if (confirm(`Are you sure you want to remove "${this.phases[this.selectedPhaseIndex].name}"?`)) {
          this.phases.splice(this.selectedPhaseIndex, 1);
          this.selectedPhaseIndex = null;
        }
      }
    },
    // Zoom controls
    zoomIn() {
      if (this.zoomLevel < 2) {
        this.zoomLevel += 0.1;
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel -= 0.1;
      }
    },
    resetZoom() {
      this.zoomLevel = 1;
    },
    // Editor position
    moveEditorPosition() {
      this.editorPosition = this.editorPosition === 'position-left' ? 'position-right' : 'position-left';
    },
    // Drag and drop functionality
    dragStart(event, type, index) {
      this.draggedItem = { type, index };
      event.dataTransfer.effectAllowed = 'move';
    },
    handleDrop(event, type, targetIndex) {
      if (!this.draggedItem) return;
      
      const { type: sourceType, index: sourceIndex } = this.draggedItem;
      
      // Only allow reordering within the same type (phases or departments)
      if (sourceType !== type) return;
      
      if (sourceIndex === targetIndex) return;
      
      if (type === 'department') {
        // Reorder departments
        const item = this.departments.splice(sourceIndex, 1)[0];
        this.departments.splice(targetIndex, 0, item);
        
        // Also reorder the crew matrix
        const matrixRow = this.crewMatrix.splice(sourceIndex, 1)[0];
        this.crewMatrix.splice(targetIndex, 0, matrixRow);
        
        // Update selected index if needed
        if (this.selectedDepartmentIndex === sourceIndex) {
          this.selectedDepartmentIndex = targetIndex;
        } else if (
          this.selectedDepartmentIndex > sourceIndex && 
          this.selectedDepartmentIndex <= targetIndex
        ) {
          this.selectedDepartmentIndex--;
        } else if (
          this.selectedDepartmentIndex < sourceIndex && 
          this.selectedDepartmentIndex >= targetIndex
        ) {
          this.selectedDepartmentIndex++;
        }
      } else if (type === 'phase') {
        // Reorder phases
        const item = this.phases.splice(sourceIndex, 1)[0];
        this.phases.splice(targetIndex, 0, item);
        
        // Update selected index if needed
        if (this.selectedPhaseIndex === sourceIndex) {
          this.selectedPhaseIndex = targetIndex;
        } else if (
          this.selectedPhaseIndex > sourceIndex && 
          this.selectedPhaseIndex <= targetIndex
        ) {
          this.selectedPhaseIndex--;
        } else if (
          this.selectedPhaseIndex < sourceIndex && 
          this.selectedPhaseIndex >= targetIndex
        ) {
          this.selectedPhaseIndex++;
        }
      }
      
      this.draggedItem = null;
    },
    // Move departments and phases with buttons
    moveDepartmentUp() {
      if (this.selectedDepartmentIndex > 0) {
        const index = this.selectedDepartmentIndex;
        const item = this.departments.splice(index, 1)[0];
        const matrixRow = this.crewMatrix.splice(index, 1)[0];
        
        this.departments.splice(index - 1, 0, item);
        this.crewMatrix.splice(index - 1, 0, matrixRow);
        
        this.selectedDepartmentIndex = index - 1;
      }
    },
    moveDepartmentDown() {
      if (this.selectedDepartmentIndex < this.departments.length - 1) {
        const index = this.selectedDepartmentIndex;
        const item = this.departments.splice(index, 1)[0];
        const matrixRow = this.crewMatrix.splice(index, 1)[0];
        
        this.departments.splice(index + 1, 0, item);
        this.crewMatrix.splice(index + 1, 0, matrixRow);
        
        this.selectedDepartmentIndex = index + 1;
      }
    },
    movePhaseUp() {
      if (this.selectedPhaseIndex > 0) {
        const index = this.selectedPhaseIndex;
        const item = this.phases.splice(index, 1)[0];
        
        this.phases.splice(index - 1, 0, item);
        
        this.selectedPhaseIndex = index - 1;
      }
    },
    movePhaseDown() {
      if (this.selectedPhaseIndex < this.phases.length - 1) {
        const index = this.selectedPhaseIndex;
        const item = this.phases.splice(index, 1)[0];
        
        this.phases.splice(index + 1, 0, item);
        
        this.selectedPhaseIndex = index + 1;
      }
    }
  }
};
</script>

<style>
.app-container {
  font-family: Arial, sans-serif;
  max-width: 1800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

main {
  display: flex;
  position: relative;
}

.visualization {
  flex: 1;
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.action-button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.add-button {
  background-color: #4CAF50;
  color: white;
}

.phase-button {
  background-color: #2196F3;
  color: white;
}

.delete-button {
  background-color: #f44336;
  color: white;
}

.move-up-button, .move-down-button {
  background-color: #607D8B;
  color: white;
}

.icon {
  font-size: 16px;
  font-weight: bold;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

.zoom-button {
  width: 30px;
  height: 30px;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.zoom-button.reset {
  width: auto;
  padding: 0 10px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  transition: font-size 0.3s ease;
}

.crew-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.crew-table th, .crew-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.crew-table th {
  background-color: #4CAF50;
  color: white;
  position: sticky;
  top: 0;
  z-index: 1;
}

.crew-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.crew-table td.active {
  background-color: #e6f7ff;
}

.cost-row {
  background-color: #fffde7 !important;
}

.total-row {
  background-color: #fff8e1 !important;
}

.summary {
  background-color: #fff;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Phase styling */
.phase-row {
  background-color: #f9f9f9;
  cursor: pointer;
}

.phase-label {
  font-weight: bold;
  color: #555;
  font-style: italic;
  background-color: #f0f0f0;
}

.phase-active {
  background-color: rgba(33, 150, 243, 0.1);
}

/* Selected row styling */
.selected-row {
  background-color: #e3f2fd !important;
  cursor: pointer;
}

.selected {
  background-color: #bbdefb !important;
}

/* Drag handle */
.drag-handle {
  cursor: move;
  color: #999;
  margin-right: 8px;
  font-weight: bold;
  user-select: none;
}

/* Floating editor panel */
.floating-editor {
  width: 350px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  position: fixed;
  top: 100px;
  z-index: 100;
  max-height: 80vh;
  overflow-y: auto;
}

.position-left {
  left: 20px;
}

.position-right {
  right: 20px;
}

.phase-editor {
  background-color: #f0f8ff;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  background-color: #f8f8f8;
  border-radius: 8px 8px 0 0;
}

.editor-controls {
  display: flex;
  gap: 10px;
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-button, .move-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #555;
  width: 30px;
  height: 30px;
  border-radius: 4px;
}

.close-button:hover, .move-button:hover {
  background-color: #eee;
}

.editor-content {
  padding: 15px;
}

.name-input {
  margin-bottom: 15px;
}

.text-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 5px;
}

.slider-container {
  margin: 15px 0;
}

.slider {
  width: 100%;
  margin-top: 5px;
}

.rate-input {
  margin: 15px 0;
}

.number-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 120px;
}

.editor-actions {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 1200px) {
  main {
    flex-direction: column;
  }
  
  .floating-editor {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    top: auto;
    width: 90%;
    max-width: 500px;
  }
  
  .position-left, .position-right {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }
}
</style>