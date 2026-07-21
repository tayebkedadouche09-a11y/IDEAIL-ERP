import { createTheme } from "@mui/material/styles";
import { lightColors, darkColors } from "./colors";
import { spacing, borderRadius, shadows } from "./designTokens";

// Light theme
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: lightColors.primary,
      light: lightColors.primaryLight,
      dark: lightColors.primaryDark,
    },
    secondary: {
      main: lightColors.secondary,
      light: lightColors.secondaryLight,
      dark: lightColors.secondaryDark,
    },
    background: {
      default: lightColors.background,
      paper: lightColors.surface,
    },
    text: {
      primary: lightColors.text,
      secondary: lightColors.textSecondary,
    },
    success: {
      main: lightColors.success,
    },
    warning: {
      main: lightColors.warning,
    },
    error: {
      main: lightColors.error,
    },
    info: {
      main: lightColors.info,
    },
    divider: lightColors.divider,
  },
  typography: {
    fontFamily: "'Inter', 'Arial', 'sans-serif'",
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: borderRadius.lg,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: shadows.card,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: shadows.card,
          borderRadius: borderRadius.lg,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
          textTransform: "none",
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: shadows.buttonHover,
          },
        },
        contained: {
          boxShadow: shadows.button,
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: darkColors.primary,
      light: darkColors.primaryLight,
      dark: darkColors.primaryDark,
    },
    secondary: {
      main: darkColors.secondary,
      light: darkColors.secondaryLight,
      dark: darkColors.secondaryDark,
    },
    background: {
      default: darkColors.background,
      paper: darkColors.surface,
    },
    text: {
      primary: darkColors.text,
      secondary: darkColors.textSecondary,
    },
    success: {
      main: darkColors.success,
    },
    warning: {
      main: darkColors.warning,
    },
    error: {
      main: darkColors.error,
    },
    info: {
      main: darkColors.info,
    },
    divider: darkColors.divider,
  },
  typography: {
    fontFamily: "'Inter', 'Arial', 'sans-serif'",
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: borderRadius.lg,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: shadows.card,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: shadows.card,
          borderRadius: borderRadius.lg,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
          textTransform: "none",
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: shadows.buttonHover,
          },
        },
        contained: {
          boxShadow: shadows.button,
        },
      },
    },
  },
});

// Default export (light theme for backward compatibility)
export default lightTheme;