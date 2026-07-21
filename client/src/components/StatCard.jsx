import { Paper, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

export default function StatCard({
  title,
  value,
  icon,
  color = "#1976d2",
  subtitle,
  trend,
  trendLabel,
}) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <Paper
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        },
        height: "100%",
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${color}15`,
          fontSize: 28,
          flexShrink: 0,
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

        {trend !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            {isPositive && (
              <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />
            )}
            {isNegative && (
              <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: isPositive
                  ? "success.main"
                  : isNegative
                  ? "error.main"
                  : "text.secondary",
                fontWeight: 500,
              }}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
              {trendLabel && ` ${trendLabel}`}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}