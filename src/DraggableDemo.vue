<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>Draggable Panels & Scrolling Demo</v-app-bar-title>
    </v-app-bar>
    
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Demonstration</v-card-title>
              <v-card-text>
                <v-btn color="primary" @click="showPanel1 = !showPanel1">
                  Toggle Panel 1
                </v-btn>
                <v-btn color="secondary" class="ml-2" @click="showPanel2 = !showPanel2">
                  Toggle Panel 2
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Scrollable Table Demo -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title>Scrollable Table</v-card-title>
              <v-card-text class="table-container">
                <div class="table-scroll-container">
                  <table class="demo-table">
                    <thead>
                      <tr>
                        <th>Header 1</th>
                        <th>Header 2</th>
                        <th>Header 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="n in 50" :key="n">
                        <td>Row {{ n }}, Cell 1</td>
                        <td>Row {{ n }}, Cell 2</td>
                        <td>Row {{ n }}, Cell 3</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
      
      <!-- Draggable Panel 1 -->
      <div 
        v-if="showPanel1" 
        class="floating-editor panel1"
        :style="panel1Style"
        ref="panel1"
        @mousedown="startDrag($event, 'panel1')"
      >
        <v-card color="primary" class="draggable-card">
          <v-card-title class="d-flex justify-space-between align-center text-white">
            <span>Draggable Panel 1</span>
            <div>
              <v-btn icon="mdi-refresh" @click="resetPosition('panel1')" variant="text" color="white" density="compact"></v-btn>
              <v-btn icon="mdi-close" @click="showPanel1 = false" variant="text" color="white" density="compact"></v-btn>
            </div>
          </v-card-title>
          
          <v-card-text class="bg-white">
            <p>This panel can be dragged by its header.</p>
            <p>Try dragging it around the screen!</p>
            
            <v-slider
              v-model="sliderValue"
              label="Test Slider"
              min="0"
              max="100"
              thumb-label
            ></v-slider>
          </v-card-text>
        </v-card>
      </div>
      
      <!-- Draggable Panel 2 -->
      <div 
        v-if="showPanel2" 
        class="floating-editor panel2"
        :style="panel2Style"
        ref="panel2"
        @mousedown="startDrag($event, 'panel2')"
      >
        <v-card color="secondary" class="draggable-card">
          <v-card-title class="d-flex justify-space-between align-center text-white">
            <span>Draggable Panel 2</span>
            <div>
              <v-btn icon="mdi-refresh" @click="resetPosition('panel2')" variant="text" color="white" density="compact"></v-btn>
              <v-btn icon="mdi-close" @click="showPanel2 = false" variant="text" color="white" density="compact"></v-btn>
            </div>
          </v-card-title>
          
          <v-card-text class="bg-white">
            <p>This is another draggable panel.</p>
            <p>You can have multiple draggable panels open at once.</p>
            
            <v-text-field
              v-model="textValue"
              label="Test Input"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<script>
export default {
  data() {
    return {
      showPanel1: false,
      showPanel2: false,
      panel1Style: {
        top: '100px',
        left: '100px'
      },
      panel2Style: {
        top: '150px',
        left: '150px'
      },
      sliderValue: 50,
      textValue: 'Test',
      isDragging: false,
      dragTarget: null,
      dragOffsetX: 0,
      dragOffsetY: 0
    };
  },
  
  mounted() {
    // Add global event listeners for dragging
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  },
  
  beforeUnmount() {
    // Remove global event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  },
  
  methods: {
    startDrag(event, panelName) {
      // Only start drag if clicking on the header (card title)
      if (event.target.closest('.v-card-title')) {
        this.isDragging = true;
        this.dragTarget = panelName;
        
        const panel = this.$refs[panelName];
        const rect = panel.getBoundingClientRect();
        
        // Calculate the offset from the mouse position to the panel's top-left corner
        this.dragOffsetX = event.clientX - rect.left;
        this.dragOffsetY = event.clientY - rect.top;
        
        // Prevent text selection during drag
        event.preventDefault();
      }
    },
    
    onMouseMove(event) {
      if (this.isDragging && this.dragTarget) {
        // Calculate new position
        const newLeft = event.clientX - this.dragOffsetX;
        const newTop = event.clientY - this.dragOffsetY;
        
        // Update the panel's position
        this[`${this.dragTarget}Style`] = {
          ...this[`${this.dragTarget}Style`],
          left: `${newLeft}px`,
          top: `${newTop}px`
        };
      }
    },
    
    onMouseUp() {
      this.isDragging = false;
      this.dragTarget = null;
    },
    
    resetPosition(panelName) {
      if (panelName === 'panel1') {
        this.panel1Style = {
          top: '100px',
          left: '100px'
        };
      } else if (panelName === 'panel2') {
        this.panel2Style = {
          top: '150px',
          left: '150px'
        };
      }
    }
  }
};
</script>

<style>
.table-container {
  overflow: hidden;
  position: relative;
}

.table-scroll-container {
  overflow: auto;
  max-height: 400px;
  /* Force vertical scrolling to be always visible */
  overflow-y: scroll !important;
  overflow-x: auto !important;
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

.demo-table {
  width: 100%;
  border-collapse: collapse;
}

.demo-table th, .demo-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.demo-table th {
  background-color: #f2f2f2;
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Draggable editor panels */
.floating-editor {
  position: fixed !important;
  z-index: 1000 !important;
  width: 400px;
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

.panel1 {
  border: 2px solid var(--v-primary-base);
}

.panel2 {
  border: 2px solid var(--v-secondary-base);
}

/* Media queries for responsive design */
@media (max-width: 1200px) {
  .floating-editor {
    position: fixed;
    bottom: 20px;
    left: 50% !important;
    transform: translateX(-50%);
    top: auto !important;
    width: 90%;
    max-width: 500px;
  }
}
</style>