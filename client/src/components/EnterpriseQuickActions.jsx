import { Box, Typography, Button } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseQuickActions({
  actions,
  sx,
}) {
  return (
    <Box sx={{ ...sx }}>
      {actions.map((action, index) => (
        <Button
          key={index}
          fullWidth
          variant={action.variant || "outlined"}
          startIcon={action.icon}
          onClick={action.onClick}
          sx={{
            mb: 1,
            borderRadius: borderRadius.lg,
            ...action.sx,
          }}
        >
          {action.label}
        </Button>
      ))}
    </Box>
  );
}