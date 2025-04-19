# Header and Toolbar Updates

## Stats Section Update

Replace the stats section with this more compact version with bolder, colored text:

```vue
<v-row>
  <v-col cols="12">
    <v-card class="pa-2">
      <v-card-title class="text-h6 py-1">Crew Planning Visualization</v-card-title>
      <v-divider></v-divider>
      <v-card-text class="py-2">
        <v-row dense>
          <v-col cols="12" md="4" class="py-1">
            <div class="d-flex align-center">
              <div class="text-subtitle-2 mr-2">Total Project Cost:</div>
              <div class="text-h6 font-weight-bold text-primary">${{ formatCurrency(totalProjectCost).replace('$', '') }}</div>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="py-1">
            <div class="d-flex align-center">
              <div class="text-subtitle-2 mr-2">Peak Monthly Cost:</div>
              <div class="text-h6 font-weight-bold text-secondary">${{ formatCurrency(peakMonthlyCost).replace('$', '') }}</div>
            </div>
          </v-col>
          <v-col cols="12" md="4" class="py-1">
            <div class="d-flex align-center">
              <div class="text-subtitle-2 mr-2">Peak Crew Size:</div>
              <div class="text-h6 font-weight-bold text-info">{{ peakCrewSize }} crew members</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
```

## Department and Phase Buttons

Replace the department and phase buttons section with:

```vue
<v-row class="mt-2">
  <v-col cols="12">
    <v-card class="pa-2">
      <v-card-text class="py-2">
        <div class="d-flex flex-wrap align-center">
          <v-btn-group class="mr-4 mb-2">
            <v-btn color="primary" prepend-icon="mdi-plus" @click="addNewDepartment" size="small">Dept</v-btn>
            <v-btn color="secondary" prepend-icon="mdi-plus" @click="addNewPhase" size="small">Phase</v-btn>
          </v-btn-group>
          
          <v-divider vertical class="mx-2 my-2" style="height: 32px;"></v-divider>
          
          <v-btn-group class="mr-4 mb-2">
            <v-btn color="info" prepend-icon="mdi-office-building" @click="toggleFacilitiesEditor" size="small">Facilities</v-btn>
            <v-btn color="success" prepend-icon="mdi-laptop" @click="toggleWorkstationEditor" size="small">Workstations</v-btn>
          </v-btn-group>
          
          <v-divider vertical class="mx-2 my-2" style="height: 32px;"></v-divider>
          
          <div class="d-flex align-center mb-2">
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
              label="Workstations"
              hide-details
              density="compact"
            ></v-checkbox>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
```

## Export and Zoom Controls

Replace the export and zoom controls with:

```vue
<v-row class="mt-2">
  <v-col cols="12" md="6">
    <v-card class="pa-2">
      <v-card-text class="py-2">
        <div class="d-flex flex-wrap align-center">
          <v-btn-group class="mr-4 mb-2">
            <v-btn color="primary" prepend-icon="mdi-file-export" @click="exportProjectJSON" size="small">JSON</v-btn>
            <v-btn color="primary" prepend-icon="mdi-file-delimited" @click="exportCSV" size="small">CSV</v-btn>
            <v-btn color="primary" prepend-icon="mdi-microsoft-excel" @click="exportExcel" size="small">Excel</v-btn>
          </v-btn-group>
          
          <v-btn color="primary" prepend-icon="mdi-file-import" size="small" class="mr-2 mb-2" @click="$refs.jsonFileInput.click()">
            Import JSON
          </v-btn>
          <input type="file" ref="jsonFileInput" accept=".json" @change="importProjectJSON" style="display: none;">
          
          <FileUploader @file-loaded="loadFile" />
          
          <v-btn variant="text" color="primary" href="/sample_crew_plan.csv" download class="mb-2">
            Sample
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-col>
  
  <v-col cols="12" md="6">
    <v-card class="pa-2">
      <v-card-text class="py-2">
        <div class="d-flex flex-wrap align-center">
          <v-btn-group variant="outlined" class="mr-4 mb-2">
            <v-btn icon="mdi-minus" @click="zoomOut" title="Zoom Out" size="small"></v-btn>
            <v-btn disabled size="small">{{ Math.round(zoomLevel * 100) }}%</v-btn>
            <v-btn icon="mdi-plus" @click="zoomIn" title="Zoom In" size="small"></v-btn>
            <v-btn icon="mdi-refresh" @click="resetZoom" title="Reset Zoom" size="small"></v-btn>
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
            density="compact"
            class="mb-2"
            style="max-width: 120px;"
          ></v-select>
        </div>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
```

## FileUploader Component Update

Update the FileUploader component to use Vuetify:

```vue
<template>
  <v-file-input
    accept=".csv,.xlsx,.json"
    label="Upload"
    variant="outlined"
    density="compact"
    hide-details
    class="d-inline-block mr-2 mb-2"
    style="max-width: 150px;"
    @update:model-value="handleFileUpload"
  ></v-file-input>
</template>

<script>
export default {
  name: 'FileUploader',
  methods: {
    handleFileUpload(file) {
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        this.$emit('file-loaded', e.target.result);
      };
      
      reader.readAsText(file);
    }
  }
}
</script>
```