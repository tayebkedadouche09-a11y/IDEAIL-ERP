import { Paper, Typography, Box } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseInfoCard({
  title,
  items,
  icon,
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
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

      <Box>
        {items.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              py: 1,
              borderBottom: 1,
              borderColor: "divider",
              "&:last-child": { borderBottom: 0 },
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}