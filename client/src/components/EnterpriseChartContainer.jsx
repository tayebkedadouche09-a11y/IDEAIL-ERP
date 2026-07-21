import { Box, Typography } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseChartContainer({
  title,
  children,
  loading = false,
  height = 300,
  sx,
}) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        ...sx,
      }}
    >
      <Typography variant="h6" fontWeight="bold" mb={2}>
        {title}
      </Typography>
      {loading ? (
        <Box
          sx={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}