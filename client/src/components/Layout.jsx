import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext";
import { sizes } from "../theme/designTokens";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode } = useThemeMode();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header - Fixed at top */}
      <Header />

      {/* Sidebar - Fixed on left */}
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: `${sizes.headerHeight}px`,
          ml: { xs: 0, md: `${sizes.sidebarWidth}px` },
          transition: "margin-left 0.3s ease-in-out",
          minHeight: `calc(100vh - ${sizes.headerHeight}px)`,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}