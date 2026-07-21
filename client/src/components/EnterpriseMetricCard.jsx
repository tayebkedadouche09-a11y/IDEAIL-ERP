import { Paper, Typography, Box } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseMetricCard({
  title,
  value,
  unit,
  color = "primary",
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        textAlign: "center",
        transition: transitions.fast,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: shadows.elevated,
        },
        ...sx,
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
        {value}
        {unit && <span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span>}
      </Typography>
    </Paper>
  );
}