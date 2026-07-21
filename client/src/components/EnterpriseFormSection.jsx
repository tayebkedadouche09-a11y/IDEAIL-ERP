import { Box, Typography, Divider } from "@mui/material";
import { borderRadius, transitions } from "../theme/designTokens";

export default function EnterpriseFormSection({
  title,
  children,
  sx,
}) {
  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  );
}