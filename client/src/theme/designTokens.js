// Design Tokens for IDEAIL ERP
// Professional enterprise design system

// Spacing scale (based on 8px grid)
export const spacing = {
  xs: 0.5,   // 4px
  sm: 1,     // 8px
  md: 2,     // 16px
  lg: 3,     // 24px
  xl: 4,     // 32px
  xxl: 6,    // 48px
  xxxl: 8,   // 64px
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows (Material Design elevation)
export const shadows = {
  card: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
  elevated: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
  modal: "0 10px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)",
  button: "0 2px 4px rgba(0,0,0,0.1)",
  buttonHover: "0 4px 8px rgba(0,0,0,0.15)",
};

// Transitions
export const transitions = {
  fast: "all 0.15s ease-in-out",
  normal: "all 0.25s ease-in-out",
  slow: "all 0.35s ease-in-out",
};

// Z-index layers
export const zIndex = {
  drawer: 1200,
  header: 1100,
  modal: 1300,
  tooltip: 1500,
};

// Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Component sizes
export const sizes = {
  sidebarWidth: 260,
  sidebarWidthCollapsed: 72,
  headerHeight: 64,
  footerHeight: 48,
};

export default {
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  sizes,
};