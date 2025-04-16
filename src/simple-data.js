/**
 * Simple data for the crew planning tool
 */

export const simpleData = {
  years: [2022, 2023, 2024, 2025],
  months: [
    'Jan 2022', 'Feb 2022', 'Mar 2022', 'Apr 2022', 'May 2022', 'Jun 2022', 'Jul 2022', 'Aug 2022', 'Sep 2022', 'Oct 2022', 'Nov 2022', 'Dec 2022',
    'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023', 'Jul 2023', 'Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023',
    'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024',
    'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'
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