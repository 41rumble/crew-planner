<template>
  <div class="app-container" :style="{
    '--cell-width': 60 * zoomLevel + 'px',
    '--cell-height': 40 * zoomLevel + 'px',
    '--cell-padding': 8 * zoomLevel + 'px',
    '--font-size': 14 * zoomLevel + 'px',
    '--header-height': 80 * zoomLevel + 'px'
  }">
    <header>
      <h1>Crew Planning Tool</h1>
    </header>
    <main>
      <div class="visualization">
        <div class="visualization-header">
          <h2>Crew Planning Visualization</h2>
          <div class="summary-header">
            <div class="summary-stat">
              <div class="stat-label">Total Project Cost</div>
              <div class="stat-value">${{ formatCurrency(totalProjectCost) }}</div>
            </div>
            <div class="summary-stat">
              <div class="stat-label">Peak Monthly Cost</div>
              <div class="stat-value">${{ formatCurrency(peakMonthlyCost) }}</div>
            </div>
            <div class="summary-stat">
              <div class="stat-label">Peak Crew Size</div>
              <div class="stat-value">{{ peakCrewSize }} crew members</div>
            </div>
          </div>
        </div>
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
            <button @click="exportCSV" class="export-button" title="Export to CSV">Export CSV</button>
          </div>
        </div>
        <div class="table-container">
          <div class="table-scroll-container">
            <div class="table-wrapper">
              <table class="crew-table">
                <thead>
                <tr class="year-row">
                  <th class="fixed-column-header"></th>
                  <th v-for="(year, index) in years" :key="`year-${index}`" :colspan="getMonthsInYear(year)" class="year-header">
                    <span @click="editYear(index)" class="editable-year">{{ year }}</span>
                  </th>
                </tr>
                <tr>
                  <th class="fixed-column-header" :style="getDepartmentColumnStyle()">Department</th>
                  <th v-for="(month, index) in months" :key="index" class="month-header" :style="getCellStyle()">
                    <span v-if="zoomLevel > 0.8">{{ getMonthName(index) }}</span>
                    <span v-else-if="zoomLevel > 0.6">{{ getShortMonthName(index) }}</span>
                    <span v-else>{{ getSingleLetterMonth(index) }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- All rows (phases and departments mixed) -->
                <template v-for="(item, index) in sortedItems">
                  <!-- Phase row -->
                  <tr v-if="item.type === 'phase'" :key="`item-${index}`" 
                      class="phase-row" 
                      draggable="true"
                      @dragstart="dragStart($event, 'mixed', index)"
                      @dragover.prevent
                      @dragenter.prevent
                      @drop="handleDrop($event, 'mixed', index)">
                    <td class="fixed-column" :class="{ 
                          'phase-label': true, 
                          'selected': selectedPhaseIndex === item.index 
                        }" 
                        :style="getDepartmentColumnStyle()"
                        @click="editPhase(item.index)">
                      <span class="drag-handle">:::</span>
                      {{ phases[item.index].name }}
                    </td>
                    <td v-for="(month, mIndex) in months" :key="`phase-${item.index}-${mIndex}`" 
                        :class="{ 'phase-active': isMonthInPhase(phases[item.index], mIndex) }"
                        :style="getCellStyle()">
                    </td>
                  </tr>
                  
                  <!-- Department row -->
                  <tr v-else :key="`item-${index}`" 
                      :class="{ 'selected-row': selectedDepartmentIndex === item.index }"
                      draggable="true"
                      @dragstart="dragStart($event, 'mixed', index)"
                      @dragover.prevent
                      @dragenter.prevent
                      @drop="handleDrop($event, 'mixed', index)">
                    <td class="fixed-column" :style="getDepartmentColumnStyle()" @click="selectDepartment(item.index)">
                      <span class="drag-handle">:::</span>
                      {{ departments[item.index].name }}
                    </td>
                    <td v-for="(month, mIndex) in months" :key="`dept-${item.index}-${mIndex}`" 
                        :class="{ active: crewMatrix[item.index][mIndex] > 0 }"
                        :style="getCellStyle()">
                      {{ crewMatrix[item.index][mIndex] > 0 ? crewMatrix[item.index][mIndex] : '' }}
                    </td>
                  </tr>
                </template>
                
                <!-- Cost rows -->
                <tr class="cost-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Monthly Cost</strong></td>
                  <td v-for="(cost, index) in monthlyCosts" :key="index" 
                      :class="{ active: cost > 0 }"
                      :style="getCellStyle()"
                      :title="'$' + formatCurrency(cost)">
                    {{ cost > 0 ? formatCompactCurrency(cost) : '' }}
                  </td>
                </tr>
                <tr class="total-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Cumulative Cost</strong></td>
                  <td v-for="(cost, index) in cumulativeCosts" :key="index" 
                      :class="{ active: cost > 0 }"
                      :style="getCellStyle()"
                      :title="'$' + formatCurrency(cost)">
                    {{ cost > 0 ? formatCompactCurrency(cost) : '' }}
                  </td>
                </tr>
              </tbody>
              </table>
              <div class="bottom-spacer"></div>
            </div>
          </div>
        </div>

      </div>
      
      <!-- Floating Editor Panel -->
      <div v-if="selectedDepartmentIndex !== null" class="floating-editor department-editor" 
           :class="editorPosition"
           :style="editorStyle"
           ref="departmentEditor"
           @mousedown="startDrag($event, 'department')">
        <div class="editor-header">
          <h2>Department Editor</h2>
          <div class="editor-controls">
            <button @click="resetEditorPosition" class="reset-button" title="Reset Position">⟲</button>
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
      <div v-if="selectedPhaseIndex !== null" class="floating-editor phase-editor" 
           :class="editorPosition"
           :style="editorStyle"
           ref="phaseEditor"
           @mousedown="startDrag($event, 'phase')">
        <div class="editor-header">
          <h2>Phase Editor</h2>
          <div class="editor-controls">
            <button @click="resetEditorPosition" class="reset-button" title="Reset Position">⟲</button>
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
import { simpleData } from './simple-data.js';

export default {
  data() {
    return {
      years: simpleData.years,
      monthsPerYear: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      shortMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      singleLetterMonths: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      months: simpleData.months,
      departments: simpleData.departments,
      phases: simpleData.phases,
      crewMatrix: [],
      selectedDepartmentIndex: null,
      selectedPhaseIndex: null,
      zoomLevel: 1.0, // Start at 100% zoom
      editorPosition: 'position-left',
      draggedItem: null,
      editorStyle: { top: '150px', left: '20px' },
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      activeEditor: null,
      // Track the order of phases and departments
      itemOrder: [],
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
    console.log("App created, using simple data");
    
    // Make sure crewMatrix is initialized
    if (!this.crewMatrix || this.crewMatrix.length === 0) {
      this.initializeCrewMatrix();
      
      // Update crew distribution for all departments
      for (let i = 0; i < this.departments.length; i++) {
        this.updateDepartmentDistribution(i);
      }
    }
    
    // Initialize item order
    this.initializeItemOrder();
    
    // Calculate costs
    this.calculateCosts();
  },
  
  computed: {
    // Get the sorted items (phases and departments) based on itemOrder
    sortedItems() {
      return this.itemOrder;
    }
  },
  methods: {
    // Initialize the item order with phases first, then departments
    initializeItemOrder() {
      this.itemOrder = [];
      
      // Add phases
      for (let i = 0; i < this.phases.length; i++) {
        this.itemOrder.push({ type: 'phase', index: i });
        
        // Add departments that belong to this phase
        for (let j = 0; j < this.departments.length; j++) {
          // Simple heuristic: if department's start month is within phase's timeframe
          const dept = this.departments[j];
          const phase = this.phases[i];
          
          if (dept.startMonth >= phase.startMonth && dept.startMonth <= phase.endMonth) {
            // Check if this department is already added
            const alreadyAdded = this.itemOrder.some(item => 
              item.type === 'department' && item.index === j
            );
            
            if (!alreadyAdded) {
              this.itemOrder.push({ type: 'department', index: j });
            }
          }
        }
      }
      
      // Add any remaining departments
      for (let j = 0; j < this.departments.length; j++) {
        const alreadyAdded = this.itemOrder.some(item => 
          item.type === 'department' && item.index === j
        );
        
        if (!alreadyAdded) {
          this.itemOrder.push({ type: 'department', index: j });
        }
      }
    },
    
    initializeCrewMatrix() {
      this.crewMatrix = [];
      for (let i = 0; i < this.departments.length; i++) {
        this.crewMatrix.push(new Array(this.months.length).fill(0));
      }
    },
    
    // Get the full month name with year
    getMonthName(index) {
      return this.months[index] || '';
    },
    
    // Get just the month name for the header
    getMonthNameOnly(index) {
      const monthIndex = index % 12;
      return this.monthsPerYear[monthIndex];
    },
    
    // Get the short month name (3 letters)
    getShortMonthName(index) {
      const monthIndex = index % 12;
      return this.shortMonthNames[monthIndex];
    },
    
    // Get single letter month name
    getSingleLetterMonth(index) {
      const monthIndex = index % 12;
      return this.singleLetterMonths[monthIndex];
    },
    
    // Get the number of months in a year (for colspan)
    getMonthsInYear(year) {
      return this.months.filter(month => month.endsWith(year.toString())).length;
    },
    
    // Get cell style based on zoom level
    getCellStyle() {
      // Using CSS variables for sizing
      return {
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      };
    },
    
    // Get style for the department column (fixed width)
    getDepartmentColumnStyle() {
      return {
        minWidth: '200px',
        width: '200px',
        maxWidth: '200px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      };
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
    
    // Format currency in a compact way based on zoom level
    formatCompactCurrency(value) {
      // Handle zero values
      if (value === 0) {
        return '$0';
      }
      
      if (this.zoomLevel < 0.7) {
        // Very compact format for small zoom levels
        if (value >= 1000000) {
          return '$' + (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
          return '$' + (value / 1000).toFixed(0) + 'k';
        } else {
          return '$' + value;
        }
      } else if (this.zoomLevel < 0.9) {
        // Somewhat compact format for medium zoom levels
        if (value >= 1000000) {
          return '$' + (value / 1000000).toFixed(1) + ' mil';
        } else if (value >= 1000) {
          return '$' + (value / 1000).toFixed(0) + 'k';
        } else {
          return '$' + value;
        }
      } else {
        // Full format for normal zoom
        return '$' + this.formatCurrency(value);
      }
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
    // Export data to CSV
    exportCSV() {
      // Create CSV header row
      let csvContent = "Department,";
      
      // Add month headers
      csvContent += this.months.join(",") + ",Rate\n";
      
      // Add data in the same order as displayed in the UI
      this.sortedItems.forEach(item => {
        if (item.type === 'phase') {
          // Add phase row
          const phase = this.phases[item.index];
          csvContent += phase.name + " (Phase),";
          
          // Add phase indicators for each month
          for (let i = 0; i < this.months.length; i++) {
            csvContent += this.isMonthInPhase(phase, i) ? "X," : ",";
          }
          
          // No rate for phases
          csvContent += "\n";
        } else {
          // Add department row
          const dept = this.departments[item.index];
          csvContent += dept.name + ",";
          
          // Add crew counts for each month
          for (let i = 0; i < this.months.length; i++) {
            csvContent += this.crewMatrix[item.index][i] + ",";
          }
          
          // Add rate
          csvContent += dept.rate + "\n";
        }
      });
      
      // Add empty row
      csvContent += "\n";
      
      // Add monthly costs
      csvContent += "Monthly Cost,";
      for (let i = 0; i < this.monthlyCosts.length; i++) {
        csvContent += this.monthlyCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add cumulative costs
      csvContent += "Cumulative Cost,";
      for (let i = 0; i < this.cumulativeCosts.length; i++) {
        csvContent += this.cumulativeCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add summary stats
      csvContent += "\nTotal Project Cost," + this.totalProjectCost + "\n";
      csvContent += "Peak Monthly Cost," + this.peakMonthlyCost + "\n";
      csvContent += "Peak Crew Size," + this.peakCrewSize + "\n";
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "crew_planning_data.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    // Generate months based on years
    generateMonths() {
      // Clear existing months
      this.months = [];
      
      // Generate all months across years
      this.years.forEach(year => {
        this.monthsPerYear.forEach(month => {
          this.months.push(`${month} ${year}`);
        });
      });
    },
    
    // Edit year
    editYear(index) {
      const currentYear = this.years[index];
      const newYear = prompt(`Edit year (currently ${currentYear}):`, currentYear);
      
      if (newYear && !isNaN(newYear) && newYear.trim() !== '') {
        // Update the year
        const yearValue = parseInt(newYear.trim());
        
        // Create a new array with the updated year
        const updatedYears = [...this.years];
        updatedYears[index] = yearValue;
        this.years = updatedYears;
        
        // Regenerate months
        this.generateMonths();
        
        // Reinitialize crew matrix
        this.initializeCrewMatrix();
        
        // Recalculate
        this.updateAllDepartments();
        this.calculateCosts();
      }
    },
    
    // Zoom controls
    zoomIn() {
      if (this.zoomLevel < 2) {
        this.zoomLevel = Math.min(2, this.zoomLevel + 0.1);
        this.zoomLevel = Math.round(this.zoomLevel * 10) / 10; // Round to 1 decimal place
      }
    },
    zoomOut() {
      if (this.zoomLevel > 0.4) {
        this.zoomLevel = Math.max(0.4, this.zoomLevel - 0.1);
        this.zoomLevel = Math.round(this.zoomLevel * 10) / 10; // Round to 1 decimal place
      }
    },
    resetZoom() {
      this.zoomLevel = 1;
    },
    // Editor position and dragging
    resetEditorPosition() {
      this.editorPosition = this.editorPosition === 'position-left' ? 'position-right' : 'position-left';
      this.editorStyle = { top: '150px', left: '20px' };
    },
    
    startDrag(event, editorType) {
      // Only start drag if clicking on the header
      if (event.target.closest('.editor-header') && !event.target.closest('button')) {
        this.isDragging = true;
        this.activeEditor = editorType;
        
        const editor = this.$refs[editorType + 'Editor'];
        const rect = editor.getBoundingClientRect();
        
        this.dragOffset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        
        // Add event listeners for drag and drop
        document.addEventListener('mousemove', this.onDrag);
        document.addEventListener('mouseup', this.stopDrag);
        
        // Prevent text selection during drag
        event.preventDefault();
      }
    },
    
    onDrag(event) {
      if (this.isDragging) {
        // Calculate new position
        const left = event.clientX - this.dragOffset.x;
        const top = event.clientY - this.dragOffset.y;
        
        // Update editor position
        this.editorStyle = {
          left: left + 'px',
          top: top + 'px'
        };
      }
    },
    
    stopDrag() {
      this.isDragging = false;
      this.activeEditor = null;
      
      // Remove event listeners
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
    },
    // Drag and drop functionality
    dragStart(event, type, index) {
      this.draggedItem = { type, index };
      event.dataTransfer.effectAllowed = 'move';
    },
    handleDrop(event, type, targetIndex) {
      if (!this.draggedItem) return;
      
      const { type: sourceType, index: sourceIndex } = this.draggedItem;
      
      if (sourceIndex === targetIndex) return;
      
      if (type === 'mixed') {
        // Reorder in the mixed itemOrder array
        const item = this.itemOrder.splice(sourceIndex, 1)[0];
        this.itemOrder.splice(targetIndex, 0, item);
        
        // No need to update the actual arrays, just their display order
      } else if (type === 'department') {
        // Legacy code for direct department reordering
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
        
        // Reinitialize item order
        this.initializeItemOrder();
      } else if (type === 'phase') {
        // Legacy code for direct phase reordering
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
        
        // Reinitialize item order
        this.initializeItemOrder();
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
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
.app-container {
  font-family: Arial, sans-serif;
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  margin: 0 auto;
  padding: 10px;
  padding-bottom: 20px; /* Extra padding at the bottom */
  position: relative;
  overflow: hidden; /* Prevent scrolling at the page level */
  display: flex;
  flex-direction: column;
}

header {
  text-align: center;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

header h1 {
  font-size: 1.5rem;
  margin: 10px 0;
}

.visualization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.visualization-header h2 {
  margin: 0;
  flex-shrink: 0;
  font-size: 1.2rem;
}

.summary-header {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 20px;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
  margin-left: 20px;
}

main {
  display: flex;
  position: relative;
  flex: 1;
  overflow: hidden;
}

.visualization {
  flex: 1;
  background-color: #f5f5f5;
  padding: 10px;
  padding-right: 20px; /* Extra padding on the right */
  border-radius: 8px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
}

.action-button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
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
  gap: 3px;
  margin-left: auto;
}

.zoom-button {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
}

.zoom-button.reset {
  width: auto;
  padding: 0 6px;
  font-size: 0.75rem;
}

.export-button {
  margin-left: 10px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 0.75rem;
  cursor: pointer;
}

.export-button:hover {
  background-color: #0b7dda;
}

.table-container {
  position: relative;
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  height: calc(100% - 80px); /* Adjust to fit within the visualization container */
  min-height: 500px; /* Ensure minimum height */
  border: 1px solid #ddd;
  transition: all 0.3s ease;
}

/* Container for the scrollable part of the table */
.table-scroll-container {
  overflow: auto;
  height: 100%;
  width: 100%;
}

.table-wrapper {
  position: relative;
  padding-bottom: 100px; /* Reduced padding at the bottom */
  padding-right: 50px; /* Add padding on the right side */
}

.bottom-spacer {
  height: 100px; /* Reduced extra space at the bottom */
  width: 100%;
}

.crew-table {
  width: auto;
  border-collapse: collapse;
  font-size: var(--font-size);
  table-layout: fixed;
  transition: all 0.3s ease;
  margin-bottom: 50px; /* Reduced extra space at the bottom for scrolling */
}



.crew-table th, .crew-table td {
  border: 1px solid #ddd;
  padding: var(--cell-padding);
  text-align: center;
  width: var(--cell-width);
  height: var(--cell-height);
  transition: all 0.3s ease;
}

.crew-table th {
  background-color: #4CAF50;
  color: white;
  z-index: 1;
}

/* Fixed header styles */
.crew-table thead th {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #4CAF50;
}

.crew-table thead tr:first-child th {
  top: 0;
  z-index: 21;
}

.crew-table thead tr:nth-child(2) th {
  top: var(--cell-height);
  z-index: 20;
}

.fixed-column-header {
  position: sticky;
  left: 0;
  z-index: 30;
  background-color: #388E3C !important;
}

/* Fixed column styles */
.fixed-column {
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: #f9f9f9;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
  text-align: left;
  padding-left: 10px;
}

.year-row th {
  background-color: #388E3C;
  z-index: 2;
}

.year-header {
  font-weight: bold;
  text-align: center;
  border-bottom: 2px solid #2E7D32;
}

.editable-year {
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
}

.editable-year:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.month-header {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
}

/* Table styles */
.header-table, .column-table, .main-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.header-table {
  width: max-content; /* Match the main table width */
}

.main-table {
  margin-top: 0;
  width: max-content; /* Allow the table to be as wide as needed */
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

.non-editable {
  cursor: default !important;
  pointer-events: none;
}

.non-editable td {
  cursor: help;
  pointer-events: auto;
}

.summary {
  background-color: #fff;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
  min-height: 120px;
}

.summary h3 {
  text-align: center;
  margin-top: 0;
  color: #2E7D32;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.summary-stat {
  text-align: center;
  padding: 5px 10px;
  min-width: 150px;
}

.stat-label {
  font-weight: bold;
  color: #555;
  margin-bottom: 3px;
  font-size: 0.85em;
}

.stat-value {
  font-size: 1.1em;
  color: #2196F3;
  font-weight: bold;
}

/* Phase styling */
.phase-row {
  background-color: #f0f7ff; /* Light blue background */
  cursor: pointer;
}

.phase-label {
  font-weight: bold;
  color: #0d47a1;
  font-style: italic;
  background-color: #e1f0ff; /* Slightly darker blue for the phase label */
  border-left: 3px solid #2196F3;
}

.phase-active {
  background-color: rgba(33, 150, 243, 0.3); /* More visible blue for active phases */
}

/* Selected row styling */
.selected-row {
  background-color: #e3f2fd !important;
  cursor: pointer;
}

.selected-row td {
  border-top: 2px solid #2196F3;
  border-bottom: 2px solid #2196F3;
}

.selected-row td.fixed-column {
  background-color: #bbdefb !important;
  font-weight: bold;
  color: #0d47a1;
  box-shadow: 2px 0 5px rgba(33, 150, 243, 0.4);
  border-left: 3px solid #2196F3;
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
  z-index: 100;
  max-height: 80vh;
  overflow-y: auto;
  cursor: move;
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
  cursor: grab;
}

.editor-controls {
  display: flex;
  gap: 10px;
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-button, .reset-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #555;
  width: 30px;
  height: 30px;
  border-radius: 4px;
}

.close-button:hover, .reset-button:hover {
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