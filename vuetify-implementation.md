# Vuetify Implementation Plan

This document outlines the steps to convert the current custom CSS styling to Vuetify components.

## 1. Update package.json

```json
{
  "dependencies": {
    "@mdi/font": "^7.4.47",
    "@vitejs/plugin-vue": "^5.2.3",
    "chart.js": "^4.4.9",
    "vite": "^6.2.6",
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "vuetify": "^3.5.9",
    "xlsx": "^0.18.5"
  }
}
```

## 2. Update main.js

```javascript
import { createApp } from 'vue';
import App from './App.vue';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
    },
  },
});

createApp(App)
  .use(vuetify)
  .mount('#app');
```

## 3. Update App.vue Template Structure

### Header and Main Container

```vue
<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Crew Planning Tool</v-app-bar-title>
    </v-app-bar>
    
    <v-main :style="{
      '--cell-width': 60 * zoomLevel + 'px',
      '--cell-height': 40 * zoomLevel + 'px',
      '--cell-padding': 8 * zoomLevel + 'px',
      '--font-size': 14 * zoomLevel + 'px',
      '--header-height': 80 * zoomLevel + 'px'
    }">
      <!-- Main content goes here -->
    </v-main>
  </v-app>
</template>
```

### Summary Section

```vue
<v-container fluid>
  <v-row>
    <v-col cols="12">
      <v-card>
        <v-card-title class="text-h5">Crew Planning Visualization</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">Total Project Cost</v-card-title>
                <v-card-text class="text-h6">${{ formatCurrency(totalProjectCost).replace('$', '') }}</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">Peak Monthly Cost</v-card-title>
                <v-card-text class="text-h6">${{ formatCurrency(peakMonthlyCost).replace('$', '') }}</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">Peak Crew Size</v-card-title>
                <v-card-text class="text-h6">{{ peakCrewSize }} crew members</v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</v-container>
```

### Action Buttons

```vue
<v-row class="mt-4">
  <v-col cols="12">
    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-btn-group class="mb-2">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="addNewDepartment">Dept</v-btn>
              <v-btn color="secondary" prepend-icon="mdi-plus" @click="addNewPhase">Phase</v-btn>
            </v-btn-group>
            
            <v-divider vertical class="mx-2"></v-divider>
            
            <v-btn-group class="mb-2">
              <v-btn color="info" prepend-icon="mdi-office-building" @click="toggleFacilitiesEditor">Facilities</v-btn>
              <v-btn color="success" prepend-icon="mdi-laptop" @click="toggleWorkstationEditor">Workstations</v-btn>
            </v-btn-group>
            
            <v-divider vertical class="mx-2"></v-divider>
            
            <v-checkbox
              v-model="facilitiesIncludedInTotals"
              @update:model-value="calculateCosts"
              label="Facilities"
              hide-details
              density="compact"
              class="d-inline-block mr-2"
            ></v-checkbox>
            
            <v-checkbox
              v-model="workstationsIncludedInTotals"
              @update:model-value="calculateCosts"
              label="Workstations"
              hide-details
              density="compact"
              class="d-inline-block"
            ></v-checkbox>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-row>
              <v-col cols="12" sm="6">
                <v-btn-group variant="outlined" class="mb-2">
                  <v-btn icon="mdi-minus" @click="zoomOut" title="Zoom Out"></v-btn>
                  <v-btn disabled>{{ Math.round(zoomLevel * 100) }}%</v-btn>
                  <v-btn icon="mdi-plus" @click="zoomIn" title="Zoom In"></v-btn>
                  <v-btn icon="mdi-refresh" @click="resetZoom" title="Reset Zoom"></v-btn>
                </v-btn-group>
              </v-col>
              
              <v-col cols="12" sm="6">
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
                  label="Number of Years"
                  variant="outlined"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12">
                <v-btn color="primary" class="mr-2 mb-2" prepend-icon="mdi-file-export" @click="exportCSV">
                  Export CSV
                </v-btn>
                <v-btn color="primary" class="mr-2 mb-2" prepend-icon="mdi-microsoft-excel" @click="exportExcel">
                  Export Excel
                </v-btn>
                <FileUploader @file-loaded="loadFile" />
                <v-btn variant="text" color="primary" href="/sample_crew_plan.csv" download>
                  Download Sample
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
```

### Table Section

```vue
<v-row>
  <v-col cols="12">
    <v-card>
      <v-card-text class="table-container">
        <div class="table-scroll-container">
          <div class="table-wrapper">
            <!-- Keep the existing table structure for now, but replace with v-data-table in future iterations -->
            <table class="crew-table">
              <!-- Table content -->
            </table>
            <div class="bottom-spacer"></div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
```

### Department Editor

```vue
<v-dialog
  v-model="selectedDepartmentIndex !== null"
  max-width="500"
  persistent
>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Department Editor</span>
      <v-btn icon="mdi-close" @click="closeDepartmentEditor" variant="text"></v-btn>
    </v-card-title>
    
    <v-card-text v-if="selectedDepartmentIndex !== null">
      <v-text-field
        v-model="departments[selectedDepartmentIndex].name"
        label="Department Name"
        variant="outlined"
        density="compact"
      ></v-text-field>
      
      <v-slider
        v-model="departments[selectedDepartmentIndex].maxCrew"
        @update:model-value="updateDepartmentCrew(departments[selectedDepartmentIndex])"
        label="Max Crew Size"
        min="0"
        max="100"
        thumb-label
      >
        <template v-slot:append>
          <v-text-field
            v-model="departments[selectedDepartmentIndex].maxCrew"
            type="number"
            style="width: 70px"
            density="compact"
            @input="updateDepartmentCrew(departments[selectedDepartmentIndex])"
          ></v-text-field>
        </template>
      </v-slider>
      
      <v-slider
        v-model="departments[selectedDepartmentIndex].startMonth"
        @update:model-value="updateDepartmentTimeframe(departments[selectedDepartmentIndex])"
        :label="'Start Month: ' + getMonthName(departments[selectedDepartmentIndex].startMonth)"
        min="0"
        :max="months.length - 1"
        thumb-label
      ></v-slider>
      
      <v-slider
        v-model="departments[selectedDepartmentIndex].endMonth"
        @update:model-value="updateDepartmentTimeframe(departments[selectedDepartmentIndex])"
        :label="'End Month: ' + getMonthName(departments[selectedDepartmentIndex].endMonth)"
        :min="departments[selectedDepartmentIndex].startMonth"
        :max="months.length - 1"
        thumb-label
      ></v-slider>
      
      <v-slider
        v-model="departments[selectedDepartmentIndex].rampUpDuration"
        @update:model-value="updateDepartmentRamp(departments[selectedDepartmentIndex])"
        :label="'Ramp Up Duration (months): ' + departments[selectedDepartmentIndex].rampUpDuration"
        min="0"
        :max="Math.max(1, Math.floor((departments[selectedDepartmentIndex].endMonth - departments[selectedDepartmentIndex].startMonth) / 2))"
        thumb-label
      ></v-slider>
      
      <v-slider
        v-model="departments[selectedDepartmentIndex].rampDownDuration"
        @update:model-value="updateDepartmentRamp(departments[selectedDepartmentIndex])"
        :label="'Ramp Down Duration (months): ' + departments[selectedDepartmentIndex].rampDownDuration"
        min="0"
        :max="Math.max(1, Math.floor((departments[selectedDepartmentIndex].endMonth - departments[selectedDepartmentIndex].startMonth) / 2))"
        thumb-label
      ></v-slider>
      
      <v-text-field
        v-model="departments[selectedDepartmentIndex].rate"
        @update:model-value="calculateCosts"
        label="Rate ($/month)"
        type="number"
        min="0"
        step="100"
        variant="outlined"
        density="compact"
      ></v-text-field>
    </v-card-text>
    
    <v-card-actions>
      <v-btn color="primary" @click="moveDepartmentUp" :disabled="selectedDepartmentIndex === 0">
        Move Up
      </v-btn>
      <v-btn color="primary" @click="moveDepartmentDown" :disabled="selectedDepartmentIndex === departments.length - 1">
        Move Down
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="error" @click="removeDepartment">
        Remove Department
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### Phase Editor

```vue
<v-dialog
  v-model="selectedPhaseIndex !== null"
  max-width="500"
  persistent
>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Phase Editor</span>
      <v-btn icon="mdi-close" @click="closePhaseEditor" variant="text"></v-btn>
    </v-card-title>
    
    <v-card-text v-if="selectedPhaseIndex !== null">
      <v-text-field
        v-model="phases[selectedPhaseIndex].name"
        label="Phase Name"
        variant="outlined"
        density="compact"
      ></v-text-field>
      
      <v-slider
        v-model="phases[selectedPhaseIndex].startMonth"
        :label="'Start Month: ' + getMonthName(phases[selectedPhaseIndex].startMonth)"
        min="0"
        :max="months.length - 1"
        thumb-label
      ></v-slider>
      
      <v-slider
        v-model="phases[selectedPhaseIndex].endMonth"
        :label="'End Month: ' + getMonthName(phases[selectedPhaseIndex].endMonth)"
        :min="phases[selectedPhaseIndex].startMonth"
        :max="months.length - 1"
        thumb-label
      ></v-slider>
    </v-card-text>
    
    <v-card-actions>
      <v-btn color="primary" @click="movePhaseUp" :disabled="selectedPhaseIndex === 0">
        Move Up
      </v-btn>
      <v-btn color="primary" @click="movePhaseDown" :disabled="selectedPhaseIndex === phases.length - 1">
        Move Down
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="error" @click="removePhase">
        Remove Phase
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

## 4. Update FileUploader Component

The FileUploader component should be updated to use Vuetify components:

```vue
<template>
  <v-file-input
    accept=".csv,.xlsx"
    label="Upload File"
    variant="outlined"
    density="compact"
    hide-details
    class="d-inline-block"
    style="max-width: 200px;"
    @update:model-value="handleFileChange"
  ></v-file-input>
</template>

<script>
export default {
  methods: {
    handleFileChange(files) {
      if (!files) return;
      
      const file = files;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        this.$emit('file-loaded', {
          content: e.target.result,
          name: file.name
        });
      };
      
      reader.readAsArrayBuffer(file);
    }
  }
}
</script>
```

## 5. Update CSS

Most of the custom CSS can be removed as Vuetify will handle styling. However, some custom CSS will still be needed for the specialized table visualization:

```css
<style>
/* Keep only the specialized CSS needed for the table visualization */
.table-container {
  overflow: hidden;
  position: relative;
}

.table-scroll-container {
  overflow: auto;
  max-height: calc(100vh - 350px);
}

.table-wrapper {
  position: relative;
}

.crew-table {
  border-collapse: collapse;
  width: auto;
}

/* Add other specialized table styles as needed */

/* Custom styles for timeline visualization */
.dept-cell {
  position: relative;
}

.start-drag-handle, .end-drag-handle {
  position: absolute;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
}

.start-drag-handle {
  left: 0;
}

.end-drag-handle {
  right: 0;
}

/* Other specialized styles that can't be handled by Vuetify */
</style>
```

## Implementation Steps

1. Install Vuetify and Material Design Icons
2. Update main.js to configure Vuetify
3. Update App.vue template structure
4. Update FileUploader component
5. Update other components as needed
6. Remove redundant CSS
7. Test and refine the implementation