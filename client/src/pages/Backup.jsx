import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Chip,
  IconButton,
  Box,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  TablePagination,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Download as DownloadIcon, Backup as BackupIcon, Storage as StorageIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteFile, setDeleteFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    loadBackups();
    loadStats();
  }, []);

  async function loadBackups() {
    setLoading(true);
    try {
      const res = await api.get("/backup/list");
      setBackups(res.data || []);
    } catch (err) {
      showSnackbar("Error loading backups", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await api.get("/backup/stats");
      setStats(res.data || { totalBackups: 0, totalSize: 0 });
    } catch (err) {
      console.log(err);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  async function createBackup() {
    setCreating(true);
    try {
      const res = await api.post("/backup/create");
      showSnackbar("Backup created successfully", "success");
      loadBackups();
      loadStats();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Failed to create backup", "error");
    } finally {
      setCreating(false);
    }
  }

  function openDeleteDialog(filename) {
    setDeleteFile(filename);
    setOpenDelete(true);
  }

  async function deleteBackup() {
    if (!deleteFile) return;

    try {
      await api.delete(`/backup/${deleteFile}`);
      setOpenDelete(false);
      setDeleteFile(null);
      showSnackbar("Backup deleted", "success");
      loadBackups();
      loadStats();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Failed to delete backup", "error");
    }
  }

  function downloadBackup(filename) {
    window.open(`http://localhost:3000/backup/download/${filename}`, "_blank");
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <Box>
      <PageHeader
        title="Backup"
        subtitle="Database backup and restore management"
        actionLabel="Create Backup"
        onAction={createBackup}
        icon="💾"
      />

      {snackbar.open && (
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}

      {creating && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Creating backup...
          </Typography>
        </Box>
      )}

      <EnterpriseSection title="Backup Statistics" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title="Total Backups"
            value={stats.totalBackups}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title="Total Size"
            value={formatSize(stats.totalSize)}
            color="info"
            icon="💾"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Search backups..."
        onRefresh={loadBackups}
      />

      <EnterpriseSection title="Backup Files" loading={loading}>
        {backups.length === 0 ? (
          <EnterpriseEmptyState
            message="No backups found"
            actionLabel="Create your first backup"
            onAction={createBackup}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>File</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Size</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Created</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.filename} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {backup.filename}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>{formatSize(backup.size)}</td>
                    <td style={{ padding: "12px" }}>
                      {new Date(backup.created).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Download">
                          <IconButton size="small" color="primary" onClick={() => downloadBackup(backup.filename)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDeleteDialog(backup.filename)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </EnterpriseSection>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteBackup}
        title="Delete Backup"
        message="Are you sure you want to delete this backup file?"
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}