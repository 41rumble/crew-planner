/**
 * Simple data for the crew planning tool
 */

export const simpleData = {
  years: [1, 2, 3, 4],
  months: [
    'Jan Y1', 'Feb Y1', 'Mar Y1', 'Apr Y1', 'May Y1', 'Jun Y1', 'Jul Y1', 'Aug Y1', 'Sep Y1', 'Oct Y1', 'Nov Y1', 'Dec Y1',
    'Jan Y2', 'Feb Y2', 'Mar Y2', 'Apr Y2', 'May Y2', 'Jun Y2', 'Jul Y2', 'Aug Y2', 'Sep Y2', 'Oct Y2', 'Nov Y2', 'Dec Y2',
    'Jan Y3', 'Feb Y3', 'Mar Y3', 'Apr Y3', 'May Y3', 'Jun Y3', 'Jul Y3', 'Aug Y3', 'Sep Y3', 'Oct Y3', 'Nov Y3', 'Dec Y3',
    'Jan Y4', 'Feb Y4', 'Mar Y4', 'Apr Y4', 'May Y4', 'Jun Y4', 'Jul Y4', 'Aug Y4', 'Sep Y4', 'Oct Y4', 'Nov Y4', 'Dec Y4'
  ],
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
      endMonth: 14,
      rampUpDuration: 1,
      rampDownDuration: 1,
      rate: 8000
    },
    {
      name: 'Concept Artists (Environment)',
      maxCrew: 4,
      startMonth: 0,
      endMonth: 14,
      rampUpDuration: 1,
      rampDownDuration: 1,
      rate: 8000
    },
    {
      name: 'Character Modeller',
      maxCrew: 6,
      startMonth: 0,
      endMonth: 10,
      rampUpDuration: 1,
      rampDownDuration: 1,
      rate: 7500
    },
    {
      name: 'Character Rigger',
      maxCrew: 6,
      startMonth: 0,
      endMonth: 14,
      rampUpDuration: 2,
      rampDownDuration: 2,
      rate: 8000
    },
    {
      name: 'Technical Director',
      maxCrew: 4,
      startMonth: 6,
      endMonth: 22,
      rampUpDuration: 2,
      rampDownDuration: 1,
      rate: 10000
    },
    {
      name: 'Animators',
      maxCrew: 60,
      startMonth: 11,
      endMonth: 40,
      rampUpDuration: 4,
      rampDownDuration: 2,
      rate: 7000
    },
    {
      name: 'Lighters',
      maxCrew: 80,
      startMonth: 11,
      endMonth: 40,
      rampUpDuration: 4,
      rampDownDuration: 2,
      rate: 7500
    },
    {
      name: 'VFX Artists',
      maxCrew: 30,
      startMonth: 11,
      endMonth: 40,
      rampUpDuration: 3,
      rampDownDuration: 2,
      rate: 8000
    },
    {
      name: 'Composite',
      maxCrew: 40,
      startMonth: 11,
      endMonth: 40,
      rampUpDuration: 3,
      rampDownDuration: 2,
      rate: 7800
    }
  ],
  crewMatrix: []
};

// Generate the crew matrix based on department data
simpleData.crewMatrix = simpleData.departments.map(dept => {
  const { startMonth, endMonth, maxCrew, rampUpDuration, rampDownDuration } = dept;
  const crewArray = new Array(simpleData.months.length).fill(0);
  
  // Calculate the plateau duration (full crew period)
  const plateauStart = startMonth + rampUpDuration;
  const plateauEnd = endMonth - rampDownDuration;
  
  // Apply ramp up
  for (let i = 0; i < rampUpDuration; i++) {
    const month = startMonth + i;
    const crewSize = Math.round((i + 1) * maxCrew / rampUpDuration);
    crewArray[month] = crewSize;
  }
  
  // Apply plateau (full crew)
  for (let month = plateauStart; month <= plateauEnd; month++) {
    crewArray[month] = maxCrew;
  }
  
  // Apply ramp down
  for (let i = 0; i < rampDownDuration; i++) {
    const month = plateauEnd + 1 + i;
    const crewSize = Math.round(maxCrew * (rampDownDuration - i - 1) / rampDownDuration);
    crewArray[month] = crewSize;
  }
  
  return crewArray;
});