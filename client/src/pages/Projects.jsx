import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Typography,
  useMediaQuery,
  TablePagination,
  Snackbar,
  Alert,
} from "@mui/material";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import StatusChip from "../components/StatusChip";
import ConfirmDialog from "../components/ConfirmDialog";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTheme } from "@mui/material/styles";

import { useLanguage } from "../context/LanguageContext";

function Projects() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [systems, setSystems] = useState([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const emptyForm = {
    client_id: "",
    system_id: "",
    name: "",
    description: "",
    surface_m2: 0,
    start_date: "",
    end_date: "",
    status: "new",
    amount: "",
  };

  const [form, setForm] = useState(emptyForm);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    loadProjects();
    loadClients();
    loadSystems();
  }, [page, limit, search, statusFilter, clientFilter]);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await api.get(`/projects?search=${search}&page=${page}&limit=${limit}&status=${statusFilter}&client_id=${clientFilter}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setProjects(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setProjects(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorLoadingProjects"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const res = await api.get("/clients");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setClients(res.data);
      } else {
        setClients(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function loadSystems() {
    try {
      const res = await api.get("/systems");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setSystems(res.data);
      } else {
        setSystems(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function addNewProject() {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }

  function editProject(project) {
    setEditId(project.id);
    setForm({
      client_id: project.client_id || "",
      system_id: project.system_id || "",
      name: project.name || "",
      description: project.description || "",
      surface_m2: project.surface_m2 || 0,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status || "new",
      amount: project.amount || "",
    });
    setErrors({});
    setOpen(true);
  }

  function validateForm() {
    const newErrors = {};

    if (!form.client_id) {
      newErrors.client_id = t("clientRequired");
    }

    if (!form.name || form.name.trim() === "") {
      newErrors.name = t("projectNameRequired");
    }

    if (form.amount && isNaN(Number(form.amount))) {
      newErrors.amount = t("amountMustBeNumber");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined,
      });
    }
  }

  async function saveProject() {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/projects/${editId}`, form);
        showSnackbar(t("projectUpdatedSuccessfully"), "success");
      } else {
        await api.post("/projects", form);
        showSnackbar(t("projectCreatedSuccessfully"), "success");
      }
      setOpen(false);
      loadProjects();
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorSavingProject"), "error");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteProject() {
    if (!deleteId) return;

    try {
      await api.delete(`/projects/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar(t("projectDeletedSuccessfully"), "success");
      loadProjects();
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorDeletingProject"), "error");
    }
  }

  // Calculate statistics
  const totalProjects = total;
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const delayedProjects = projects.filter((p) => p.status === "on_hold").length;
  const totalRevenue = projects.reduce((sum, p) => sum + (p.amount || 0), 0);
  const estimatedProfit = projects.reduce((sum, p) => sum + (p.profit || 0), 0);

  // Filter projects (for local search if needed)
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesClient = !clientFilter || p.client_id === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title={t("projects")}
        subtitle={t("projectPortfolioManagement")}
        icon="📁"
        onRefresh={loadProjects}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addNewProject}
          >
            {t("add")} {t("projects")}
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("totalProjects")}
              value={totalProjects}
              icon="📁"
              color="primary"
              subtitle={t("allProjects")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("activeProjects")}
              value={activeProjects}
              icon="🔄"
              color="info"
              subtitle={t("inProgress")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("completedProjects")}
              value={completedProjects}
              icon="✅"
              color="success"
              subtitle={t("finished")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("delayedProjects")}
              value={delayedProjects}
              icon="⏸"
              color="warning"
              subtitle={t("onHold")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("revenue")}
              value={`${(totalRevenue / 1000).toFixed(0)}k DA`}
              icon="💰"
              color="secondary"
              subtitle={t("total")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("profit")}
              value={`${(estimatedProfit / 1000).toFixed(0)}k DA`}
              icon="📈"
              color="success"
              subtitle={t("estimated")}
            />
          </Box>
        </Box>
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          placeholder={t("searchProjects")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              loadProjects();
            }
          }}
          sx={{
            flexGrow: 1,
            minWidth: 200,
            maxWidth: 300,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">{t("allStatus")}</MenuItem>
          <MenuItem value="new">{t("new")}</MenuItem>
          <MenuItem value="in_progress">{t("inProgress")}</MenuItem>
          <MenuItem value="completed">{t("completed")}</MenuItem>
          <MenuItem value="on_hold">{t("onHold")}</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          sx={{ minWidth: 120, display: { xs: "none", sm: "flex" } }}
        >
          <MenuItem value="">{t("allClients")}</MenuItem>
          {clients.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <IconButton size="small" aria-label={t("sort")}>
          <SortIcon />
        </IconButton>

        <IconButton size="small" aria-label={t("refresh")} onClick={loadProjects}>
          <RefreshIcon />
        </IconButton>

        <IconButton size="small" aria-label={t("export")}>
          <FileDownloadIcon />
        </IconButton>
      </Box>

      {/* Projects Table */}
      <ChartCard title={t("projectList")} loading={loading}>
        {filteredProjects.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            {search || statusFilter || clientFilter ? (
              <Typography color="text.secondary">{t("noProjectsFound")}</Typography>
            ) : (
              <>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  📁
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {t("noProjectsYet")}
                </Typography>
                <Button variant="contained" onClick={addNewProject}>
                  {t("createProject")}
                </Button>
              </>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("projectCode")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("projectName")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider", display: { xs: "none", md: "table-cell" } }}>
                    {t("client")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("status")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider", display: { xs: "none", sm: "table-cell" } }}>
                    {t("progress")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider", display: { xs: "none", md: "table-cell" } }}>
                    {t("budget")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider", display: { xs: "none", lg: "table-cell" } }}>
                    {t("profit")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider", display: { xs: "none", md: "table-cell" } }}>
                    {t("startDate")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider", display: { xs: "none", md: "table-cell" } }}>
                    {t("endDate")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    style={{
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <td style={{ padding: 12 }}>{project.project_code || "-"}</td>
                    <td style={{ padding: 12 }}>{project.name}</td>
                    <td style={{ padding: 12, display: { xs: "none", md: "table-cell" } }}>
                      {project.client_name || "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <StatusChip
                        status={project.status || "new"}
                        type="project"
                      />
                    </td>
                    <td style={{ padding: 12, display: { xs: "none", sm: "table-cell" } }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            flexGrow: 1,
                            height: 6,
                            bgcolor: "action.hover",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${project.progress || 0}%`,
                              height: "100%",
                              bgcolor:
                                (project.progress || 0) >= 75
                                  ? "success.main"
                                  : (project.progress || 0) >= 50
                                  ? "warning.main"
                                  : "error.main",
                            }}
                          />
                        </Box>
                        <Typography variant="caption">{project.progress || 0}%</Typography>
                      </Box>
                    </td>
                    <td style={{ padding: 12, display: { xs: "none", md: "table-cell" } }}>
                      {project.amount ? `${project.amount.toLocaleString()} DA` : "-"}
                    </td>
                    <td style={{ padding: 12, display: { xs: "none", lg: "table-cell" } }}>
                      <Box>
                        <Typography variant="caption" display="block">
                          {t("revenue")}: {project.amount ? `${(project.amount / 1000).toFixed(0)}k` : "0k"}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {t("profit")}: {project.profit ? `${(project.profit / 1000).toFixed(0)}k` : "0k"}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {t("margin")}: {project.profit_margin || 0}%
                        </Typography>
                      </Box>
                    </td>
                    <td style={{ padding: 12, display: { xs: "none", md: "table-cell" } }}>
                      {project.start_date || "-"}
                    </td>
                    <td style={{ padding: 12, display: { xs: "none", md: "table-cell" } }}>
                      {project.end_date || "-"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => editProject(project)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(project.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
                labelRowsPerPage={t("rowsPerPage")}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t("of")} ${count}`}
              />
            )}
          </Box>
        )}
      </ChartCard>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editId ? t("editProject") : t("addProject")}
        </DialogTitle>

        <DialogContent>
          {/* General Section */}
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            {t("general")}
          </Typography>

          <TextField
            select
            fullWidth
            margin="normal"
            label={t("client")}
            value={form.client_id}
            onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            error={!!errors.client_id}
            helperText={errors.client_id}
            required
          >
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            margin="normal"
            label={t("system")}
            value={form.system_id}
            onChange={(e) => setForm({ ...form, system_id: e.target.value })}
          >
            <MenuItem value="">{t("selectSystem")}</MenuItem>
            {systems.map((system) => (
              <MenuItem key={system.id} value={system.id}>
                {system.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label={t("projectName")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("description")}
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("surface")}
            type="number"
            value={form.surface_m2}
            onChange={(e) => setForm({ ...form, surface_m2: e.target.value })}
          />

          {/* Timeline Section */}
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            {t("timeline")}
          </Typography>

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label={t("startDate")}
            InputLabelProps={{ shrink: true }}
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label={t("endDate")}
            InputLabelProps={{ shrink: true }}
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />

          {/* Financial Section */}
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            {t("financial")}
          </Typography>

          <TextField
            select
            fullWidth
            margin="normal"
            label={t("status")}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <MenuItem value="new">🟦 {t("new")}</MenuItem>
            <MenuItem value="in_progress">🟨 {t("inProgress")}</MenuItem>
            <MenuItem value="completed">🟩 {t("completed")}</MenuItem>
            <MenuItem value="on_hold">🟥 {t("onHold")}</MenuItem>
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label={t("amount")}
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            error={!!errors.amount}
            helperText={errors.amount}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={saveProject}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteProject}
        title={t("deleteProject")}
        message={t("confirmDeleteProject")}
        confirmText={t("delete")}
        type="error"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Projects;