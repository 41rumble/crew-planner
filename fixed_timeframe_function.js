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