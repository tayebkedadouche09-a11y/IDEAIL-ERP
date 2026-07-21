import { Box, Typography } from "@mui/material";
import { borderRadius, transitions } from "../theme/designTokens";

export default function EnterpriseInfoList({
  items,
  sx,
}) {
  return (
    <Box sx={{ ...sx }}>
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
  );
}