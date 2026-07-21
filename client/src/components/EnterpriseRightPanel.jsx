import { Box, Typography, Paper } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseRightPanel({
  title,
  icon,
  children,
  sticky = true,
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        position: sticky ? { lg: "sticky" } : undefined,
        top: sticky ? 80 : undefined,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
        }}
      >
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.lg,
              bgcolor: "primary.light",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 1.5,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}