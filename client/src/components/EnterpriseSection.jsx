import { Paper, Typography, Box } from "@mui/material";
import { borderRadius, shadows, transitions } from "../theme/designTokens";

export default function EnterpriseSection({
  title,
  subtitle,
  icon,
  children,
  action,
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}