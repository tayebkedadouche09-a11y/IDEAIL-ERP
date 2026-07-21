// Professional Enterprise Color Palette for IDEAIL ERP

// Light Mode Colors
export const lightColors = {
  primary: "#2563eb",      // Indigo 600
  primaryLight: "#60a5fa", // Indigo 400
  primaryDark: "#1d4ed8",  // Indigo 700
  
  secondary: "#0891b2",   // Cyan 600
  secondaryLight: "#22d3ee", // Cyan 400
  secondaryDark: "#0e7490",  // Cyan 700
  
  background: "#f8fafc",   // Slate 50
  surface: "#ffffff",      // White
  card: "#ffffff",         // White
  
  text: "#0f172a",        // Slate 900
  textSecondary: "#64748b", // Slate 500
  textTertiary: "#94a3b8",   // Slate 400
  
  border: "#e2e8f0",      // Slate 200
  divider: "#f1f5f9",     // Slate 100
  
  success: "#16a34a",     // Green 600
  successLight: "#4ade80", // Green 400
  successDark: "#15803d",  // Green 700
  
  warning: "#d97706",     // Amber 600
  warningLight: "#fcd34d", // Amber 400
  warningDark: "#b45309",  // Amber 700
  
  error: "#dc2626",       // Red 600
  errorLight: "#f87171",  // Red 400
  errorDark: "#b91c1c",   // Red 700
  
  info: "#2563eb",        // Indigo 600
  infoLight: "#60a5fa",   // Indigo 400
  infoDark: "#1d4ed8",    // Indigo 700
  
  sidebar: "#1e293b",     // Slate 800
  sidebarText: "#f1f5f9", // Slate 100
  sidebarHover: "#334155", // Slate 700
};

// Dark Mode Colors
export const darkColors = {
  primary: "#60a5fa",      // Indigo 400
  primaryLight: "#93c5fd", // Indigo 300
  primaryDark: "#3b82f6",  // Indigo 500
  
  secondary: "#22d3ee",   // Cyan 400
  secondaryLight: "#67e8f9", // Cyan 300
  secondaryDark: "#0891b2",  // Cyan 600
  
  background: "#0f172a",   // Slate 900
  surface: "#1e293b",     // Slate 800
  card: "#1e293b",        // Slate 800
  
  text: "#f1f5f9",        // Slate 100
  textSecondary: "#cbd5e1", // Slate 300
  textTertiary: "#94a3b8",  // Slate 400
  
  border: "#334155",      // Slate 700
  divider: "#1e293b",     // Slate 800
  
  success: "#4ade80",     // Green 400
  successLight: "#86efac",  // Green 300
  successDark: "#22c55e",   // Green 500
  
  warning: "#fcd34d",     // Amber 400
  warningLight: "#fef08a", // Amber 300
  warningDark: "#facc15",  // Amber 500
  
  error: "#f87171",       // Red 400
  errorLight: "#fca5a5",   // Red 300
  errorDark: "#ef4444",    // Red 500
  
  info: "#60a5fa",        // Indigo 400
  infoLight: "#93c5fd",    // Indigo 300
  infoDark: "#3b82f6",     // Indigo 500
  
  sidebar: "#0f172a",     // Slate 900
  sidebarText: "#f1f5f9", // Slate 100
  sidebarHover: "#1e293b", // Slate 800
};

// Default export (light mode for backward compatibility)
const colors = {
  ...lightColors,
};

export default colors;