<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Crew Planning Tool</v-app-bar-title>
    </v-app-bar>
    
    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4">Loading initialization data...</div>
    </div>
    
    <v-main :style="{
      '--cell-width': 60 * zoomLevel + 'px',
      '--cell-height': 40 * zoomLevel + 'px',
      '--cell-padding': 8 * zoomLevel + 'px',
      '--font-size': 14 * zoomLevel + 'px',
      '--header-height': 80 * zoomLevel + 'px'
    }">
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card class="pa-2">
              <v-card-text class="py-2">
                <v-row dense align="center">
                  <!-- Stats Section -->
                  <v-col cols="12" md="4" class="py-0">
                    <div class="d-flex align-center">
                      <div class="text-subtitle-2 mr-2">Total Project Cost:</div>
                      <div class="text-h6 font-weight-bold text-primary">${{ formatCurrency(totalProjectCost).replace('$', '') }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="4" class="py-0">
                    <div class="d-flex align-center">
                      <div class="text-subtitle-2 mr-2">Peak Monthly Cost:</div>
                      <div class="text-h6 font-weight-bold text-primary">${{ formatCurrency(peakMonthlyCost).replace('$', '') }}</div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="4" class="py-0">
                    <div class="d-flex align-center">
                      <div class="text-subtitle-2 mr-2">Peak Crew Size:</div>
                      <div class="text-h6 font-weight-bold text-primary">{{ peakCrewSize }} crew members</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <v-row class="mt-2">
          <v-col cols="12">
            <v-card class="pa-2">
              <v-card-text class="py-2">
                <v-row dense align="center">
                  <!-- Department Controls -->
                  <v-col cols="12" md="4" class="py-0">
                    <div class="d-flex align-center">
                      <v-btn-group class="mr-2">
                        <v-btn color="primary" prepend-icon="mdi-plus" @click="addNewDepartment" size="small" density="compact">Dept</v-btn>
                        <v-btn color="secondary" prepend-icon="mdi-plus" @click="addNewPhase" size="small" density="compact">Phase</v-btn>
                      </v-btn-group>
                      
                      <v-divider vertical class="mx-2" style="height: 24px;"></v-divider>
                      
                      <v-btn-group class="mr-2">
                        <v-btn color="info" prepend-icon="mdi-office-building" @click="toggleFacilitiesEditor" size="small" density="compact">Facilities</v-btn>
                        <v-btn color="success" prepend-icon="mdi-laptop" @click="toggleWorkstationEditor" size="small" density="compact">Hardware</v-btn>
                      </v-btn-group>
                    </div>
                  </v-col>
                  
                  <!-- Checkboxes -->
                  <v-col cols="12" md="2" class="py-0">
                    <div class="d-flex align-center">
                      <v-checkbox
                        v-model="facilitiesIncludedInTotals"
                        @update:model-value="calculateCosts"
                        label="Facilities"
                        hide-details
                        density="compact"
                        class="mr-2"
                      ></v-checkbox>
                      
                      <v-checkbox
                        v-model="workstationsIncludedInTotals"
                        @update:model-value="calculateCosts"
                        label="Hardware"
                        hide-details
                        density="compact"
                      ></v-checkbox>
                    </div>
                  </v-col>
                  
                  <!-- Export Controls -->
                  <v-col cols="12" md="3" class="py-0">
                    <div class="d-flex align-center">
                      <v-btn-group class="mr-4">
                        <FileUploader @file-loaded="loadCSV" />
                      </v-btn-group>
                      
                      <v-btn-group class="mr-4">
                        <v-btn color="primary" prepend-icon="mdi-folder-open" size="small" height="32px" @click="$refs.jsonFileInput.click()">
                          Load
                        </v-btn>
                        <v-btn color="primary" prepend-icon="mdi-content-save" size="small" height="32px" @click="exportProjectJSON">
                          Save
                        </v-btn>
                      </v-btn-group>
                      <input type="file" ref="jsonFileInput" accept=".json" @change="importProjectJSON" style="display: none;">
                      
                      <v-btn-group>
                        <v-btn 
                          color="primary" 
                          prepend-icon="mdi-microsoft-excel" 
                          size="small" 
                          height="32px"
                          @click="exportExcel"
                        >
                          Excel
                        </v-btn>
                      </v-btn-group>
                    </div>
                  </v-col>
                  
                  <!-- Zoom Controls -->
                  <v-col cols="12" md="3" class="py-0">
                    <div class="d-flex align-center">
                      <v-btn-group variant="outlined" class="mr-2">
                        <v-btn icon="mdi-minus" @click="zoomOut" title="Zoom Out" size="small" height="32px"></v-btn>
                        <v-btn disabled size="small" height="32px">{{ Math.round(zoomLevel * 100) }}%</v-btn>
                        <v-btn icon="mdi-plus" @click="zoomIn" title="Zoom In" size="small" height="32px"></v-btn>
                        <v-btn icon="mdi-refresh" @click="resetZoom" title="Reset Zoom" size="small" height="32px"></v-btn>
                      </v-btn-group>
                      
                      <v-select
                        v-model="numberOfYears"
                        @update:model-value="updateTimeScale"
                        :items="[
                          { title: '1 year', value: '1' },
                          { title: '2 years', value: '2' },
                          { title: '3 years', value: '3' },
                          { title: '4 years', value: '4' },
                          { title: '5 years', value: '5' },
                          { title: '6 years', value: '6' }
                        ]"
                        label="Years"
                        variant="outlined"
                        height="32px"
                        style="max-width: 100px;"
                      ></v-select>
                      
                      <v-btn variant="text" color="primary" href="/sample_crew_plan.csv" download class="ml-2" size="small" height="32px">
                        Sample
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Hidden original actions -->
        <div class="actions" style="display: none;">
          <div class="action-toolbar">
            <div class="toolbar-section" style="display: none;"></div>
            <div class="toolbar-section" style="display: none;">
              <button @click="exportProjectJSON" class="action-button json-button" title="Export Project as JSON">
                <span class="icon">📤</span> JSON
              </button>
              <label for="import-json" class="action-button json-button" title="Import Project from JSON">
                <span class="icon">📥</span> JSON
              </label>
              <input type="file" id="import-json" accept=".json" @change="importProjectJSON" style="display: none;">
              <button @click="exportCSV" class="action-button export-button" title="Export to CSV">
                <span class="icon">📄</span> CSV
              </button>
              <button @click="exportExcel" class="action-button excel-button" title="Export to Excel">
                <span class="icon">📊</span> Excel
              </button>
              <FileUploader @file-loaded="loadCSV" />
              <div class="divider"></div>
              <div class="zoom-controls">
                <button @click="zoomOut" class="zoom-button" title="Zoom Out">-</button>
                <span>{{ Math.round(zoomLevel * 100) }}%</span>
                <button @click="zoomIn" class="zoom-button" title="Zoom In">+</button>
                <button @click="resetZoom" class="zoom-button reset" title="Reset Zoom">Reset</button>
              </div>
              <div class="time-scale-control">
                <label>Years:</label>
                <select v-model="numberOfYears" @change="updateTimeScale">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
            </div>
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
                    <span @click="editYear(index)" class="editable-year">Year {{ year }}</span>
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
                        :style="{
                          ...getDepartmentColumnStyle(),
                          backgroundColor: phases[item.index] && phases[item.index].color ? phases[item.index].color + '40' : '#f9f9f9',
                          color: phases[item.index] && phases[item.index].color ? '#000' : 'inherit',
                          fontWeight: 'bold'
                        }"
                        @click="editPhase(item.index)">
                      <span class="drag-handle">:::</span>
                      {{ phases[item.index] ? phases[item.index].name : 'Loading...' }}
                    </td>
                    <td v-for="(month, mIndex) in months" :key="`phase-${item.index}-${mIndex}`"
                        :class="{
                          'phase-cell': true,
                          'in-range': phases[item.index] && mIndex >= phases[item.index].startMonth && mIndex <= phases[item.index].endMonth
                        }"
                        :style="{
                          ...getCellStyle(),
                          '--phase-color': phases[item.index] && phases[item.index].color ? phases[item.index].color : '#4CAF50',
                          backgroundColor: phases[item.index] && phases[item.index].color && mIndex >= phases[item.index].startMonth && mIndex <= phases[item.index].endMonth ? 
                            phases[item.index].color + '66' : 'transparent'
                        }"
                        @mousedown="handlePhaseMouseDown($event, item.index, mIndex)">
                      <div class="phase-content">
                        <div v-if="phases[item.index] && mIndex === phases[item.index].startMonth"
                             class="start-drag-handle"
                             title="Drag to adjust phase start month"></div>
                        <div v-if="phases[item.index] && mIndex === phases[item.index].endMonth"
                             class="end-drag-handle"
                             title="Drag to adjust phase end month"></div>
                      </div>
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
                      {{ departments[item.index] ? departments[item.index].name : 'Loading...' }}
                    </td>
                    <td v-for="(month, mIndex) in months" :key="`dept-${item.index}-${mIndex}`" 
                        :class="{ 
                          active: crewMatrix[item.index] && crewMatrix[item.index][mIndex] > 0,
                          'start-handle': departments[item.index] && typeof departments[item.index].startMonth === 'number' && mIndex === departments[item.index].startMonth,
                          'end-handle': departments[item.index] && typeof departments[item.index].endMonth === 'number' && mIndex === departments[item.index].endMonth,
                          'dept-cell': true,
                          'in-range': departments[item.index] && mIndex >= departments[item.index].startMonth && mIndex <= departments[item.index].endMonth
                        }"
                        :style="{ ...getCellStyle(), ...getDepartmentCellStyle(departments[item.index], item.index, mIndex) }"
                        @mousedown="handleCellMouseDown($event, item.index, mIndex)">
                      <div class="cell-content">
                        {{ crewMatrix[item.index][mIndex] > 0 ? crewMatrix[item.index][mIndex] : '' }}
                        <div v-if="departments[item.index] && mIndex === departments[item.index].startMonth" class="start-drag-handle" title="Drag to adjust start month"></div>
                        <div v-if="departments[item.index] && mIndex === departments[item.index].endMonth" class="end-drag-handle" title="Drag to adjust end month"></div>
                      </div>
                    </td>
                  </tr>
                </template>
                
                <!-- Cost rows -->
                <tr class="cost-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Labor Cost</strong></td>
                  <td v-for="(cost, index) in monthlyLaborCosts" :key="index" 
                      :class="{ active: cost > 0 }"
                      :style="getCellStyle()"
                      :title="'$' + formatCurrency(cost)">
                    {{ cost > 0 ? formatCompactCurrency(cost) : '' }}
                  </td>
                </tr>
                <tr class="cost-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Facility Cost</strong></td>
                  <td v-for="(cost, index) in monthlyFacilityCosts" :key="index" 
                      :class="{ active: cost > 0 }"
                      :style="getCellStyle()"
                      :title="'$' + formatCurrency(cost)">
                    {{ cost > 0 ? formatCompactCurrency(cost) : '' }}
                  </td>
                </tr>
                <tr class="cost-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Workstation Cost</strong></td>
                  <td v-for="(cost, index) in monthlyWorkstationCosts" :key="index" 
                      :class="{ active: cost > 0 }"
                      :style="getCellStyle()"
                      :title="'$' + formatCurrency(cost)">
                    {{ cost > 0 ? formatCompactCurrency(cost) : '' }}
                  </td>
                </tr>
                <tr class="cost-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Backend Cost</strong></td>
                  <td v-for="(cost, index) in monthlyBackendCosts" :key="index" 
                      :class="{ active: cost > 0 }"
                      :style="getCellStyle()"
                      :title="'$' + formatCurrency(cost)">
                    {{ cost > 0 ? formatCompactCurrency(cost) : '' }}
                  </td>
                </tr>
                <tr class="cost-row non-editable">
                  <td class="fixed-column" :style="getDepartmentColumnStyle()"><strong>Total Monthly Cost</strong></td>
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
              <!-- Removed bottom-spacer div to show more of the grid -->
            </div>
          </div>
        </div>
      </v-container>
      
      <!-- Floating Editor Panel -->
      <div v-if="selectedDepartmentIndex !== null" class="floating-editor department-editor draggable-panel"
           :class="editorPosition"
           :style="editorStyle"
           ref="departmentEditor"
           @mousedown="startDrag($event, 'department')">
        <v-card color="primary" class="draggable-card">
          <v-card-title class="d-flex justify-space-between align-center text-white">
            <span>Department Editor</span>
            <div>
              <v-btn icon="mdi-refresh" @click="resetEditorPosition" variant="text" color="white" density="compact"></v-btn>
              <v-btn icon="mdi-close" @click="closeDepartmentEditor" variant="text" color="white" density="compact"></v-btn>
            </div>
          </v-card-title>
          <v-card-text class="bg-white">
            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Department Name:</label>
              <v-text-field
                v-model="departments[selectedDepartmentIndex].name"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </div>

            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Max Crew Size:</label>
              <div class="d-flex align-center">
                <v-slider
                  v-model="departments[selectedDepartmentIndex].maxCrew"
                  @update:model-value="updateDepartmentCrew(departments[selectedDepartmentIndex])"
                  min="0"
                  max="100"
                  hide-details
                  class="mr-2"
                ></v-slider>
                <v-text-field
                  v-model="departments[selectedDepartmentIndex].maxCrew"
                  type="number"
                  style="width: 70px"
                  density="compact"
                  hide-details
                  @input="updateDepartmentCrew(departments[selectedDepartmentIndex])"
                ></v-text-field>
              </div>
            </div>

            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Start Month: {{ getMonthName(departments[selectedDepartmentIndex].startMonth) }}</label>
              <v-slider
                v-model="departments[selectedDepartmentIndex].startMonth"
                @update:model-value="updateDepartmentTimeframe(departments[selectedDepartmentIndex])"
                min="0"
                :max="months.length - 1"
                hide-details
              ></v-slider>
            </div>

            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">End Month: {{ getMonthName(departments[selectedDepartmentIndex].endMonth) }}</label>
              <v-slider
                v-model="departments[selectedDepartmentIndex].endMonth"
                @update:model-value="updateDepartmentTimeframe(departments[selectedDepartmentIndex])"
                :min="departments[selectedDepartmentIndex].startMonth"
                :max="months.length - 1"
                hide-details
              ></v-slider>
            </div>

            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Ramp Up Duration (months): {{ departments[selectedDepartmentIndex].rampUpDuration }}</label>
              <v-slider
                v-model="departments[selectedDepartmentIndex].rampUpDuration"
                @update:model-value="updateDepartmentRamp(departments[selectedDepartmentIndex])"
                min="0"
                :max="Math.max(1, Math.floor((departments[selectedDepartmentIndex].endMonth - departments[selectedDepartmentIndex].startMonth) / 2))"
                hide-details
              ></v-slider>
            </div>

            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Ramp Down Duration (months): {{ departments[selectedDepartmentIndex].rampDownDuration }}</label>
              <v-slider
                v-model="departments[selectedDepartmentIndex].rampDownDuration"
                @update:model-value="updateDepartmentRamp(departments[selectedDepartmentIndex])"
                min="0"
                :max="Math.max(1, Math.floor((departments[selectedDepartmentIndex].endMonth - departments[selectedDepartmentIndex].startMonth) / 2))"
                hide-details
              ></v-slider>
            </div>

            <div class="mb-4">
              <label class="text-subtitle-2 mb-1 d-block">Rate ($/month):</label>
              <v-text-field
                v-model="departments[selectedDepartmentIndex].rate"
                @update:model-value="calculateCosts"
                type="number"
                min="0"
                step="100"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </div>
          
            <div class="d-flex flex-column">
              <div class="d-flex mb-2">
                <v-btn color="primary" @click="moveDepartmentUp" :disabled="selectedDepartmentIndex === 0" class="mr-2" style="flex: 1;">
                  Move Up
                </v-btn>
                <v-btn color="primary" @click="moveDepartmentDown" :disabled="selectedDepartmentIndex === departments.length - 1" style="flex: 1;">
                  Move Down
                </v-btn>
              </div>
              <v-btn color="error" @click="removeDepartment" block>
                Remove Department
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Phase Editor Panel -->
                        <div v-if="selectedPhaseIndex !== null" class="floating-editor phase-editor draggable-panel"
           :class="editorPosition"
           :style="editorStyle"
           ref="phaseEditor"
           @mousedown="startDrag($event, 'phase')">
        <v-card color="secondary" class="draggable-card">
          <v-card-title class="d-flex justify-space-between align-center text-white">
            <span>Phase Editor</span>
            <div>
              <v-btn icon="mdi-refresh" @click="resetEditorPosition" variant="text" color="white" density="compact"></v-btn>
              <v-btn icon="mdi-close" @click="closePhaseEditor" variant="text" color="white" density="compact"></v-btn>
            </div>
          </v-card-title>
          <v-card-text class="bg-white">
            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Phase Name:</label>
              <v-text-field
                v-model="phases[selectedPhaseIndex].name"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </div>

            <div class="mb-3">
              <label class="text-subtitle-2 mb-1 d-block">Start Month: {{ getMonthName(phases[selectedPhaseIndex].startMonth) }}</label>
              <v-slider
                v-model="phases[selectedPhaseIndex].startMonth"
                min="0"
                :max="months.length - 1"
                hide-details
              ></v-slider>
            </div>

            <div class="mb-4">
              <label class="text-subtitle-2 mb-1 d-block">End Month: {{ getMonthName(phases[selectedPhaseIndex].endMonth) }}</label>
              <v-slider
                v-model="phases[selectedPhaseIndex].endMonth"
                :min="phases[selectedPhaseIndex].startMonth"
                :max="months.length - 1"
                hide-details
              ></v-slider>
            </div>
            <div class="mb-4">
              <label class="text-subtitle-2 mb-1 d-block">Phase Color:</label>
              <v-color-picker
                v-model="phases[selectedPhaseIndex].color"
                hide-inputs
                hide-canvas
                show-swatches
                swatches-max-height="100"
                mode="swatches"
                :swatches="[
                  ['#1976D2', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'],
                  ['#03A9F4', '#8BC34A', '#FFC107', '#E91E63', '#FF5722'],
                  ['#00BCD4', '#CDDC39', '#FFEB3B', '#673AB7', '#795548']
                ]"
              ></v-color-picker>
            </div>

            <div class="d-flex flex-column">
              <div class="d-flex mb-2">
                <v-btn color="secondary" @click="movePhaseUp" :disabled="selectedPhaseIndex === 0" class="mr-2" style="flex: 1;">
                  Move Up
                </v-btn>
                <v-btn color="secondary" @click="movePhaseDown" :disabled="selectedPhaseIndex === phases.length - 1" style="flex: 1;">
                  Move Down
                </v-btn>
              </div>
              <v-btn color="error" @click="removePhase" block>
                Remove Phase
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Facilities Cost Editor -->
      <div v-if="showFacilitiesEditor" class="floating-editor facilities-editor draggable-panel"
           :class="editorPosition"
           :style="editorStyle"
           ref="facilitiesEditor"
           @mousedown="startDrag($event, 'facilities')">
        <FacilitiesCostEditor
          :facilitiesData="facilitiesData"
          :departments="departments"
          :peakCrewSize="peakCrewSize"
          @close="showFacilitiesEditor = false"
          @reset-position="resetEditorPosition"
          @update-costs="calculateCosts"
        />
      </div>
      
      <!-- Workstation Editor -->
      <div v-if="showWorkstationEditor" class="floating-editor workstation-editor draggable-panel"
           :class="editorPosition"
           :style="editorStyle"
           ref="workstationEditor"
           @mousedown="startDrag($event, 'workstation')">
        <WorkstationEditor
          :workstationData="workstationData"
          :departments="departments"
          :months="months"
          @close="showWorkstationEditor = false"
          @reset-position="resetEditorPosition"
          @update-costs="calculateCosts"
        />
      </div>
    </v-main>
  </v-app>
</template>

<script>
import { parseCSV, generateCSV } from './csv-loader.js';
import { timelineDragHandlers } from './timeline-drag-handlers.js';
import { defaultPhaseColors, getPhaseColor, getDepartmentColor } from './phaseColors.js';
import { loadInitData } from './init-data-loader.js';
import { 
  facilitiesData, 
  calculateFacilityCostsForMonth, 
  calculateTotalFixedFacilityCosts, 
  calculateTotalVariableFacilityCostsPerPerson 
} from './facilities-data.js';
import { 
  workstationData,
  calculateMonthlyWorkstationCosts,
  calculateMonthlyBackendInfrastructureCosts,
  initializeDepartmentAssignments
} from './workstation-data.js';
import {
  exportProjectAsJSON,
  importProjectFromJSON,
  generateFacilitiesCSV,
  generateWorkstationsCSV,
  createProjectData,
  applyProjectData
} from './project-export.js';
import { exportToMultipleCSV } from './export-csv.js';
import { exportToExcel } from './export-excel.js';
import FileUploader from './components/FileUploader.vue';
import FacilitiesCostEditor from './components/FacilitiesCostEditor.vue';
import WorkstationEditor from './components/WorkstationEditor.vue';

export default {
  components: {
    FileUploader,
    FacilitiesCostEditor,
    WorkstationEditor
  },
  data() {
    return {
      draggedPhaseIndex: null, // For phase drag handles
      years: [],
      monthsPerYear: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      shortMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      singleLetterMonths: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      months: [],
      departments: [],
      phases: [],
      crewMatrix: [],
      selectedDepartmentIndex: null,
      selectedPhaseIndex: null,
      zoomLevel: 1.0, // Start at 100% zoom
      numberOfYears: 4, // Default number of years
      // For timeline drag handles
      isDraggingTimelineHandle: false,
      draggedDepartmentIndex: null,
      dragHandleType: null, // 'start' or 'end'
      editorPosition: 'position-left',
      draggedItem: null,
      editorStyle: { top: '150px', left: '20px' },
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      activeEditor: null,
      // Track the order of phases and departments
      itemOrder: [],
      monthlyCosts: [],
      cumulativeCosts: [],
      totalProjectCost: 0,
      peakMonthlyCost: 0,
      peakCrewSize: 0,
      facilitiesData: JSON.parse(JSON.stringify(facilitiesData)),
      showFacilitiesEditor: false,
      monthlyFacilityCosts: [],
      monthlyLaborCosts: [],
      facilitiesIncludedInTotals: true,
      workstationData: JSON.parse(JSON.stringify(workstationData)),
      showWorkstationEditor: false,
      monthlyWorkstationCosts: [],
      monthlyBackendCosts: [],
      workstationsIncludedInTotals: true,
      backendIncludedInTotals: true,
      isLoading: true // Flag to track loading state
    };
  },
  async created() {
    console.log("App created, loading initialization data");
    this.isLoading = true;
    
    try {
      // Load initialization data from JSON file
      const initData = await loadInitData();
      
      // Apply the loaded data
      this.years = initData.years;
      this.months = initData.months;
      this.phases = initData.phases;
      this.departments = initData.departments;
      this.crewMatrix = initData.crewMatrix;
      this.itemOrder = initData.itemOrder;
      this.facilitiesData = initData.facilitiesData;
      this.workstationData = initData.workstationData;
      this.facilitiesIncludedInTotals = initData.facilitiesIncludedInTotals;
      this.workstationsIncludedInTotals = initData.workstationsIncludedInTotals;
      this.backendIncludedInTotals = initData.backendIncludedInTotals;
      
      console.log("Initialization data loaded successfully");
    } catch (error) {
      console.error("Error loading initialization data:", error);
      
      // Generate months with the current time scale as fallback
      this.generateMonthsWithTimeScale();
      
      // Make sure crewMatrix is initialized
      if (!this.crewMatrix || this.crewMatrix.length === 0) {
        this.initializeCrewMatrix();
        
        // Update crew distribution for all departments
        for (let i = 0; i < this.departments.length; i++) {
          this.updateDepartmentDistribution(i);
        }
      }
      
      // Initialize item order if needed
      if (!this.itemOrder || this.itemOrder.length === 0) {
        this.initializeItemOrder();
      }
    }
    
    // Initialize workstation department assignments if they're empty
    if (!this.workstationData.departmentAssignments || this.workstationData.departmentAssignments.length === 0) {
      initializeDepartmentAssignments(this.workstationData, this.departments);
    }
    
    // Ensure all numeric properties in departments and phases are stored as numbers
    this.ensureNumericProperties();
    
    // Calculate costs
    this.calculateCosts();
    
    this.isLoading = false;
  },
  
  computed: {
    // Get the sorted items (phases and departments) based on itemOrder
    sortedItems() {
      return this.itemOrder;
    }
  },
  methods: {
    // Get the phase for a department based on its position in the sortedItems array
    getDepartmentPhase(departmentIndex) {
      // Find the department's position in the sortedItems array
      const departmentPosition = this.sortedItems.findIndex(
        item => item.type === 'department' && item.index === departmentIndex
      );
      
      if (departmentPosition === -1) return null;
      
      // Find the nearest phase above this department
      let nearestPhaseIndex = null;
      for (let i = departmentPosition - 1; i >= 0; i--) {
        if (this.sortedItems[i].type === 'phase') {
          nearestPhaseIndex = this.sortedItems[i].index;
          break;
        }
      }
      
      return nearestPhaseIndex !== null ? this.phases[nearestPhaseIndex] : null;
    },
    
    // Get the background color for a department cell based on its phase
    getDepartmentCellStyle(department, departmentIndex, mIndex) {
      if (!department || mIndex < department.startMonth || mIndex > department.endMonth) {
        return {};
      }
      
      // Find the phase for this department based on its position
      const phase = this.getDepartmentPhase(departmentIndex);
      if (!phase || !phase.color) return {};
      
      return {
        backgroundColor: phase.color + '33' // 20% opacity
      };
    },
    // Get the color for a department based on its phase with opacity
    ensureNumericProperties() {
      console.log('Ensuring all numeric properties in departments and phases are stored as numbers...');
      
      // Ensure numeric properties for departments
      for (let i = 0; i < this.departments.length; i++) {
        const department = this.departments[i];
        
        // Convert string values to numbers for numeric properties
        if (department.startMonth !== undefined && typeof department.startMonth === 'string') {
          department.startMonth = Number(department.startMonth);
          console.log(`Converted startMonth to number for department ${department.name}`);
        }
        
        if (department.endMonth !== undefined && typeof department.endMonth === 'string') {
          department.endMonth = Number(department.endMonth);
          console.log(`Converted endMonth to number for department ${department.name}`);
        }
        
        if (department.rampUpDuration !== undefined && typeof department.rampUpDuration === 'string') {
          department.rampUpDuration = Number(department.rampUpDuration);
          console.log(`Converted rampUpDuration to number for department ${department.name}`);
        }
        
        if (department.rampDownDuration !== undefined && typeof department.rampDownDuration === 'string') {
          department.rampDownDuration = Number(department.rampDownDuration);
          console.log(`Converted rampDownDuration to number for department ${department.name}`);
        }
        
        if (department.maxCrew !== undefined && typeof department.maxCrew === 'string') {
          department.maxCrew = Number(department.maxCrew);
          console.log(`Converted maxCrew to number for department ${department.name}`);
        }
        
        if (department.rate !== undefined && typeof department.rate === 'string') {
          department.rate = Number(department.rate);
          console.log(`Converted rate to number for department ${department.name}`);
        }
      }
      
      // Also ensure numeric properties for phases
      for (let i = 0; i < this.phases.length; i++) {
        const phase = this.phases[i];
        
        // Convert string values to numbers for numeric properties
        if (phase.startMonth !== undefined && typeof phase.startMonth === 'string') {
          phase.startMonth = Number(phase.startMonth);
          console.log(`Converted startMonth to number for phase ${phase.name}`);
        }
        
        if (phase.endMonth !== undefined && typeof phase.endMonth === 'string') {
          phase.endMonth = Number(phase.endMonth);
          console.log(`Converted endMonth to number for phase ${phase.name}`);
        }
        
        // Ensure phase has a color property
        if (!phase.color) {
          // Default colors based on index
          const defaultColors = [
            '#1976D2', // Blue
            '#4CAF50', // Green
            '#FF9800', // Orange
            '#9C27B0', // Purple
            '#F44336', // Red
            '#00BCD4', // Cyan
            '#FFEB3B', // Yellow
            '#795548', // Brown
            '#607D8B', // Blue Grey
            '#E91E63'  // Pink
          ];
          phase.color = defaultColors[i % defaultColors.length];
          console.log(`Added default color ${phase.color} to phase ${phase.name}`);
        }
        
        if (phase.endMonth !== undefined && typeof phase.endMonth === 'string') {
          phase.endMonth = Number(phase.endMonth);
          console.log(`Converted endMonth to number for phase ${phase.name}`);
        }
      }
    },
    // Handle mouse down on a phase cell
    handlePhaseMouseDown(event, phaseIndex, monthIndex) {
      // Check if we're clicking on a drag handle
      const target = event.target;
      if (target.classList.contains('start-drag-handle')) {
        this.isDraggingTimelineHandle = true;
        this.draggedPhaseIndex = phaseIndex;
        this.dragHandleType = 'start';
        
        // Add event listeners for drag
        document.addEventListener('mousemove', this.handlePhaseMouseMove);
        document.addEventListener('mouseup', this.handlePhaseMouseUp);
        
        // Prevent default to avoid text selection
        event.preventDefault();
      } else if (target.classList.contains('end-drag-handle')) {
        this.isDraggingTimelineHandle = true;
        this.draggedPhaseIndex = phaseIndex;
        this.dragHandleType = 'end';
        
        // Add event listeners for drag
        document.addEventListener('mousemove', this.handlePhaseMouseMove);
        document.addEventListener('mouseup', this.handlePhaseMouseUp);
        
        // Prevent default to avoid text selection
        event.preventDefault();
      }
    },
    
    // Handle mouse move during phase drag
    handlePhaseMouseMove(event) {
      if (!this.isDraggingTimelineHandle) return;
      
      // Get the table element
      const table = document.querySelector('.crew-table');
      if (!table) return;
      
      // Get the cell under the mouse
      const cellUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
      if (!cellUnderMouse) return;
      
      // Find the closest td element
      let tdElement = cellUnderMouse.closest('td');
      if (!tdElement) return;
      
      // Skip if it's a fixed column
      if (tdElement.classList.contains('fixed-column')) return;
      
      // Find the month index from the cell
      const monthIndex = Array.from(tdElement.parentElement.children).indexOf(tdElement) - 1; // -1 to account for the fixed column
      if (monthIndex < 0 || monthIndex >= this.months.length) return;
      
      console.log(`Dragging phase ${this.dragHandleType} handle to month ${monthIndex} (${this.months[monthIndex]})`);
      
      // Get the phase being dragged
      const phase = this.phases[this.draggedPhaseIndex];
      console.log(`Phase: ${phase.name}, current startMonth: ${phase.startMonth}, endMonth: ${phase.endMonth}`);
      
      if (this.dragHandleType === 'start') {
        // Don't allow start month to go beyond end month
        if (monthIndex <= phase.endMonth) {
          // Update the start month
          phase.startMonth = monthIndex;
        }
      } else if (this.dragHandleType === 'end') {
        // Don't allow end month to go before start month
        if (monthIndex >= phase.startMonth) {
          // Update the end month
          phase.endMonth = monthIndex;
        }
      }
    },
    
    // Handle mouse up to end phase dragging
    handlePhaseMouseUp() {
      if (this.isDraggingTimelineHandle) {
        // Reset drag state
        this.isDraggingTimelineHandle = false;
        this.draggedPhaseIndex = null;
        this.dragHandleType = null;
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.handlePhaseMouseMove);
        document.removeEventListener('mouseup', this.handlePhaseMouseUp);
      }
    },
    // Timeline drag handlers
    ...timelineDragHandlers,
    // Initialize the item order with phases first, then departments
    initializeItemOrder() {
      this.itemOrder = [];
      
      // Sort phases by their original index if available
      const sortedPhases = [...this.phases].map((phase, index) => ({ phase, index }))
        .sort((a, b) => {
          // If both phases have originalIndex, use that
          if (a.phase.originalIndex !== undefined && b.phase.originalIndex !== undefined) {
            return a.phase.originalIndex - b.phase.originalIndex;
          }
          // Otherwise, use the current index
          return a.index - b.index;
        });
      
      console.log('Phases sorted by original index:', sortedPhases.map(p => `${p.phase.name} (${p.phase.originalIndex !== undefined ? p.phase.originalIndex : 'undefined'})`));
      
      // Add phases in their original order
      for (const { index: i } of sortedPhases) {
        this.itemOrder.push({ type: 'phase', index: i });
        console.log(`Added phase: ${this.phases[i].name}`);
        
        // Add departments that belong to this phase
        const departmentsInPhase = [];
        for (let j = 0; j < this.departments.length; j++) {
          // Simple heuristic: if department's start month is within phase's timeframe
          const dept = this.departments[j];
          const phase = this.phases[i];
          
          if (dept.phase === i || (dept.startMonth >= phase.startMonth && dept.startMonth <= phase.endMonth)) {
            // Check if this department is already added
            const alreadyAdded = this.itemOrder.some(item => 
              item.type === 'department' && item.index === j
            );
            
            if (!alreadyAdded) {
              departmentsInPhase.push({ index: j, startMonth: dept.startMonth });
            }
          }
        }
        
        // Sort departments within this phase by start month
        departmentsInPhase.sort((a, b) => a.startMonth - b.startMonth);
        
        // Add sorted departments to the item order
        for (const { index } of departmentsInPhase) {
          this.itemOrder.push({ type: 'department', index });
          console.log(`  Added department: ${this.departments[index].name}`);
        }
      }
      
      // Add any remaining departments that weren't assigned to a phase
      for (let j = 0; j < this.departments.length; j++) {
        const alreadyAdded = this.itemOrder.some(item => 
          item.type === 'department' && item.index === j
        );
        
        if (!alreadyAdded) {
          this.itemOrder.push({ type: 'department', index: j });
          console.log(`Added unassigned department: ${this.departments[j].name}`);
        }
      }
      
      console.log('Initialized item order with', this.itemOrder.length, 'items');
    },
    
    initializeCrewMatrix() {
      console.log('Initializing crew matrix for departments:', this.departments.length, 'months:', this.months.length);
      this.crewMatrix = [];
      for (let i = 0; i < this.departments.length; i++) {
        this.crewMatrix.push(new Array(this.months.length).fill(0));
      }
      console.log('Crew matrix initialized with dimensions:', this.crewMatrix.length, 
        this.crewMatrix.length > 0 ? this.crewMatrix[0].length : 0);
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
      console.log(`Updating crew for department: ${department.name}, maxCrew: ${department.maxCrew}`);
      
      // Validate maxCrew
      if (isNaN(department.maxCrew) || department.maxCrew < 0 || department.maxCrew > 1000) {
        console.error(`Invalid maxCrew for ${department.name}: ${department.maxCrew}`);
        department.maxCrew = Math.min(Math.max(0, department.maxCrew || 0), 1000);
        console.log(`Adjusted maxCrew to ${department.maxCrew}`);
      }
      
      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
    },

    updateDepartmentTimeframe(department) {
      console.log(`Updating timeframe for department: ${department.name}, startMonth: ${department.startMonth}, endMonth: ${department.endMonth}`);

      // Ensure end month is after start month
      if (department.endMonth <= department.startMonth) {
        department.endMonth = department.startMonth + 1;
        console.log(`Adjusted endMonth to ${department.endMonth}`);
      }

      // Calculate the total timeframe duration
      const timeframeDuration = department.endMonth - department.startMonth + 1;
      console.log(`Timeframe duration: ${timeframeDuration} months`);

      // Ensure there's at least 1 month for the plateau
      const totalRampDuration = department.rampUpDuration + department.rampDownDuration;
      if (totalRampDuration >= timeframeDuration) {
        // Calculate the maximum allowed total ramp duration
        const maxTotalRamp = timeframeDuration - 1;
        
        // If both ramps are non-zero, adjust them proportionally
        if (department.rampUpDuration > 0 && department.rampDownDuration > 0) {
          // Calculate the proportion of each ramp to the total
          const upRatio = department.rampUpDuration / totalRampDuration;
          const downRatio = department.rampDownDuration / totalRampDuration;
          
          // Apply the ratios to the maximum allowed total
          department.rampUpDuration = Math.max(1, Math.floor(maxTotalRamp * upRatio));
          department.rampDownDuration = Math.max(1, Math.floor(maxTotalRamp * downRatio));
          
          // Ensure the sum doesn't exceed the max
          if (department.rampUpDuration + department.rampDownDuration > maxTotalRamp) {
            // Reduce the larger one
            if (department.rampUpDuration > department.rampDownDuration) {
              department.rampUpDuration = maxTotalRamp - department.rampDownDuration;
            } else {
              department.rampDownDuration = maxTotalRamp - department.rampUpDuration;
            }
          }
        } else if (department.rampUpDuration > 0) {
          // Only ramp up is non-zero
          department.rampUpDuration = maxTotalRamp;
        } else if (department.rampDownDuration > 0) {
          // Only ramp down is non-zero
          department.rampDownDuration = maxTotalRamp;
        }
        
        console.log(`Adjusted ramps: up=${department.rampUpDuration}, down=${department.rampDownDuration}`);
      }

      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
    },
    // Update only the visual representation of a department during drag
    updateDepartmentVisualOnly(department) {
      console.log(`Updating visual only for department: ${department.name}`);
      
      // Find the department index
      const dIndex = this.departments.indexOf(department);
      if (dIndex === -1) return;
      
      // Clear the crew matrix for this department
      if (!this.crewMatrix[dIndex]) {
        this.crewMatrix[dIndex] = new Array(this.months.length).fill(0);
      } else {
        this.crewMatrix[dIndex].fill(0);
      }
      
      // Fill in the crew matrix with the max crew value for the active months
      for (let m = department.startMonth; m <= department.endMonth; m++) {
        if (m >= 0 && m < this.months.length) {
          this.crewMatrix[dIndex][m] = department.maxCrew;
        }
      }
    },
    
    // Calculate a ramp value ensuring it's at least 1 if maxCrew > 0
    calculateRampValue(currentStep, totalSteps, maxValue) {
      if (maxValue <= 0) return 0;
      if (totalSteps <= 0) return maxValue;
      
      const rampFactor = currentStep / totalSteps;
      return Math.max(1, Math.round(maxValue * rampFactor));
    },
    updateAllDepartments() {
      console.log('Updating all departments, count:', this.departments.length);
      this.initializeCrewMatrix();
      console.log('Initialized crew matrix:', this.crewMatrix.length, 
        this.crewMatrix.length > 0 ? this.crewMatrix[0].length : 0);
      
      for (let i = 0; i < this.departments.length; i++) {
        console.log('Updating department distribution for:', this.departments[i].name);
        this.updateDepartmentDistribution(i);
      }
      
      console.log('Final crew matrix after updates:', this.crewMatrix);
    },
    updateDepartmentDistribution(dIndex) {
      console.log(`Updating department distribution for index ${dIndex}`);
      
      // Validate department index
      if (dIndex < 0 || dIndex >= this.departments.length) {
        console.error(`Invalid department index: ${dIndex}`);
        return;
      }
      
      const department = this.departments[dIndex];
      console.log(`Department: ${department.name}`);
      
      // Validate department properties
      if (!department) {
        console.error(`Department at index ${dIndex} is undefined`);
        return;
      }
      
      // Ensure maxCrew is reasonable
      if (isNaN(department.maxCrew) || department.maxCrew < 0 || department.maxCrew > 1000) {
        console.error(`Invalid maxCrew for ${department.name}: ${department.maxCrew}`);
        department.maxCrew = Math.min(Math.max(0, department.maxCrew || 0), 1000);
        console.log(`Adjusted maxCrew to ${department.maxCrew}`);
      }
      
      // Extract department properties
      const { startMonth, endMonth, maxCrew, rampUpDuration, rampDownDuration } = department;
      console.log(`Parameters: startMonth=${startMonth}, endMonth=${endMonth}, maxCrew=${maxCrew}, rampUp=${rampUpDuration}, rampDown=${rampDownDuration}`);
      
      // Validate crew matrix
      if (!this.crewMatrix[dIndex]) {
        console.error(`Crew matrix row for department ${dIndex} is undefined`);
        this.crewMatrix[dIndex] = new Array(this.months.length).fill(0);
      }
      
      // Clear previous values
      this.crewMatrix[dIndex].fill(0);
      
      // Calculate the plateau duration (full crew period)
      const totalDuration = endMonth - startMonth + 1;
      const plateauStart = startMonth + rampUpDuration;
      const plateauEnd = endMonth - rampDownDuration;
      console.log(`Plateau: start=${plateauStart}, end=${plateauEnd}`);
      
      // Ensure the plateau is valid
      if (plateauStart > plateauEnd) {
        console.warn(`Invalid plateau: start=${plateauStart}, end=${plateauEnd}. Adjusting...`);
        // Adjust the plateau to ensure it's valid
        const midpoint = Math.floor((startMonth + endMonth) / 2);
        const plateauDuration = Math.max(1, totalDuration - rampUpDuration - rampDownDuration);
        const newPlateauStart = Math.min(midpoint, startMonth + rampUpDuration);
        const newPlateauEnd = Math.max(midpoint, endMonth - rampDownDuration);
        
        console.log(`Adjusted plateau: start=${newPlateauStart}, end=${newPlateauEnd}`);
        
        // Apply ramp up
        if (rampUpDuration > 0) {
          for (let i = 0; i < rampUpDuration; i++) {
            const month = startMonth + i;
            if (month >= 0 && month < this.months.length) {
              // Calculate ramp value ensuring it's at least 1 if maxCrew > 0
              const crewSize = this.calculateRampValue(i + 1, rampUpDuration, maxCrew);
              this.crewMatrix[dIndex][month] = crewSize;
            }
          }
        }
        
        // Apply plateau (full crew)
        for (let month = newPlateauStart; month <= newPlateauEnd; month++) {
          if (month >= 0 && month < this.months.length) {
            this.crewMatrix[dIndex][month] = maxCrew;
          }
        }
        
        // Apply ramp down
        if (rampDownDuration > 0) {
          for (let i = 0; i < rampDownDuration; i++) {
            const month = newPlateauEnd + 1 + i;
            if (month >= 0 && month < this.months.length) {
              // Calculate ramp value ensuring it's at least 1 if maxCrew > 0
              const crewSize = this.calculateRampValue(rampDownDuration - i - 1, rampDownDuration, maxCrew);
              this.crewMatrix[dIndex][month] = crewSize;
            }
          }
        }
      } else {
        // Normal case - plateau is valid
        
        // Apply ramp up
        if (rampUpDuration > 0) {
          for (let i = 0; i < rampUpDuration; i++) {
            const month = startMonth + i;
            if (month >= 0 && month < this.months.length) {
              // Calculate ramp value ensuring it's at least 1 if maxCrew > 0
              const crewSize = this.calculateRampValue(i + 1, rampUpDuration, maxCrew);
              this.crewMatrix[dIndex][month] = crewSize;
            }
          }
        }
        
        // Apply plateau (full crew)
        for (let month = plateauStart; month <= plateauEnd; month++) {
          if (month >= 0 && month < this.months.length) {
            this.crewMatrix[dIndex][month] = maxCrew;
          }
        }
        
        // Apply ramp down
        if (rampDownDuration > 0) {
          for (let i = 0; i < rampDownDuration; i++) {
            const month = plateauEnd + 1 + i;
            if (month >= 0 && month < this.months.length) {
              // Calculate ramp value ensuring it's at least 1 if maxCrew > 0
              const crewSize = this.calculateRampValue(rampDownDuration - i - 1, rampDownDuration, maxCrew);
              this.crewMatrix[dIndex][month] = crewSize;
            }
          }
        }
      }
      
      // Validate the crew matrix values
      for (let i = 0; i < this.crewMatrix[dIndex].length; i++) {
        if (isNaN(this.crewMatrix[dIndex][i]) || this.crewMatrix[dIndex][i] < 0 || this.crewMatrix[dIndex][i] > 1000) {
          console.error(`Invalid crew size at [${dIndex}][${i}]: ${this.crewMatrix[dIndex][i]}`);
          this.crewMatrix[dIndex][i] = 0;
        }
      }
      
      // Recalculate costs after updating the crew matrix
      this.$nextTick(() => {
        this.calculateCosts();
      });
    },
    calculateCosts() {
      console.log('Calculating costs...');
      
      // Reset cost arrays
      this.monthlyCosts = new Array(this.months.length).fill(0);
      this.cumulativeCosts = new Array(this.months.length).fill(0);
      this.monthlyLaborCosts = new Array(this.months.length).fill(0);
      this.monthlyFacilityCosts = new Array(this.months.length).fill(0);
      this.monthlyWorkstationCosts = new Array(this.months.length).fill(0);
      this.monthlyBackendCosts = new Array(this.months.length).fill(0);
      
      // Debug the crew matrix and department rates
      console.log('Crew matrix dimensions:', this.crewMatrix.length, 'x', 
        this.crewMatrix.length > 0 ? this.crewMatrix[0].length : 0);
      console.log('Departments length:', this.departments.length);
      console.log('Months length:', this.months.length);
      
      // Check for any unreasonable rates
      let hasInvalidRates = false;
      for (let d = 0; d < this.departments.length; d++) {
        const rate = this.departments[d].rate;
        if (isNaN(rate) || rate > 50000 || rate < 1000) {
          console.error(`Invalid rate for ${this.departments[d].name}: ${rate}`);
          hasInvalidRates = true;
          // Fix the invalid rate
          this.departments[d].rate = 8000;
          console.log(`Fixed rate for ${this.departments[d].name} to 8000`);
        }
      }
      
      if (hasInvalidRates) {
        console.warn('Fixed invalid rates in the departments');
      }
      
      // Check for any NaN or extremely large values in the crew matrix
      let hasInvalidValues = false;
      for (let d = 0; d < this.departments.length; d++) {
        for (let m = 0; m < this.months.length; m++) {
          const crewSize = this.crewMatrix[d][m];
          if (isNaN(crewSize) || crewSize > 1000) {
            console.error(`Invalid crew size at [${d}][${m}]: ${crewSize}`);
            hasInvalidValues = true;
            // Fix the invalid value
            this.crewMatrix[d][m] = 0;
          }
        }
      }
      
      if (hasInvalidValues) {
        console.warn('Fixed invalid crew sizes in the matrix');
      }
      
      // Calculate monthly costs
      for (let m = 0; m < this.months.length; m++) {
        for (let d = 0; d < this.departments.length; d++) {
          // Skip if department or crew matrix is invalid
          if (!this.departments[d] || !this.crewMatrix[d]) {
            console.error(`Invalid department or crew matrix at index ${d}`);
            continue;
          }
          
          // Get crew size and rate
          let crewSize = this.crewMatrix[d][m];
          let rate = this.departments[d].rate;
          
          // Validate crew size
          if (isNaN(crewSize) || crewSize < 0 || crewSize > 1000) {
            console.error(`Invalid crew size at [${d}][${m}]: ${crewSize}`);
            crewSize = 0;
            this.crewMatrix[d][m] = 0; // Fix the value in the matrix
          }
          
          // Validate rate
          if (isNaN(rate) || rate < 1000 || rate > 50000) {
            console.error(`Invalid rate for ${this.departments[d].name}: ${rate}`);
            rate = 8000; // Use a default rate
            this.departments[d].rate = 8000; // Fix the rate in the department
          }
          
          // Calculate cost for this department and month
          const cost = crewSize * rate;
          
          // Debug the calculation for the first month
          if (m === 0) {
            console.log(`Month 0, Dept ${d} (${this.departments[d].name}): ${crewSize} crew * $${rate} = $${cost}`);
          }
          
          // Add to monthly labor cost
          this.monthlyLaborCosts[m] += cost;
        }
        
        // Calculate monthly crew size for facility costs
        let monthlyCrewSize = 0;
        for (let d = 0; d < this.departments.length; d++) {
          if (this.crewMatrix[d] && this.crewMatrix[d][m]) {
            monthlyCrewSize += this.crewMatrix[d][m];
          }
        }
        
        // Calculate facility costs for this month
        const facilityCost = calculateFacilityCostsForMonth(this.facilitiesData, monthlyCrewSize);
        this.monthlyFacilityCosts[m] = facilityCost;
        
        // Calculate workstation costs for this month
        this.monthlyWorkstationCosts[m] = 0; // Reset for this month
      }
      
      // Calculate workstation costs based on crew matrix
      const workstationCosts = calculateMonthlyWorkstationCosts(this.workstationData, this.crewMatrix, this.departments);
      
      // Calculate backend infrastructure costs
      const backendCosts = calculateMonthlyBackendInfrastructureCosts(this.workstationData.backendInfrastructure, this.months.length);
      
      for (let m = 0; m < this.months.length; m++) {
        this.monthlyWorkstationCosts[m] = workstationCosts[m];
        this.monthlyBackendCosts[m] = backendCosts[m];
        
        // Add labor, facility, workstation, and backend costs to get total monthly cost
        this.monthlyCosts[m] = this.monthlyLaborCosts[m];
        
        if (this.facilitiesIncludedInTotals) {
          this.monthlyCosts[m] += this.monthlyFacilityCosts[m];
        }
        
        if (this.workstationsIncludedInTotals) {
          this.monthlyCosts[m] += this.monthlyWorkstationCosts[m];
          this.monthlyCosts[m] += this.monthlyBackendCosts[m];
        }
        
        // Debug the monthly cost
        console.log(`Month ${m} - Labor: $${this.monthlyLaborCosts[m]}, Facilities: $${this.monthlyFacilityCosts[m]}, Workstations: $${this.monthlyWorkstationCosts[m]}, Backend: $${this.monthlyBackendCosts[m]}, Total: $${this.monthlyCosts[m]}`);
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
      
      console.log('Total project cost:', this.totalProjectCost);
      console.log('Peak monthly cost:', this.peakMonthlyCost);
      
      // Calculate peak crew size
      let maxCrewSize = 0;
      for (let m = 0; m < this.months.length; m++) {
        let monthlyCrewSize = 0;
        for (let d = 0; d < this.departments.length; d++) {
          // Skip if department or crew matrix is invalid
          if (!this.departments[d] || !this.crewMatrix[d]) {
            console.error(`Invalid department or crew matrix at index ${d}`);
            continue;
          }
          
          // Get crew size
          let crewSize = this.crewMatrix[d][m];
          
          // Validate crew size
          if (isNaN(crewSize) || crewSize < 0 || crewSize > 1000) {
            console.error(`Invalid crew size at [${d}][${m}]: ${crewSize}`);
            crewSize = 0;
            this.crewMatrix[d][m] = 0; // Fix the value in the matrix
          }
          
          // Add to monthly crew size
          monthlyCrewSize += crewSize;
        }
        
        // Validate monthly crew size
        if (isNaN(monthlyCrewSize) || monthlyCrewSize < 0 || monthlyCrewSize > 10000) {
          console.error(`Invalid monthly crew size for month ${m}: ${monthlyCrewSize}`);
          monthlyCrewSize = 0;
        }
        
        // Update max crew size
        maxCrewSize = Math.max(maxCrewSize, monthlyCrewSize);
        
        // Debug monthly crew size
        console.log(`Month ${m} crew size: ${monthlyCrewSize}`);
      }
      
      // Validate max crew size
      if (isNaN(maxCrewSize) || maxCrewSize < 0 || maxCrewSize > 10000) {
        console.error(`Invalid max crew size: ${maxCrewSize}`);
        maxCrewSize = 0;
      }
      
      this.peakCrewSize = maxCrewSize;
      console.log('Peak crew size:', this.peakCrewSize);
    },
    formatCurrency(value) {
      // Check if the value is unreasonably large
      if (value > 1000000000000) { // More than a trillion
        console.error(`Unreasonably large currency value: ${value}`);
        // Return a more reasonable value
        return new Intl.NumberFormat('en-US', {
          style: 'decimal',
          maximumFractionDigits: 0
        }).format(0);
      }
      
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
      
      // Check if the value is unreasonably large
      if (value > 1000000000000) { // More than a trillion
        console.error(`Unreasonably large compact currency value: ${value}`);
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
        return '$' + new Intl.NumberFormat('en-US', {
          style: 'decimal',
          maximumFractionDigits: 0
        }).format(value);
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
      
      // Add the new department to the departments array
      this.departments.push(newDepartment);
      
      // Add a new row to the crew matrix
      this.crewMatrix.push(new Array(this.months.length).fill(0));
      
      // Add the new department to the itemOrder array
      this.itemOrder.push({
        type: 'department',
        index: this.departments.length - 1
      });
      
      // Update the department distribution
      this.updateDepartmentDistribution(this.departments.length - 1);
      
      // Select the new department for editing
      this.selectDepartment(this.departments.length - 1);
    },
    removeDepartment() {
      if (this.selectedDepartmentIndex !== null) {
        if (confirm(`Are you sure you want to remove "${this.departments[this.selectedDepartmentIndex].name}"?`)) {
          // Remove the department from the departments array
          this.departments.splice(this.selectedDepartmentIndex, 1);
          
          // Remove the corresponding row from the crew matrix
          this.crewMatrix.splice(this.selectedDepartmentIndex, 1);
          
          // Update the itemOrder array to remove references to the deleted department
          // and adjust indices for departments that come after the deleted one
          this.itemOrder = this.itemOrder.filter(item => {
            // Remove the item if it's the department we're deleting
            if (item.type === 'department' && item.index === this.selectedDepartmentIndex) {
              return false;
            }
            
            // Adjust indices for departments that come after the deleted one
            if (item.type === 'department' && item.index > this.selectedDepartmentIndex) {
              item.index--;
            }
            
            return true;
          });
          
          // Recalculate costs
          this.calculateCosts();
          
          // Clear the selection
          this.selectedDepartmentIndex = null;
        }
      }
    },
    // Phase methods
    isMonthInPhase(phase, monthIndex) {
      if (!phase) return false;
      return monthIndex >= phase.startMonth && monthIndex <= phase.endMonth;
    },
    editPhase(index) {
      this.selectedPhaseIndex = index;
      this.selectedDepartmentIndex = null;
    },
    closePhaseEditor() {
      this.selectedPhaseIndex = null;
    },
    toggleFacilitiesEditor() {
      this.showFacilitiesEditor = !this.showFacilitiesEditor;
      this.showWorkstationEditor = false;
      
      // Reset editor position when opening
      if (this.showFacilitiesEditor) {
        this.editorPosition = 'position-right';
        this.editorStyle = { top: '150px', right: '20px' };
      }
    },
    toggleWorkstationEditor() {
      this.showWorkstationEditor = !this.showWorkstationEditor;
      this.showFacilitiesEditor = false;
      
      // Reset editor position when opening
      if (this.showWorkstationEditor) {
        this.editorPosition = 'position-right';
        this.editorStyle = { top: '150px', right: '20px' };
      }
    },
    exportProjectJSON() {
      // Create project data object
      const projectData = createProjectData(this);
      
      // Export as JSON
      const blob = exportProjectAsJSON(projectData);
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "crew_planner_project.json");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    importProjectJSON(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonContent = e.target.result;
          const projectData = importProjectFromJSON(jsonContent);
          
          // Apply project data to the current state
          applyProjectData(projectData, this);
          
          // Ensure itemOrder is initialized if it wasn't in the imported data
          if (!this.itemOrder || this.itemOrder.length === 0) {
            this.initializeItemOrder();
          }
          
          // Update the crew matrix if needed
          this.updateCrewMatrix();
          
          // Calculate costs
          this.calculateCosts();
          
          // Show success message
          alert('Project imported successfully!');
        } catch (error) {
          console.error('Error importing project:', error);
          alert('Error importing project. Please check the file format and try again.');
        }
        
        // Reset the file input
        event.target.value = '';
      };
      reader.readAsText(file);
    },
    updateCrewMatrix() {
      // Ensure crew matrix has the correct dimensions
      if (this.crewMatrix.length !== this.departments.length) {
        // Resize the crew matrix
        this.crewMatrix = new Array(this.departments.length);
        for (let d = 0; d < this.departments.length; d++) {
          this.crewMatrix[d] = new Array(this.months.length).fill(0);
        }
        
        // Recalculate crew distribution for each department
        for (let d = 0; d < this.departments.length; d++) {
          this.updateDepartmentDistribution(d);
        }
      }
    },
    addNewPhase() {
      const newPhase = {
        name: 'New Phase',
        startMonth: 0,
        endMonth: 12,
        color: getPhaseColor(this.phases.length)
      };
      
      // Add the new phase to the phases array
      this.phases.push(newPhase);
      
      // Add the new phase to the itemOrder array
      this.itemOrder.push({
        type: 'phase',
        index: this.phases.length - 1
      });
      
      // Select the new phase for editing
      this.selectedPhaseIndex = this.phases.length - 1;
    },
    removePhase() {
      if (this.selectedPhaseIndex !== null) {
        if (confirm(`Are you sure you want to remove "${this.phases[this.selectedPhaseIndex].name}"?`)) {
          // Remove the phase from the phases array
          this.phases.splice(this.selectedPhaseIndex, 1);
          
          // Update the itemOrder array to remove references to the deleted phase
          // and adjust indices for phases that come after the deleted one
          this.itemOrder = this.itemOrder.filter(item => {
            // Remove the item if it's the phase we're deleting
            if (item.type === 'phase' && item.index === this.selectedPhaseIndex) {
              return false;
            }
            
            // Adjust indices for phases that come after the deleted one
            if (item.type === 'phase' && item.index > this.selectedPhaseIndex) {
              item.index--;
            }
            
            return true;
          });
          
          // Clear the selection
          this.selectedPhaseIndex = null;
        }
      }
    },
    // Helper method to create app state for export
    getExportAppState() {
      return {
        years: this.years,
        monthsPerYear: this.monthsPerYear,
        months: this.months,
        sortedItems: this.sortedItems,
        phases: this.phases,
        departments: this.departments,
        crewMatrix: this.crewMatrix,
        monthlyLaborCosts: this.monthlyLaborCosts,
        monthlyFacilityCosts: this.monthlyFacilityCosts,
        monthlyWorkstationCosts: this.monthlyWorkstationCosts,
        monthlyBackendCosts: this.monthlyBackendCosts,
        monthlyCosts: this.monthlyCosts,
        cumulativeCosts: this.cumulativeCosts,
        totalProjectCost: this.totalProjectCost,
        peakMonthlyCost: this.peakMonthlyCost,
        peakCrewSize: this.peakCrewSize,
        facilitiesData: this.facilitiesData,
        workstationData: this.workstationData,
        facilitiesFunctions: {
          calculateTotalFixedFacilityCosts,
          calculateTotalVariableFacilityCostsPerPerson
        },
        exportFunctions: {
          generateFacilitiesCSV,
          generateWorkstationsCSV
        }
      };
    },
    
    // Export to CSV files
    exportCSV() {
      const appState = this.getExportAppState();
      exportToMultipleCSV(appState);
      return;
    },
    
    // Export to Excel file
async exportExcel() {
      const appState = this.getExportAppState();

      try {
        console.log('Starting colored Excel export...');

        // Use ExcelJS direct export that preserves the exact same data
        const { exportToColoredExcel } = await import('./exceljs-direct-export.js');
        console.log('Successfully imported exportToColoredExcel function');

        const blob = await exportToColoredExcel(appState);
        console.log('Successfully created colored Excel blob');

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "crew_planning_data.xlsx");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message in console only
        console.log('Excel file exported successfully with colors!');
      } catch (error) {
        console.error('Error exporting formatted Excel:', error);
        console.warn('Falling back to basic Excel export.');
        
        // Fall back to the original Excel export if the enhanced one fails
        exportToExcel(appState);
      }
      
      return;
      
      // Legacy code below - no longer used
      // Create a CSV that exactly matches the original format
      
      // First, create the year header row
      let csvContent = ",";
      this.years.forEach(year => {
        // Add the year followed by empty cells for each month
        csvContent += year + "," + ",".repeat(11) + ",";
      });
      csvContent += "\n";
      
      // Create the month header row
      csvContent += ",";
      this.years.forEach(year => {
        // Add all months for this year
        this.monthsPerYear.forEach(month => {
          csvContent += month + ",";
        });
      });
      csvContent += "\n";
      
      // Add an empty row
      csvContent += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
      
      // Group departments by their section/category
      const sections = {};
      let currentSection = "Departments";
      
      // First pass: identify all sections and their departments
      this.sortedItems.forEach(item => {
        if (item.type === 'phase') {
          // This is a section header
          currentSection = this.phases[item.index].name;
          sections[currentSection] = [];
        } else if (item.type === 'department') {
          // Add this department to the current section
          if (!sections[currentSection]) {
            sections[currentSection] = [];
          }
          sections[currentSection].push({
            index: item.index,
            dept: this.departments[item.index]
          });
        }
      });
      
      // Second pass: output each section with its departments
      Object.keys(sections).forEach(sectionName => {
        // Add section header
        csvContent += sectionName + ":,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
        
        // Add departments in this section
        sections[sectionName].forEach(deptInfo => {
          // Add department name
          csvContent += deptInfo.dept.name + ",";
          
          // Add crew counts for each month
          for (let i = 0; i < this.months.length; i++) {
            csvContent += this.crewMatrix[deptInfo.index][i] + ",";
          }
          
          // Do NOT add rate at the end - this causes issues with the import
          csvContent += "\n";
          
          // Add an empty row after each department (only if not the last department in the section)
          if (sections[sectionName].indexOf(deptInfo) < sections[sectionName].length - 1) {
            csvContent += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
          }
        });
        
        // Add an empty row after each section
        csvContent += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
        csvContent += ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,\n";
      });
      
      // Add labor costs
      csvContent += "Monthly Labor Cost,";
      for (let i = 0; i < this.months.length; i++) {
        csvContent += this.monthlyLaborCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add facility costs
      csvContent += "Monthly Facility Cost,";
      for (let i = 0; i < this.months.length; i++) {
        csvContent += this.monthlyFacilityCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add workstation costs (one-time cost in first month)
      csvContent += "Workstation Cost (One-time),";
      for (let i = 0; i < this.months.length; i++) {
        csvContent += this.monthlyWorkstationCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add backend infrastructure costs
      csvContent += "Backend Infrastructure Cost,";
      for (let i = 0; i < this.months.length; i++) {
        csvContent += this.monthlyBackendCosts[i] + ",";
      }
      csvContent += "\n";

      // Add total monthly costs
      csvContent += "Total Monthly Cost,";
      for (let i = 0; i < this.months.length; i++) {
        csvContent += this.monthlyCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add cumulative costs
      csvContent += "Cumulative Cost,";
      for (let i = 0; i < this.months.length; i++) {
        csvContent += this.cumulativeCosts[i] + ",";
      }
      csvContent += "\n";
      
      // Add summary stats
      csvContent += "\nTotal Project Cost," + this.totalProjectCost + "\n";
      csvContent += "Peak Monthly Cost," + this.peakMonthlyCost + "\n";
      csvContent += "Peak Crew Size," + this.peakCrewSize + "\n";
      
      // Add department rates by phase
      csvContent += "\nDepartment Rates by Phase:\n";
      
      // Group departments by phase using the sortedItems
      const phaseMap = {};
      let currentPhase = "No Phase";
      
      this.sortedItems.forEach(item => {
        if (item.type === 'phase') {
          currentPhase = this.phases[item.index].name;
          if (!phaseMap[currentPhase]) {
            phaseMap[currentPhase] = [];
          }
        } else if (item.type === 'department') {
          if (!phaseMap[currentPhase]) {
            phaseMap[currentPhase] = [];
          }
          phaseMap[currentPhase].push(this.departments[item.index]);
        }
      });
      
      // Add departments and rates by phase
      for (const [phaseName, phaseDepts] of Object.entries(phaseMap)) {
        csvContent += phaseName + "\n";
        csvContent += "Department,Rate ($/month)\n";
        
        phaseDepts.forEach(dept => {
          csvContent += dept.name + "," + dept.rate + "\n";
        });
        
        csvContent += "\n";
      }
      
      // Add facilities summary
      csvContent += "\nFacilities Summary:\n";
      csvContent += "Fixed Monthly Facility Costs," + calculateTotalFixedFacilityCosts(this.facilitiesData) + "\n";
      csvContent += "Variable Facility Costs Per Person," + calculateTotalVariableFacilityCostsPerPerson(this.facilitiesData) + "\n";
      
      // Add workstation summary
      csvContent += "\nWorkstation Summary:\n";
      csvContent += "Department,Workstation Type,Quantity,Monthly Cost\n";
      
      this.workstationData.departmentAssignments.forEach(assignment => {
        const bundle = this.workstationData.workstationBundles.find(b => b.id === assignment.workstationId);
        if (bundle) {
          const monthlyCost = (bundle.cost * assignment.quantity) / 36; // 36-month depreciation
          csvContent += assignment.departmentName + "," + bundle.name + "," + assignment.quantity + "," + monthlyCost + "\n";
        }
      });
      
      // Create separate CSV files for facilities and workstations
      const facilitiesCSV = generateFacilitiesCSV(this.facilitiesData);
      const workstationsCSV = generateWorkstationsCSV(this.workstationData);
      
      // Create blobs for the additional CSV files
      const facilitiesBlob = new Blob([facilitiesCSV], { type: "text/csv;charset=utf-8;" });
      const workstationsBlob = new Blob([workstationsCSV], { type: "text/csv;charset=utf-8;" });
      
      // Create download links for the additional CSV files
      const facilitiesLink = document.createElement("a");
      facilitiesLink.setAttribute("href", URL.createObjectURL(facilitiesBlob));
      facilitiesLink.setAttribute("download", "facilities_data.csv");
      facilitiesLink.style.visibility = "hidden";
      document.body.appendChild(facilitiesLink);
      
      const workstationsLink = document.createElement("a");
      workstationsLink.setAttribute("href", URL.createObjectURL(workstationsBlob));
      workstationsLink.setAttribute("download", "workstations_data.csv");
      workstationsLink.style.visibility = "hidden";
      document.body.appendChild(workstationsLink);
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "crew_planning_data.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      
      // Download all files
      link.click();
      facilitiesLink.click();
      workstationsLink.click();
      
      // Clean up
      document.body.removeChild(link);
      document.body.removeChild(facilitiesLink);
      document.body.removeChild(workstationsLink);
    },
    
    loadCSV(csvContent) {
      try {
        console.log('CSV content length:', csvContent.length);
        
        // Parse the CSV content
        const parsedData = parseCSV(csvContent);
        console.log('Parsed CSV data:', parsedData);
        
        // Debug the crew matrix
        console.log('Crew matrix dimensions:', 
          parsedData.crewMatrix.length, 
          parsedData.crewMatrix.length > 0 ? parsedData.crewMatrix[0].length : 0);
        
        // Debug department rates
        console.log('Department rates:');
        parsedData.departments.forEach(dept => {
          console.log(`${dept.name}: ${dept.rate}`);
        });
        
        // Update the application state with the parsed data
        this.years = parsedData.years;
        this.months = parsedData.months;
        this.departments = parsedData.departments;
        this.phases = parsedData.phases;
        
        // Use the item order from the parsed data if available, otherwise initialize it
        if (parsedData.itemOrder) {
          console.log('Using item order from parsed data:', parsedData.itemOrder);
          this.itemOrder = parsedData.itemOrder;
        } else {
          console.log('No item order in parsed data, initializing...');
          this.initializeItemOrder();
        }
        
        // Initialize the crew matrix
        console.log('Setting crew matrix from parsed data:', parsedData.crewMatrix);
        this.crewMatrix = JSON.parse(JSON.stringify(parsedData.crewMatrix)); // Deep copy
        
        // Ensure the crew matrix has the correct dimensions
        if (this.crewMatrix.length !== this.departments.length) {
          console.warn(`Crew matrix length (${this.crewMatrix.length}) doesn't match departments length (${this.departments.length})`);
          // Reinitialize the crew matrix
          this.initializeCrewMatrix();
          
          // Copy data from the original matrix where possible
          for (let i = 0; i < Math.min(parsedData.crewMatrix.length, this.departments.length); i++) {
            for (let j = 0; j < Math.min(parsedData.crewMatrix[i].length, this.months.length); j++) {
              this.crewMatrix[i][j] = parsedData.crewMatrix[i][j];
            }
          }
        }
        
        // Ensure each row in the crew matrix has the correct length
        for (let i = 0; i < this.crewMatrix.length; i++) {
          if (this.crewMatrix[i].length !== this.months.length) {
            console.warn(`Crew matrix row ${i} length (${this.crewMatrix[i].length}) doesn't match months length (${this.months.length})`);
            // Reinitialize this row
            const newRow = new Array(this.months.length).fill(0);
            // Copy data where possible
            for (let j = 0; j < Math.min(this.crewMatrix[i].length, this.months.length); j++) {
              newRow[j] = this.crewMatrix[i][j];
            }
            this.crewMatrix[i] = newRow;
          }
        }
        
        // Ensure all departments have reasonable rates
        this.departments.forEach(dept => {
          // If rate is unreasonably high, reset it
          if (dept.rate > 50000) {
            console.warn(`Resetting unreasonable rate for ${dept.name}: ${dept.rate} -> 8000`);
            dept.rate = 8000;
          }
          // If rate is too low, set a minimum
          else if (dept.rate < 1000) {
            console.warn(`Increasing too low rate for ${dept.name}: ${dept.rate} -> 1000`);
            dept.rate = 1000;
          }
        });
        
        // Calculate costs based on the loaded crew matrix
        this.calculateCosts();
        
        // Show success message
        alert('CSV file loaded successfully!');
      } catch (error) {
        console.error('Error loading CSV:', error);
        alert('Error loading CSV file. Please check the format and try again.');
      }
    },
    
    // Generate months based on years
    generateMonths() {
      // Clear existing months
      this.months = [];
      
      // Generate all months across years
      this.years.forEach(year => {
        this.monthsPerYear.forEach(month => {
          this.months.push(`${month} Y${year}`);
        });
      });
    },
    
    // Edit year
    editYear(index) {
      const currentYear = this.years[index];
      const newYear = prompt(`Edit year number (currently Year ${currentYear}):`, currentYear);
      
      if (newYear && !isNaN(newYear) && newYear.trim() !== '') {
        // Update the year
        const yearValue = parseInt(newYear.trim());
        
        // Ensure year is positive
        if (yearValue <= 0) {
          alert('Year number must be positive.');
          return;
        }
        
        // Check if this year already exists
        if (this.years.includes(yearValue) && this.years[index] !== yearValue) {
          alert('This year already exists in the timeline.');
          return;
        }
        
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
    
    // Time scale controls
    updateTimeScale() {
      // Convert numberOfYears to number
      this.numberOfYears = parseInt(this.numberOfYears);
      console.log(`Updating number of years to ${this.numberOfYears}`);
      
      // Generate years array based on the number of years
      this.years = Array.from({ length: this.numberOfYears }, (_, i) => i + 1);
      console.log('Updated years array:', this.years);
      
      // Regenerate months with the new years
      this.generateMonthsWithTimeScale();
    },
    
    // Generate months based on years
    generateMonthsWithTimeScale() {
      // Clear existing months
      this.months = [];
      
      // Generate all months for each year
      this.years.forEach(year => {
        this.monthsPerYear.forEach(month => {
          this.months.push(`${month} Y${year}`);
        });
      });
      
      console.log(`Generated ${this.months.length} months for ${this.years.length} years`);
      
      // Reinitialize crew matrix
      this.initializeCrewMatrix();
      
      // Recalculate
      this.updateAllDepartments();
    },
    // Editor position and dragging
    resetEditorPosition() {
      this.editorPosition = this.editorPosition === 'position-left' ? 'position-right' : 'position-left';
      this.editorStyle = { top: '150px', left: '20px' };
    },
    
    // handleGlobalMouseDown method removed as we're now using direct mousedown events
    
    startDrag(event, editorType) {
      console.log(`App: startDrag called for ${editorType}`);
      // Only start drag if clicking on the header (either old style or Vuetify)
      if ((event.target.closest('.editor-header') || event.target.closest('.v-card-title')) && !event.target.closest('button') && !event.target.closest('.v-btn')) {
        this.isDragging = true;
        this.activeEditor = editorType;
        
        console.log(`App: dragging ${editorType}`);
        const editor = this.$refs[editorType + 'Editor'];
        if (!editor) {
          console.error(`Editor ref not found: ${editorType}Editor`);
          return;
        }
        
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
:root {
  --primary-color: #1976D2;
  --secondary-color: #424242;
  --accent-color: #82B1FF;
  --error-color: #FF5252;
  --info-color: #2196F3;
  --success-color: #4CAF50;
  --warning-color: #FFC107;
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  font-size: 18px;
  color: var(--primary-color);
}

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
  padding-bottom: 10px; /* Minimal padding at the bottom */
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

.main-header {
  background-color: #1e3a8a;
  color: white;
  padding: 1.25rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.main-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.visualization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.visualization-header h2 {
  margin: 0;
  flex-shrink: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #1f2937;
}

.summary-header {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 20px;
  background-color: #f9fafb;
  padding: 15px;
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
  margin-bottom: 16px;
}

.action-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.toolbar-section {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
  margin: 0 4px;
}

.action-button {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  background-color: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
  height: 32px;
}

.action-button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.action-button:active {
  background-color: #e5e7eb;
  transform: translateY(1px);
}

.cost-toggles {
  display: flex;
  flex-direction: row;
  font-size: 0.8rem;
  background-color: #f0fdf4;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #bbf7d0;
  gap: 10px;
}

.toggle-item {
  display: flex;
  align-items: center;
}

.toggle-item input[type="checkbox"] {
  margin-right: 4px;
  width: 14px;
  height: 14px;
  accent-color: #16a34a;
  cursor: pointer;
}

.toggle-item label {
  color: #166534;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.export-import-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.json-button {
  background-color: #f5f3ff;
  color: #5b21b6;
  border-color: #ddd6fe;
}

.json-button:hover {
  background-color: #ede9fe;
  border-color: #c4b5fd;
}

.workstation-button {
  background-color: #ecfeff;
  color: #0e7490;
  border-color: #a5f3fc;
}

.workstation-button:hover {
  background-color: #cffafe;
  border-color: #67e8f9;
}

.add-button {
  background-color: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.add-button:hover {
  background-color: #d1fae5;
  border-color: #6ee7b7;
}

.phase-button {
  background-color: #eff6ff;
  color: #1e40af;
  border-color: #bfdbfe;
}

.phase-button:hover {
  background-color: #dbeafe;
  border-color: #93c5fd;
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
  gap: 4px;
}

.zoom-controls span {
  font-size: 0.85rem;
  color: #475569;
  min-width: 40px;
  text-align: center;
}

.time-scale-control {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.time-scale-control label {
  margin-right: 6px;
  font-weight: 500;
  color: #475569;
}

.time-scale-control select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #f8fafc;
  font-size: 0.85rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 32px;
}

.time-scale-control select:hover {
  border-color: #94a3b8;
  background-color: #f1f5f9;
}

.time-scale-control select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.zoom-button {
  width: 32px;
  height: 32px;
  background-color: #f1f5f9;
  color: #334155;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.zoom-button:hover {
  background-color: #e2e8f0;
  border-color: #94a3b8;
}

.zoom-button:active {
  background-color: #cbd5e1;
  transform: translateY(1px);
}

.zoom-button.reset {
  width: auto;
  padding: 0 8px;
  font-size: 0.8rem;
  height: 32px;
}

.export-button {
  background-color: #eef2ff;
  color: #3730a3;
  border-color: #c7d2fe;
}

.export-button:hover {
  background-color: #e0e7ff;
  border-color: #a5b4fc;
}

.excel-button {
  background-color: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.excel-button:hover {
  background-color: #d1fae5;
  border-color: #6ee7b7;
}

.facilities-button {
  background-color: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}

.facilities-button:hover {
  background-color: #ffedd5;
  border-color: #fdba74;
}

/* Drag handle styles */
.dept-cell {
  position: relative;
}

.cell-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-handle {
  border-left: 3px solid var(--primary-color);
  background-color: rgba(25, 118, 210, 0.1); /* Using primary-color rgba */
}

.end-handle {
  border-right: 3px solid var(--primary-color);
  background-color: rgba(25, 118, 210, 0.1); /* Using primary-color rgba */
}

.start-drag-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 10px;
  height: 100%;
  cursor: w-resize;
  background: linear-gradient(90deg, var(--primary-color) 0%, transparent 100%);
  opacity: 0.7;
  z-index: 5;
}

.end-drag-handle {
  position: absolute;
  right: 0;
  top: 0;
  width: 10px;
  height: 100%;
  cursor: e-resize;
  background: linear-gradient(90deg, transparent 0%, var(--primary-color) 100%);
  opacity: 0.7;
  z-index: 5;
}

.start-drag-handle:hover, .end-drag-handle:hover {
  opacity: 1;
  width: 12px;
}

.in-range {
  background-color: rgba(76, 175, 80, 0.05);
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
  /* Force vertical scrolling to be always visible */
  overflow-y: scroll !important;
  overflow-x: auto !important;
  max-height: calc(100vh - 250px); /* Increased max-height to show more of the grid */
  scrollbar-width: thin; /* For Firefox */
}

/* For Webkit browsers like Chrome/Safari */
.table-scroll-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.table-wrapper {
  position: relative;
  padding-bottom: 20px; /* Minimal padding at the bottom */
  padding-right: 50px; /* Add padding on the right side */
}

/* Bottom spacer removed to show more of the grid */

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
  padding: 5px 15px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 5px;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.4em;
  color: #1e40af;
  font-weight: 700;
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
  position: fixed !important;
  z-index: 1000 !important;
  max-height: 80vh;
  overflow-y: auto;
  transition: none !important; /* Disable transitions for smooth dragging */
  user-select: none; /* Prevent text selection during drag */
}

.facilities-editor {
  width: 600px; /* Wider width for facilities editor */
}

.workstation-editor {
  width: 800px; /* Even wider for hardware editor which has more content */
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
}

.editor-header {
  cursor: move !important;
  user-select: none !important;
  touch-action: none !important;
}

.department-editor, .phase-editor, .facilities-editor, .workstation-editor {
  border-radius: 8px;
  overflow: hidden;
}

.department-editor {
  border: 2px solid #1976D2; /* Primary color */
}

.phase-editor {
  border: 2px solid #424242; /* Secondary color */
}

.facilities-editor {
  border: 2px solid #2196F3; /* Info color */
}

.workstation-editor {
  border: 2px solid #4CAF50; /* Success color */
}

.department-editor .v-card, .phase-editor .v-card, 
.facilities-editor .v-card, .workstation-editor .v-card {
  border-radius: 8px;
}

.draggable-panel .v-card-title {
  cursor: move !important;
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

.v-card-text {
  max-height: calc(80vh - 60px);
  overflow-y: auto;
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

.input-with-number {
  display: flex;
  align-items: center;
}

.input-with-number .slider {
  flex: 1;
}

.input-with-number .number-input {
  width: 60px;
  margin-left: 10px;
  text-align: center;
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
    position: fixed !important;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    top: auto !important;
    width: 90%;
    max-width: 500px;
  }
  
  .facilities-editor, .workstation-editor {
    width: 90%;
    max-width: 600px;
  }
  
  .position-left, .position-right {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }
}


.phase-cell {
  background-color: rgba(200, 200, 200, 0.1);
  border: 1px solid #ddd;
  position: relative;
  padding: 0;
  height: 40px;
}

.phase-cell.in-range {
  /* The background color will be set dynamically via inline style */
  border-top: 2px solid var(--phase-color, rgba(76, 175, 80, 0.8));
  border-bottom: 2px solid var(--phase-color, rgba(76, 175, 80, 0.8));
}

.phase-content {
  position: relative;
  height: 100%;
  width: 100%;
}</style>