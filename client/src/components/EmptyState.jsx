import { Box, Typography, Button } from "@mui/material";
import { borderRadius, spacing } from "../theme/designTokens";

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  sx,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: spacing.xxxl,
        px: spacing.lg,
        textAlign: "center",
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            mb: spacing.lg,
            opacity: 0.5,
          }}
        >
          {icon}
        </Box>
      )}
      
      <Typography
        variant="h5"
        fontWeight="bold"
        color="text.secondary"
        sx={{ mb: 1 }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {description}
        </Typography>
      )}
      
      {actionText && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            borderRadius: borderRadius.full,
            px: spacing.xl,
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
}