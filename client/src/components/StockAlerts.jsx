import { useEffect, useState } from "react";
import { Box, Typography, Chip, IconButton, Alert } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import api from "../services/api";

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "error",
    bgcolor: "#ffebee",
    borderColor: "#ef9a9a",
  },
  warning: {
    label: "Warning",
    color: "warning",
    bgcolor: "#fff3e0",
    borderColor: "#ffcc80",
  },
  info: {
    label: "Low",
    color: "info",
    bgcolor: "#e3f2fd",
    borderColor: "#90caf9",
  },
};

export default function StockAlerts({ refreshInterval = 60000 }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlerts() {
    try {
      const res = await api.get("/stock/alerts");
      setAlerts(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load stock alerts");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();

    if (refreshInterval > 0) {
      const interval = setInterval(loadAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">Loading alerts...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (alerts.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          ✅
        </Typography>
        <Typography color="text.secondary">
          All products are well stocked
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          ⚠️ Low Stock Alerts ({alerts.length})
        </Typography>
        <IconButton size="small" onClick={loadAlerts} title="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {alerts.map((alert) => {
        const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
        const percentage = Math.round((alert.quantity / alert.minimum_quantity) * 100);

        return (
          <Box
            key={alert.id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              mb: 1.5,
              borderRadius: 1,
              bgcolor: config.bgcolor,
              border: 1,
              borderColor: config.borderColor,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateX(4px)",
              },
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight="bold">
                  {alert.name}
                </Typography>
                <Chip
                  label={config.label}
                  size="small"
                  color={config.color}
                  sx={{ height: 24 }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Stock: <strong>{alert.quantity}</strong> / Min: <strong>{alert.minimum_quantity}</strong>
                {" "}({percentage}%)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 100,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: "#e0e0e0",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(percentage, 100)}%`,
                    height: "100%",
                    bgcolor:
                      alert.severity === "critical"
                        ? "#d32f2f"
                        : alert.severity === "warning"
                        ? "#ed6c02"
                        : "#0288d1",
                    transition: "width 0.3s",
                  }}
                />
              </Box>
              <IconButton
                size="small"
                color="primary"
                title="Quick restock"
                onClick={() => {
                  // Navigate to stock page with product pre-selected
                  window.location.href = `/stock?product=${alert.id}`;
                }}
              >
                <ShoppingCartIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}