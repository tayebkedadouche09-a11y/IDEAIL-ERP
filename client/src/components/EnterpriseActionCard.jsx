import { Paper, Typography, Box, Button } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseActionCard({
  title,
  description,
  icon,
  onClick,
  color = "primary",
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        textAlign: "center",
        transition: transitions.fast,
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: shadows.elevated,
        },
        ...sx,
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: borderRadius.full,
          bgcolor: `${color}.light`,
          color: `${color}.main`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 1.5,
        }}
      >
        {icon}
      </Box>

      <Typography variant="body2" fontWeight="medium" mb={0.5}>
        {title}
      </Typography>

      {description && (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      )}
    </Paper>
  );
}