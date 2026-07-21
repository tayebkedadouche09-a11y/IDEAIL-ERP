import { Box } from "@mui/material";

/**
 * Minimal layout for login page (no sidebar/header)
 */
export default function LoginLayout({ children }) {
  return (
    <Box sx={{ display: "flex" }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}