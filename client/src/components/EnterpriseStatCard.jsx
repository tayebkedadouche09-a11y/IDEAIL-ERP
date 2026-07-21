import { Paper, Typography, Box } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseStatCard({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  trend,
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        transition: transitions.fast,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: shadows.elevated,
        },
        height: "100%",
        ...sx,
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: borderRadius.lg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          flexShrink: 0,
          bgcolor: `${color}.light`,
          color: `${color}.main`,
        }}
      >
        {icon}
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>

        <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
          {typeof value === "number" ? value.toLocaleString() : value || "0"}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}