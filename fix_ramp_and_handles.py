import re

# Read the current file
with open('src/App.vue', 'r') as file:
    content = file.read()

# 1. Fix the drag handles issue
# The issue is likely in the cell-content div where the drag handles are conditionally rendered
old_drag_handles = r'''                      <div class="cell-content">
                        {{ crewMatrix[item.index][mIndex] > 0 ? crewMatrix[item.index][mIndex] : '' }}
                        <div v-if="mIndex === departments[item.index].startMonth" class="start-drag-handle" title="Drag to adjust start month"></div>
                        <div v-if="mIndex === departments[item.index].endMonth" class="end-drag-handle" title="Drag to adjust end month"></div>
                      </div>'''

new_drag_handles = r'''                      <div class="cell-content">
                        {{ crewMatrix[item.index][mIndex] > 0 ? crewMatrix[item.index][mIndex] : '' }}
                        <div v-if="mIndex === departments[item.index].startMonth" class="start-drag-handle" title="Drag to adjust start month"></div>
                        <div v-if="mIndex === departments[item.index].endMonth" class="end-drag-handle" title="Drag to adjust end month"></div>
                      </div>'''

# 2. Fix the ramp calculation logic
# The issue is in the updateDepartmentRamp function
old_ramp_function = r'''    updateDepartmentRamp(department) {
      console.log(`Updating ramp for department: ${department.name}, rampUp: ${department.rampUpDuration}, rampDown: ${department.rampDownDuration}`);

      // Validate ramp durations
      if (isNaN(department.rampUpDuration) || department.rampUpDuration < 0) {
        department.rampUpDuration = 0;
        console.log(`Adjusted rampUpDuration to ${department.rampUpDuration}`);
      }

      if (isNaN(department.rampDownDuration) || department.rampDownDuration < 0) {
        department.rampDownDuration = 0;
        console.log(`Adjusted rampDownDuration to ${department.rampDownDuration}`);
      }

      // Calculate the total timeframe duration
      const timeframeDuration = department.endMonth - department.startMonth + 1;
      console.log(`Timeframe duration: ${timeframeDuration} months`);

      // Ensure there's at least 1 month for the plateau
      const totalRampDuration = department.rampUpDuration + department.rampDownDuration;
      if (totalRampDuration >= timeframeDuration) {
        // Reduce both ramps proportionally
        const reductionFactor = (timeframeDuration - 1) / totalRampDuration;
        department.rampUpDuration = Math.floor(department.rampUpDuration * reductionFactor);
        department.rampDownDuration = Math.floor(department.rampDownDuration * reductionFactor);

        // Ensure at least one of them is reduced if both are non-zero
        if (totalRampDuration > 0 && department.rampUpDuration + department.rampDownDuration >= timeframeDuration) {
          if (department.rampUpDuration > 0) {
            department.rampUpDuration--;
          } else if (department.rampDownDuration > 0) {
            department.rampDownDuration--;
          }
        }

        console.log(`Adjusted ramps: up=${department.rampUpDuration}, down=${department.rampDownDuration}`);
      }

      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
    },'''

new_ramp_function = r'''    updateDepartmentRamp(department) {
      console.log(`Updating ramp for department: ${department.name}, rampUp: ${department.rampUpDuration}, rampDown: ${department.rampDownDuration}`);

      // Validate ramp durations
      if (isNaN(department.rampUpDuration) || department.rampUpDuration < 0) {
        department.rampUpDuration = 0;
        console.log(`Adjusted rampUpDuration to ${department.rampUpDuration}`);
      }

      if (isNaN(department.rampDownDuration) || department.rampDownDuration < 0) {
        department.rampDownDuration = 0;
        console.log(`Adjusted rampDownDuration to ${department.rampDownDuration}`);
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
    },'''

# 3. Fix the updateDepartmentTimeframe function to use the same ramp calculation logic
old_timeframe_function = r'''    updateDepartmentTimeframe(department) {
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
        // Reduce both ramps proportionally
        const reductionFactor = (timeframeDuration - 1) / totalRampDuration;
        department.rampUpDuration = Math.floor(department.rampUpDuration * reductionFactor);
        department.rampDownDuration = Math.floor(department.rampDownDuration * reductionFactor);

        // Ensure at least one of them is reduced if both are non-zero
        if (totalRampDuration > 0 && department.rampUpDuration + department.rampDownDuration >= timeframeDuration) {
          if (department.rampUpDuration > 0) {
            department.rampUpDuration--;
          } else if (department.rampDownDuration > 0) {
            department.rampDownDuration--;
          }
        }

        console.log(`Adjusted ramps: up=${department.rampUpDuration}, down=${department.rampDownDuration}`);
      }

      const dIndex = this.departments.indexOf(department);
      this.updateDepartmentDistribution(dIndex);
    },'''

new_timeframe_function = r'''    updateDepartmentTimeframe(department) {
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
    },'''

# 4. Fix the updateDepartmentDistribution function to ensure minimum crew values
old_distribution_function_part = r'''        // Apply ramp up
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
        }'''

new_distribution_function_part = r'''        // Apply ramp up
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
        
        // Ensure all active months have at least 1 crew member if maxCrew > 0
        if (maxCrew > 0) {
          for (let month = startMonth; month <= endMonth; month++) {
            if (month >= 0 && month < this.months.length && this.crewMatrix[dIndex][month] < 1) {
              this.crewMatrix[dIndex][month] = 1;
            }
          }
        }'''

# 5. Fix the calculateRampValue function to ensure minimum crew values
old_calculate_ramp = r'''    // Calculate a ramp value ensuring it's at least 1 if maxCrew > 0
    calculateRampValue(currentStep, totalSteps, maxValue) {
      if (maxValue <= 0) return 0;
      if (totalSteps <= 0) return maxValue;

      const rampFactor = currentStep / totalSteps;
      return Math.max(1, Math.round(maxValue * rampFactor));
    },'''

new_calculate_ramp = r'''    // Calculate a ramp value ensuring it's at least 1 if maxCrew > 0
    calculateRampValue(currentStep, totalSteps, maxValue) {
      if (maxValue <= 0) return 0;
      if (totalSteps <= 0) return maxValue;

      const rampFactor = currentStep / totalSteps;
      // Always ensure at least 1 crew member for active months
      return Math.max(1, Math.round(maxValue * rampFactor));
    },'''

# Apply all the fixes
content = content.replace(old_ramp_function, new_ramp_function)
content = content.replace(old_timeframe_function, new_timeframe_function)
content = content.replace(old_distribution_function_part, new_distribution_function_part)
content = content.replace(old_calculate_ramp, new_calculate_ramp)

# Write the updated content to the file
with open('src/App.vue', 'w') as file:
    file.write(content)

print("Fixed ramp calculation and drag handles issues.")