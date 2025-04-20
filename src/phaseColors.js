// Phase colors utility functions

// Default phase colors
export const defaultPhaseColors = [
  '#1976D2', // Blue
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336'  // Red
];

// Get a color for a phase based on its index
export function getPhaseColor(index) {
  return defaultPhaseColors[index % defaultPhaseColors.length];
}

// Get a background color for a department based on its phase
export function getDepartmentPhaseBackground(department, phases) {
  if (!department || department.phase === undefined) {
    return 'transparent';
  }
  
  // Find the phase for this department
  const phase = phases.find((p, index) => index === department.phase);
  if (!phase || !phase.color) return 'transparent';
  
  // Return the phase color with 20% opacity (33 in hex)
  return `${phase.color}33`;
}