import { Box, Typography } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseEmptyState({
  icon = "📭",
  title = "No data available",
  description,
  action,
  sx,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        textAlign: "center",
        ...sx,
      }}
    >
      <Typography variant="h3" sx={{ mb: 1, opacity: 0.3 }}>
        {icon}
      </Typography>
      <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}