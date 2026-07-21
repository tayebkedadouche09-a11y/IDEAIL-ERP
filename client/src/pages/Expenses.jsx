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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Receipt as ReceiptIcon, PictureAsPdf as PdfIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import ConfirmDialog from "../components/ConfirmDialog";

const EXPENSE_CATEGORIES = [
  { value: "materials", label: "Materials" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "fuel", label: "Fuel" },
  { value: "transport", label: "Transport" },
  { value: "external_services", label: "External Services" },
  { value: "maintenance", label: "Maintenance" },
  { value: "administration", label: "Administration" },
  { value: "taxes", label: "Taxes" },
  { value: "other", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  category_id: "",
  project_id: "",
  supplier_id: "",
  employee_id: "",
  vehicle_id: "",
  title: "",
  description: "",
  amount: "",
  vat_amount: "",
  total_amount: "",
  payment_method: "cash",
  expense_date: "",
  receipt_number: "",
  invoice_number: "",
  notes: "",
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    paid: 0,
    projectCosts: 0,
    operatingCosts: 0,
  });

  useEffect(() => {
    loadData();
  }, [page, limit, searchTerm]);

  async function loadData() {
    setLoading(true);
    try {
      const [expensesRes, categoriesRes, projectsRes, suppliersRes, employeesRes, vehiclesRes] =
        await Promise.all([
          api.get(`/financial/expenses?search=${searchTerm}&page=${page}&limit=${limit}`),
          api.get("/financial/expense-categories"),
          api.get("/projects"),
          api.get("/financial/suppliers"),
          api.get("/employees"),
          api.get("/vehicles"),
        ]);
      
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(expensesRes.data)) {
        setExpenses(expensesRes.data);
        setTotal(expensesRes.data.length);
        setTotalPages(1);
      } else {
        setExpenses(expensesRes.data.data || []);
        setTotal(expensesRes.data.pagination?.total || 0);
        setTotalPages(expensesRes.data.pagination?.totalPages || 1);
      }
      
      setCategories(categoriesRes.data || []);
      setProjects(projectsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setEmployees(employeesRes.data || []);
      setVehicles(vehiclesRes.data || []);
      calculateStats(expensesRes.data.data || expensesRes.data || []);
    } catch (err) {
      console.log(err);
      showSnackbar("Error loading expenses", "error");
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function calculateStats(data) {
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    
    const newStats = {
      total: data.reduce((sum, e) => sum + (e.total_amount || 0), 0),
      thisMonth: data
        .filter(e => e.expense_date?.startsWith(thisMonth))
        .reduce((sum, e) => sum + (e.total_amount || 0), 0),
      pending: data.filter(e => e.status === "pending").length,
      paid: data.filter(e => e.status === "paid").length,
      projectCosts: data.filter(e => e.project_id).reduce((sum, e) => sum + (e.total_amount || 0), 0),
      operatingCosts: data.filter(e => !e.project_id).reduce((sum, e) => sum + (e.total_amount || 0), 0),
    };
    setStats(newStats);
  }

  function change(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Auto-calculate total
    if (name === "amount" || name === "vat_amount") {
      const amount = name === "amount" ? Number(value) : Number(form.amount);
      const vat = name === "vat_amount" ? Number(value) : Number(form.vat_amount);
      setForm((prev) => ({
        ...prev,
        [name]: value,
        total_amount: (amount + vat).toFixed(2),
      }));
    }
  }

  function addNew() {
    setEditId(null);
    setForm({
      ...emptyForm,
      expense_date: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  function editExpense(exp) {
    setEditId(exp.id);
    setForm({
      ...exp,
      expense_date: exp.expense_date || new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  async function save() {
    if (!form.title) {
      showSnackbar("Title is required", "error");
      return;
    }

    if (!form.amount || form.amount <= 0) {
      showSnackbar("Please enter a valid amount", "error");
      return;
    }

    try {
      if (editId) {
        await api.put(`/financial/expenses/${editId}`, form);
        showSnackbar("Expense updated", "success");
      } else {
        await api.post("/financial/expenses", form);
        showSnackbar("Expense created", "success");
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteExpense() {
    if (!deleteId) return;

    try {
      await api.delete(`/financial/expenses/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar("Expense deleted", "success");
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Delete failed", "error");
    }
  }

  const filteredExpenses = expenses
    .filter((e) => categoryFilter === "all" || e.category_id === categoryFilter)
    .filter((e) =>
      searchTerm === "" ||
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title="Expenses"
        subtitle="Manage company expenses and costs"
        actionLabel="New Expense"
        onAction={addNew}
        icon="💰"
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
            title="Total Expenses"
            value={`${stats.total.toLocaleString()} DA`}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title="This Month"
            value={`${stats.thisMonth.toLocaleString()} DA`}
            color="info"
            icon="📅"
          />
          <EnterpriseStatCard
            title="Pending"
            value={stats.pending}
            color="warning"
            icon="⏳"
          />
          <EnterpriseStatCard
            title="Paid"
            value={stats.paid}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title="Project Costs"
            value={`${stats.projectCosts.toLocaleString()} DA`}
            color="default"
            icon="📋"
          />
          <EnterpriseStatCard
            title="Operating Costs"
            value={`${stats.operatingCosts.toLocaleString()} DA`}
            color="error"
            icon="🏢"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search expenses..."
        filters={[
          { value: "all", label: "All Categories" },
          ...categories.map(c => ({ value: c.id, label: c.name })),
        ]}
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        onRefresh={loadData}
      />

      <EnterpriseSection title="Expenses List" loading={loading}>
        {filteredExpenses.length === 0 ? (
          <EnterpriseEmptyState
            message="No expenses found"
            actionLabel="Add your first expense"
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Category</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Description</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Supplier</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Project</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Amount</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>VAT</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Total</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Method</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>{exp.expense_date?.slice(0, 10)}</td>
                    <td style={{ padding: "12px" }}>{exp.category_name || "-"}</td>
                    <td style={{ padding: "12px" }}>{exp.title}</td>
                    <td style={{ padding: "12px" }}>{exp.supplier_name || "-"}</td>
                    <td style={{ padding: "12px" }}>{exp.project_name || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{exp.amount?.toLocaleString()} DA</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{exp.vat_amount?.toLocaleString()} DA</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {exp.total_amount?.toLocaleString()} DA
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Chip label={PAYMENT_METHODS.find(m => m.value === exp.payment_method)?.label || exp.payment_method} size="small" variant="outlined" />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <StatusChip status={exp.status} />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => editExpense(exp)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View PDF">
                          <IconButton size="small" onClick={() => window.open(`http://localhost:3000/pdf/expense/${exp.id}`, "_blank")}>
                            <PdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDeleteDialog(exp.id)}>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? "Edit Expense" : "New Expense"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            General Information
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Category"
            name="category_id"
            value={form.category_id}
            onChange={change}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Title"
            name="title"
            value={form.title}
            onChange={change}
            required
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
          <TextField
            fullWidth
            margin="normal"
            label="Expense Date"
            name="expense_date"
            type="date"
            value={form.expense_date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Assignment
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Project (optional)"
            name="project_id"
            value={form.project_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Supplier (optional)"
            name="supplier_id"
            value={form.supplier_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Employee (optional)"
            name="employee_id"
            value={form.employee_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Vehicle (optional)"
            name="vehicle_id"
            value={form.vehicle_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.registration_number} - {v.brand}</MenuItem>)}
          </TextField>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Financial Information
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Amount (DA) *"
              name="amount"
              type="number"
              value={form.amount}
              onChange={change}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="VAT Amount"
              name="vat_amount"
              type="number"
              value={form.vat_amount}
              onChange={change}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              fullWidth
              label="Total Amount"
              name="total_amount"
              value={form.total_amount}
              disabled
              sx={{ bgcolor: "#f5f5f5" }}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Payment
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              select
              fullWidth
              label="Payment Method"
              name="payment_method"
              value={form.payment_method}
              onChange={change}
            >
              {PAYMENT_METHODS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth
              label="Receipt Number"
              name="receipt_number"
              value={form.receipt_number}
              onChange={change}
            />
            <TextField
              fullWidth
              label="Invoice Number"
              name="invoice_number"
              value={form.invoice_number}
              onChange={change}
            />
          </Box>

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
          <Button variant="contained" onClick={save}>
            {editId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}