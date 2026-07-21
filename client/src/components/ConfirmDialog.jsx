import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { borderRadius, spacing } from "../theme/designTokens";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import HelpIcon from "@mui/icons-material/Help";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default",
  loading = false,
}) {
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <WarningIcon sx={{ fontSize: 48, color: "warning.main" }} />;
      case "error":
        return <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />;
      case "info":
        return <InfoIcon sx={{ fontSize: 48, color: "info.main" }} />;
      default:
        return <HelpIcon sx={{ fontSize: 48, color: "primary.main" }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: borderRadius.lg,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {getIcon()}
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 1 }}>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: borderRadius.full,
            px: spacing.lg,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={type === "error" ? "error" : "primary"}
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: borderRadius.full,
            px: spacing.lg,
          }}
        >
          {loading ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}