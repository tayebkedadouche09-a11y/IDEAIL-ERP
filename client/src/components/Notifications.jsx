import { useState, useEffect, useRef } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Divider,
  Box,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ErrorIcon from "@mui/icons-material/Error";
import PaymentIcon from "@mui/icons-material/Payment";
import InventoryIcon from "@mui/icons-material/Inventory";
import FolderIcon from "@mui/icons-material/Folder";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import api from "../services/api";

const NOTIFICATION_ICONS = {
  low_stock: <InventoryIcon color="warning" />,
  overdue_invoice: <ErrorIcon color="error" />,
  delayed_project: <FolderIcon color="error" />,
  upcoming_deadline: <FolderIcon color="info" />,
  upcoming_payment: <PaymentIcon color="warning" />,
  client_debt: <ReceiptIcon color="error" />,
  supplier_debt: <AccountBalanceIcon color="warning" />,
  vat_reminder: <ReceiptIcon color="info" />,
  payment_received: <PaymentIcon color="success" />,
  project_completed: <FolderIcon color="success" />,
};

function Notifications() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = Boolean(anchorEl);

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const [notificationsRes, countRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/count"),
      ]);
      setNotifications(notificationsRes.data || []);
      setUnreadCount(countRes.data?.unread || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, is_read: 1 } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(
        notifications.map((n) => ({ ...n, is_read: 1 }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="Notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 350, maxHeight: 500 },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              sx={{
                bgcolor: notification.is_read ? "inherit" : "action.hover",
                whiteSpace: "normal",
              }}
            >
              <ListItemIcon>
                {NOTIFICATION_ICONS[notification.type] || (
                  <NotificationsIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={notification.title}
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                }
              />
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem onClick={handleMarkAllAsRead}>
              <Typography variant="body2" color="primary">
                Mark all as read
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
}

export default Notifications;