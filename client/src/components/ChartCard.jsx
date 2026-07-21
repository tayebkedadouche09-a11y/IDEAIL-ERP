import { Paper, Typography, Box, Skeleton } from "@mui/material";
import { spacing, borderRadius, shadows } from "../theme/designTokens";

export default function ChartCard({
  title,
  children,
  loading = false,
  height = 300,
  action,
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
        {action}
      </Box>

      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={height} />
      ) : (
        <Box sx={{ height: height }}>{children}</Box>
      )}
    </Paper>
  );
}