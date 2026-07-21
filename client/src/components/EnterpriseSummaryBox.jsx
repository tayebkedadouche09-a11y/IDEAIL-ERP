import { Box, Typography } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseSummaryBox({
  title,
  value,
  icon,
  color = "primary",
  sx,
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: borderRadius.lg,
        bgcolor: `${color}.light`,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {title}
          </Typography>
          <Typography variant="h6" fontWeight="bold" color={`${color}.main`}>
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.lg,
              bgcolor: "background.paper",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Box>
  );
}