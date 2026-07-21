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
  Avatar,
  TablePagination,
  Snackbar,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Inventory as InventoryIcon, Warning as WarningIcon, CheckCircle as CheckCircleIcon, History as HistoryIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import ConfirmDialog from "../components/ConfirmDialog";

const emptyForm = {
  product_id: "",
  movement_type: "Entrée",
  quantity: "",
  notes: "",
};

export default function Stock() {
  const [tab, setTab] = useState(0);
  const [movements, setMovements] = useState([]);
  const [balance, setBalance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [page, limit, searchTerm]);

  async function loadData() {
    setLoading(true);
    try {
      const [movementsRes, balanceRes, alertsRes, valuationRes, productsRes] =
        await Promise.all([
          api.get(`/stock/movements?page=${page}&limit=${limit}&search=${searchTerm}`),
          api.get("/stock/balance"),
          api.get("/stock/alerts"),
          api.get("/stock/valuation"),
          api.get("/products"),
        ]);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(movementsRes.data)) {
        setMovements(movementsRes.data);
        setTotal(movementsRes.data.length);
        setTotalPages(1);
      } else {
        setMovements(movementsRes.data.data || []);
        setTotal(movementsRes.data.pagination?.total || 0);
        setTotalPages(movementsRes.data.pagination?.totalPages || 1);
      }
      setBalance(balanceRes.data || []);
      setAlerts(alertsRes.data || []);
      setValuation(valuationRes.data);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(productsRes.data)) {
        setProducts(productsRes.data);
      } else {
        setProducts(productsRes.data.data || []);
      }
      calculateStats(balanceRes.data || [], movementsRes.data || [], valuationRes.data);
    } catch (err) {
      console.log(err);
      showSnackbar("Error loading stock data", "error");
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function calculateStats(balanceData, movementsData, valuationData) {
    const lowStock = balanceData.filter(p => p.quantity <= p.minimum_quantity && p.quantity > 0).length;
    const outOfStock = balanceData.filter(p => p.quantity === 0).length;
    const incoming = movementsData.filter(m => m.movement_type === "Entrée").reduce((sum, m) => sum + (m.quantity || 0), 0);
    const used = movementsData.filter(m => m.movement_type === "Sortie").reduce((sum, m) => sum + (m.quantity || 0), 0);

    const newStats = {
      totalItems: balanceData.length,
      totalValue: valuationData?.totalValue || 0,
      lowStock: lowStock,
      outOfStock: outOfStock,
      incoming: incoming,
      used: used,
    };
    setStats(newStats);
  }

  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    incoming: 0,
    used: 0,
  });

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!form.product_id) {
      newErrors.product_id = "Product is required";
    }

    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function addNew() {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }

  function editMovement(item) {
    setEditId(item.id);
    setForm({
      product_id: item.product_id,
      movement_type: item.movement_type,
      quantity: item.quantity,
      notes: item.notes || "",
    });
    setErrors({});
    setOpen(true);
  }

  async function save() {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/stock/movements/${editId}`, form);
        showSnackbar("Movement updated successfully", "success");
      } else {
        await api.post("/stock/movements", form);
        showSnackbar("Movement added successfully", "success");
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      loadData();
    } catch (err) {
      console.log(err);
      showSnackbar("Error saving movement", "error");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteMovement() {
    if (!deleteId) return;

    try {
      await api.delete(`/stock/movements/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar("Movement deleted successfully", "success");
      loadData();
    } catch (err) {
      console.log(err);
      showSnackbar("Error deleting movement", "error");
    }
  }

  function getStatusColor(status) {
    if (status === "critical") return "error";
    if (status === "warning") return "warning";
    return "success";
  }

  return (
    <Box>
      <PageHeader
        title="Stock Management"
        subtitle="Monitor inventory levels and material movements"
        actionLabel="Add Stock"
        onAction={addNew}
        icon="📦"
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

      <EnterpriseSection title="Statistics" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title="Total Items"
            value={stats.totalItems}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title="Inventory Value"
            value={`${stats.totalValue.toLocaleString()} DA`}
            color="success"
            icon="💰"
          />
          <EnterpriseStatCard
            title="Low Stock"
            value={stats.lowStock}
            color="warning"
            icon="⚠️"
          />
          <EnterpriseStatCard
            title="Out of Stock"
            value={stats.outOfStock}
            color="error"
            icon="❌"
          />
          <EnterpriseStatCard
            title="Incoming Stock"
            value={stats.incoming.toLocaleString()}
            color="info"
            icon="📥"
          />
          <EnterpriseStatCard
            title="Used in Projects"
            value={stats.used.toLocaleString()}
            color="default"
            icon="📤"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title="Stock Overview" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title="Available Stock" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {stats.totalItems - stats.lowStock - stats.outOfStock}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Products in good condition
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title="Reserved Materials" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {stats.lowStock}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Below minimum threshold
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title="Consumed Materials" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {stats.outOfStock}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Out of stock
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title="Stock Alerts" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {alerts.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active alerts
            </Typography>
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search movements..."
        onRefresh={loadData}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Movements (${movements.length})`} />
          <Tab label={`Balance (${balance.length})`} />
          <Tab label={`Alerts (${alerts.length})`} />
          <Tab label="Valuation" />
        </Tabs>
      </Box>

      {/* TAB 0: Movements */}
      {tab === 0 && (
        <EnterpriseSection title="Stock Movements" loading={loading}>
          {movements.length === 0 ? (
            <EnterpriseEmptyState
              message="No movements yet"
              actionLabel="Add your first movement"
              onAction={addNew}
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Product</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Type</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Quantity</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Notes</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>{m.product_name}</td>
                      <td style={{ padding: "12px" }}>
                        <Chip
                          label={m.movement_type}
                          size="small"
                          color={m.movement_type === "Entrée" ? "success" : "warning"}
                          variant="outlined"
                        />
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{m.quantity}</td>
                      <td style={{ padding: "12px" }}>{m.notes || "-"}</td>
                      <td style={{ padding: "12px" }}>{m.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => editMovement(m)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(m.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <TablePagination
                  component="div"
                  count={total}
                  page={page - 1}
                  onPageChange={(e, newPage) => setPage(newPage + 1)}
                  rowsPerPage={limit}
                  onRowsPerPageChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  labelRowsPerPage="Rows per page"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                />
              )}
            </Box>
          )}
        </EnterpriseSection>
      )}

      {/* TAB 1: Balance */}
      {tab === 1 && (
        <EnterpriseSection title="Stock Balance" loading={loading}>
          {balance.length === 0 ? (
            <EnterpriseEmptyState
              message="No products in stock"
              actionLabel="Add stock"
              onAction={addNew}
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Product</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Category</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Unit</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Quantity</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Min Qty</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>{p.name}</td>
                      <td style={{ padding: "12px" }}>{p.category || "-"}</td>
                      <td style={{ padding: "12px" }}>{p.unit || "-"}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{p.quantity}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{p.minimum_quantity}</td>
                      <td style={{ padding: "12px" }}>
                        <StatusChip status={p.stock_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </EnterpriseSection>
      )}

      {/* TAB 2: Alerts */}
      {tab === 2 && (
        <EnterpriseSection title="Stock Alerts" loading={loading}>
          {alerts.length === 0 ? (
            <EnterpriseEmptyState
              message="All products are well stocked"
              icon="✅"
            />
          ) : (
            <Box>
              {alerts.map((alert) => (
                <Box
                  key={alert.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor:
                      alert.severity === "critical"
                        ? "#ffebee"
                        : alert.severity === "warning"
                        ? "#fff3e0"
                        : "#e3f2fd",
                    border: 1,
                    borderColor:
                      alert.severity === "critical"
                        ? "#ef9a9a"
                        : alert.severity === "warning"
                        ? "#ffcc80"
                        : "#90caf9",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {alert.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stock: {alert.quantity} / Min: {alert.minimum_quantity} (
                      {Math.round((alert.quantity / alert.minimum_quantity) * 100)}%)
                    </Typography>
                  </Box>
                  <Chip
                    label={
                      alert.severity === "critical"
                        ? "Critical"
                        : alert.severity === "warning"
                        ? "Warning"
                        : "Low"
                    }
                    size="small"
                    color={getStatusColor(alert.severity)}
                  />
                </Box>
              ))}
            </Box>
          )}
        </EnterpriseSection>
      )}

      {/* TAB 3: Valuation */}
      {tab === 3 && (
        <EnterpriseSection title="Stock Valuation" loading={loading}>
          {valuation && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Total Stock Value: {valuation.totalValue?.toLocaleString()} DA
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {valuation.itemCount} products in stock
              </Typography>
            </Box>
          )}
          {valuation?.items?.length === 0 ? (
            <EnterpriseEmptyState
              message="No stock to value"
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Product</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Purchase Price</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {valuation?.items?.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>{p.name}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>{p.quantity}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {p.purchase_price?.toLocaleString()} DA
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {p.total_value?.toLocaleString()} DA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </EnterpriseSection>
      )}

      {/* Movement Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId ? "Edit Movement" : "New Stock Movement"}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Product"
            name="product_id"
            value={form.product_id}
            onChange={change}
            error={!!errors.product_id}
            helperText={errors.product_id}
            sx={{ mt: 1, mb: 2 }}
          >
            <MenuItem value="">Select Product</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} (Stock: {p.quantity})
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              select
              fullWidth
              label="Type"
              name="movement_type"
              value={form.movement_type}
              onChange={change}
            >
              <MenuItem value="Entrée">Entrée (In)</MenuItem>
              <MenuItem value="Sortie">Sortie (Out)</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={change}
              error={!!errors.quantity}
              helperText={errors.quantity}
              inputProps={{ min: 0 }}
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={change}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteMovement}
        title="Delete Movement"
        message="Are you sure you want to delete this movement? This action cannot be undone and will reverse the stock change."
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}