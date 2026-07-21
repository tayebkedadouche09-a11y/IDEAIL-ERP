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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Build as BuildIcon, Calculate as CalculateIcon } from "@mui/icons-material";
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
  name: "",
  type: "",
  category: "",
  sector: "",
  description: "",
  components: "",
  layers: "",
  consumption: "",
  specifications: "",
  material_cost: "",
  labor_cost: "",
  other_costs: "",
  selling_price: "",
  status: "active",
  notes: "",
};

export default function Systems() {
  const [systems, setSystems] = useState([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [categories, setCategories] = useState([]);
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    loadSystems();
    loadCategories();
    loadSectors();
  }, [page, limit, searchTerm, categoryFilter, sectorFilter, statusFilter]);

  async function loadSystems() {
    setLoading(true);
    try {
      const res = await api.get(`/systems?search=${searchTerm}&page=${page}&limit=${limit}&category=${categoryFilter}&sector=${sectorFilter}&status=${statusFilter}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setSystems(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setSystems(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.log(err);
      showSnackbar("Error loading systems", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/systems/categories");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function loadSectors() {
    try {
      const res = await api.get("/systems/sectors");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setSectors(res.data);
      } else {
        setSectors(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  }

  function validateForm() {
    const newErrors = {};

    if (!form.name || form.name.trim() === "") {
      newErrors.name = "System name is required";
    }

    if (form.material_cost && isNaN(Number(form.material_cost))) {
      newErrors.material_cost = "Material cost must be a number";
    }

    if (form.labor_cost && isNaN(Number(form.labor_cost))) {
      newErrors.labor_cost = "Labor cost must be a number";
    }

    if (form.other_costs && isNaN(Number(form.other_costs))) {
      newErrors.other_costs = "Other costs must be a number";
    }

    if (form.selling_price && isNaN(Number(form.selling_price))) {
      newErrors.selling_price = "Selling price must be a number";
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

  function editSystem(system) {
    setEditId(system.id);
    setForm({
      name: system.name || "",
      type: system.type || "",
      category: system.category || "",
      sector: system.sector || "",
      description: system.description || "",
      components: system.components || "",
      layers: system.layers || "",
      consumption: system.consumption || "",
      specifications: system.specifications || "",
      material_cost: system.material_cost || "",
      labor_cost: system.labor_cost || "",
      other_costs: system.other_costs || "",
      selling_price: system.selling_price || "",
      status: system.status || "active",
      notes: system.notes || "",
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
        await api.put(`/systems/${editId}`, form);
        showSnackbar("System updated successfully", "success");
      } else {
        await api.post("/systems", form);
        showSnackbar("System created successfully", "success");
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      loadSystems();
    } catch (err) {
      console.log(err);
      showSnackbar("Error saving system", "error");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteSystem() {
    if (!deleteId) return;

    try {
      await api.delete(`/systems/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar("System deleted successfully", "success");
      loadSystems();
    } catch (err) {
      console.log(err);
      showSnackbar("Error deleting system", "error");
    }
  }

  const stats = {
    total: total,
    active: systems.filter(s => s.status === "active").length,
    categories: categories.length,
    avgSellingPrice: systems.length > 0 ? systems.reduce((sum, s) => sum + (s.selling_price || 0), 0) / systems.length : 0,
    avgCost: systems.length > 0 ? systems.reduce((sum, s) => sum + (s.material_cost || 0) + (s.labor_cost || 0) + (s.other_costs || 0), 0) / systems.length : 0,
    avgMargin: systems.length > 0 ? systems.reduce((sum, s) => {
      const totalCost = (s.material_cost || 0) + (s.labor_cost || 0) + (s.other_costs || 0);
      return s.selling_price > 0 ? sum + ((s.selling_price - totalCost) / s.selling_price * 100) : sum;
    }, 0) / systems.length : 0,
  };

  const filteredSystems = systems
    .filter((s) => categoryFilter === "all" || s.category === categoryFilter)
    .filter((s) => sectorFilter === "all" || s.sector === sectorFilter)
    .filter((s) => statusFilter === "all" || s.status === statusFilter)
    .filter((s) =>
      searchTerm === "" ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title="Systems Management"
        subtitle="Manage technical systems, solutions and cost calculations"
        actionLabel="New System"
        onAction={addNew}
        icon="⚙️"
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
            title="Total Systems"
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title="Active Systems"
            value={stats.active}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title="Categories"
            value={stats.categories}
            color="info"
            icon="📁"
          />
          <EnterpriseStatCard
            title="Avg Selling Price"
            value={`${stats.avgSellingPrice.toLocaleString()} DA`}
            color="primary"
            icon="💰"
          />
          <EnterpriseStatCard
            title="Avg Cost"
            value={`${stats.avgCost.toLocaleString()} DA`}
            color="default"
            icon="📉"
          />
          <EnterpriseStatCard
            title="Avg Margin"
            value={`${stats.avgMargin.toFixed(1)}%`}
            color="success"
            icon="📈"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search systems..."
        filters={[
          { value: "all", label: "All Categories" },
          ...categories.map(c => ({ value: c, label: c })),
        ]}
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        onRefresh={loadSystems}
      />

      <EnterpriseSection title="Systems List" loading={loading}>
        {filteredSystems.length === 0 ? (
          <EnterpriseEmptyState
            message="No systems found"
            actionLabel="Add your first system"
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>System Code</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>System Name</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Sector</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Description</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Cost / Unit</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Selling Price</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Margin</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSystems.map((system) => {
                  const totalCost = (system.material_cost || 0) + (system.labor_cost || 0) + (system.other_costs || 0);
                  const margin = system.selling_price > 0 ? ((system.selling_price - totalCost) / system.selling_price * 100).toFixed(1) : 0;
                  return (
                    <tr key={system.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            <BuildIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {system.type || "SYS-" + system.id}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {system.name}
                        </Typography>
                      </td>
                      <td style={{ padding: "12px" }}>{system.category || "-"}</td>
                      <td style={{ padding: "12px" }}>{system.sector || "-"}</td>
                      <td style={{ padding: "12px" }}>{system.description || "-"}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {totalCost.toLocaleString()} DA
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {system.selling_price?.toLocaleString() || 0} DA
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Chip
                          label={`${margin}%`}
                          size="small"
                          color={margin > 20 ? "success" : margin > 10 ? "warning" : "error"}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <StatusChip status={system.status} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => editSystem(system)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(system.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  );
                })}
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? "Edit System" : "New System"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            General Information
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="System Name"
            name="name"
            value={form.name}
            onChange={change}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="System Code"
            name="type"
            value={form.type}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Category"
            name="category"
            value={form.category}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Sector"
            name="sector"
            value={form.sector}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={form.description}
            onChange={change}
            multiline
            rows={2}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Technical Information
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label="Components"
            name="components"
            value={form.components}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Layers / Steps"
            name="layers"
            value={form.layers}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Consumption"
            name="consumption"
            value={form.consumption}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Specifications"
            name="specifications"
            value={form.specifications}
            onChange={change}
            multiline
            rows={2}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Financial Information
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Material Cost (DA)"
              name="material_cost"
              type="number"
              value={form.material_cost}
              onChange={change}
              error={!!errors.material_cost}
              helperText={errors.material_cost}
            />
            <TextField
              fullWidth
              label="Labor Cost (DA)"
              name="labor_cost"
              type="number"
              value={form.labor_cost}
              onChange={change}
              error={!!errors.labor_cost}
              helperText={errors.labor_cost}
            />
          </Box>
          <TextField
            fullWidth
            margin="normal"
            label="Other Costs (DA)"
            name="other_costs"
            type="number"
            value={form.other_costs}
            onChange={change}
            error={!!errors.other_costs}
            helperText={errors.other_costs}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Selling Price (DA)"
            name="selling_price"
            type="number"
            value={form.selling_price}
            onChange={change}
            error={!!errors.selling_price}
            helperText={errors.selling_price}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={form.status}
            onChange={change}
          >
            <MenuItem value="active">🟢 Active</MenuItem>
            <MenuItem value="draft">🟡 Draft</MenuItem>
            <MenuItem value="archived">🔴 Archived</MenuItem>
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={change}
            multiline
            rows={2}
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
        onConfirm={deleteSystem}
        title="Delete System"
        message="Are you sure you want to delete this system? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}