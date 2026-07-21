import { useEffect, useState } from "react";
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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTheme } from "@mui/material/styles";

import { useLanguage } from "../context/LanguageContext";

function Clients() {
  const { t } = useLanguage();
  
  const emptyForm = {
    name: "",
    phone: "",
    email: "",
    address: "",
    company_name: "",
    status: "active",
    tax_number: "",
  };

  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errors, setErrors] = useState({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    loadClients();
  }, [page, limit]);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await api.get(`/clients?search=${search}&page=${page}&limit=${limit}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setClients(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setClients(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  }

  function openEdit(client) {
    setEditId(client.id);
    setForm({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
      company_name: client.company_name || "",
      status: client.status || "active",
      tax_number: client.tax_number || "",
    });
    setErrors({});
    setOpen(true);
  }

  function validateForm() {
    const newErrors = {};
    
    if (!form.name || form.name.trim() === "") {
      newErrors.name = t("requiredField");
    }
    
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t("invalidEmailFormat");
    }
    
    if (form.phone && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) {
      newErrors.phone = t("invalidPhoneFormat");
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

  async function saveClient() {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/clients/${editId}`, form);
      } else {
        await api.post("/clients", form);
      }
      setOpen(false);
      loadClients();
    } catch (err) {
      console.log(err);
      alert(t("errorSaving"));
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteClient() {
    if (!deleteId) return;
    
    try {
      await api.delete(`/clients/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      loadClients();
    } catch (err) {
      console.log(err);
      alert(t("errorDeleting"));
    }
  }

  // Calculate statistics
  const totalClients = total;
  const activeClients = clients.filter((c) => c.status === "active" || c.status === "نشط").length;
  const newThisMonth = clients.filter((c) => {
    const createdDate = new Date(c.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;
  const outstandingBalance = clients.reduce((sum, c) => sum + (c.outstanding || 0), 0);

  // Filter clients (for local search if needed)
  const filteredClients = clients.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title={t("clients")}
        subtitle={t("manageClientDatabase")}
        icon="👥"
        onRefresh={loadClients}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
          >
            {t("add")} {t("clients")}
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("totalClients")}
              value={totalClients}
              icon="👥"
              color="primary"
              subtitle={t("allClients")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("activeClients")}
              value={activeClients}
              icon="✅"
              color="success"
              subtitle={t("active")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("newThisMonth")}
              value={newThisMonth}
              icon="🆕"
              color="info"
              subtitle={t("recent")}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 150 }}>
            <StatCard
              title={t("outstanding")}
              value={`${(outstandingBalance / 1000).toFixed(0)}k DA`}
              icon="💰"
              color="warning"
              subtitle={t("balance")}
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
          placeholder={t("searchClients")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              loadClients();
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

        <IconButton size="small" aria-label={t("filter")}>
          <FilterListIcon />
        </IconButton>

        <IconButton size="small" aria-label={t("sort")}>
          <SortIcon />
        </IconButton>

        <IconButton size="small" aria-label={t("refresh")} onClick={loadClients}>
          <RefreshIcon />
        </IconButton>

        <IconButton size="small" aria-label={t("export")}>
          <FileDownloadIcon />
        </IconButton>
      </Box>

      {/* Clients Table */}
      <ChartCard title={t("clientList")} loading={loading}>
        {filteredClients.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            {search ? (
              <Typography color="text.secondary">{t("noClientsFound")}</Typography>
            ) : (
              <>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  👥
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {t("noClientsYet")}
                </Typography>
                <Button variant="contained" onClick={openAdd}>
                  {t("createFirstClient")}
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
                    {t("clientCode")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("name")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("companyName")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("phone")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("status")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("taxNumber")}
                  </th>
                  <th style={{ textAlign: "left", padding: 12, fontWeight: 600, borderBottom: 1, borderColor: "divider" }}>
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <td style={{ padding: 12 }}>{client.client_code || "-"}</td>
                    <td style={{ padding: 12 }}>{client.name}</td>
                    <td style={{ padding: 12 }}>{client.company_name || "-"}</td>
                    <td style={{ padding: 12 }}>{client.phone}</td>
                    <td style={{ padding: 12 }}>
                      <StatusChip
                        status={client.status || "active"}
                        type="client"
                      />
                    </td>
                    <td style={{ padding: 12 }}>{client.tax_number || "-"}</td>
                    <td style={{ padding: 12 }}>
                      <IconButton
                        size="small"
                        onClick={() => openEdit(client)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDeleteDialog(client.id)}
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editId ? t("editClient") : t("addClient")}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label={t("name")}
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
            label={t("companyName")}
            name="company_name"
            value={form.company_name}
            onChange={change}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("phone")}
            name="phone"
            value={form.phone}
            onChange={change}
            error={!!errors.phone}
            helperText={errors.phone}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("email")}
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            error={!!errors.email}
            helperText={errors.email}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("address")}
            name="address"
            multiline
            rows={2}
            value={form.address}
            onChange={change}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t("taxNumber")}
            name="tax_number"
            value={form.tax_number}
            onChange={change}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label={t("status")}
            name="status"
            value={form.status}
            onChange={change}
          >
            <MenuItem value="active">{t("active")}</MenuItem>
            <MenuItem value="inactive">{t("inactive")}</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button
            variant="contained"
            onClick={saveClient}
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
        onConfirm={deleteClient}
        title={t("deleteClient")}
        message={t("confirmDeleteClient")}
        confirmText={t("delete")}
        type="error"
      />
    </Box>
  );
}

export default Clients;