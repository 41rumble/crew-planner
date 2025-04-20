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

// Get a faded color for a department based on its phase
export function getDepartmentColor(phaseColor, opacity = 0.2) {
  if (!phaseColor) return 'transparent';
  
  // Convert hex color to rgba
  let hex = phaseColor;
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  
  // Parse the hex color
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    return 'transparent';
  }
  
  // Return rgba color with opacity
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}