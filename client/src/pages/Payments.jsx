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
  Tabs,
  Tab,
  TablePagination,
  Snackbar,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon, Refresh as RefreshIcon, Receipt as ReceiptIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export default function Payments() {
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
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
    collected: 0,
    pending: 0,
    cash: 0,
    bank: 0,
    thisMonth: 0,
    lastMonth: 0,
  });

  const [form, setForm] = useState({
    payment_type: "client_payment",
    client_id: "",
    supplier_id: "",
    invoice_id: "",
    amount: "",
    payment_method: "cash",
    payment_date: "",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [page, limit, searchTerm]);

  async function loadData() {
    setLoading(true);
    try {
      const [paymentsRes, clientsRes, suppliersRes, invoicesRes] =
        await Promise.all([
          api.get(`/financial/payments?search=${searchTerm}&page=${page}&limit=${limit}`),
          api.get("/clients"),
          api.get("/financial/suppliers"),
          api.get("/invoices"),
        ]);
      
      const paymentsData = Array.isArray(paymentsRes.data)
        ? paymentsRes.data
        : Array.isArray(paymentsRes.data?.data)
          ? paymentsRes.data.data
          : [];
      setPayments(paymentsData);
      if (Array.isArray(paymentsRes.data)) {
        setTotal(paymentsRes.data.length);
        setTotalPages(1);
      } else {
        setTotal(paymentsRes.data?.pagination?.total || 0);
        setTotalPages(paymentsRes.data?.pagination?.totalPages || 1);
      }

      const clientsData = Array.isArray(clientsRes.data)
        ? clientsRes.data
        : Array.isArray(clientsRes.data?.data)
          ? clientsRes.data.data
          : [];
      const suppliersData = Array.isArray(suppliersRes.data)
        ? suppliersRes.data
        : Array.isArray(suppliersRes.data?.data)
          ? suppliersRes.data.data
          : [];
      const invoicesData = Array.isArray(invoicesRes.data)
        ? invoicesRes.data
        : Array.isArray(invoicesRes.data?.data)
          ? invoicesRes.data.data
          : [];

      setClients(clientsData);
      setSuppliers(suppliersData);
      setInvoices(invoicesData);
      calculateStats(paymentsData);
    } catch (err) {
      setPayments([]);
      setClients([]);
      setSuppliers([]);
      setInvoices([]);
      calculateStats([]);
      showSnackbar("Error loading payments", "error");
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function calculateStats(data) {
    const safeData = Array.isArray(data) ? data : [];
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
    
    const newStats = {
      collected: safeData
        .filter((p) => p.payment_type === "client_payment")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      pending: safeData
        .filter((p) => p.payment_type === "supplier_payment")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      cash: safeData
        .filter((p) => p.payment_method === "cash")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      bank: safeData
        .filter((p) => p.payment_method === "bank_transfer" || p.payment_method === "card")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      thisMonth: safeData
        .filter((p) => p.payment_date?.startsWith(thisMonth))
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      lastMonth: safeData
        .filter((p) => p.payment_date?.startsWith(lastMonth))
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    };
    setStats(newStats);
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addNew() {
    setEditId(null);
    setForm({
      payment_type: "client_payment",
      client_id: "",
      supplier_id: "",
      invoice_id: "",
      amount: "",
      payment_method: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      reference_number: "",
      notes: "",
    });
    setOpen(true);
  }

  function editPayment(payment) {
    setEditId(payment.id);
    setForm({
      payment_type: payment.payment_type,
      client_id: payment.client_id || "",
      supplier_id: payment.supplier_id || "",
      invoice_id: payment.invoice_id || "",
      amount: payment.amount || "",
      payment_method: payment.payment_method || "cash",
      payment_date: payment.payment_date || "",
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.amount || form.amount <= 0) {
      showSnackbar("Please enter a valid amount", "error");
      return;
    }

    if (form.payment_type === "client_payment" && !form.client_id) {
      showSnackbar("Please select a client", "error");
      return;
    }

    if (form.payment_type === "supplier_payment" && !form.supplier_id) {
      showSnackbar("Please select a supplier", "error");
      return;
    }

    try {
      if (editId) {
        await api.put(`/financial/payments/${editId}`, form);
      } else {
        await api.post("/financial/payments", form);
      }
      showSnackbar("Payment recorded", "success");
      setOpen(false);
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deletePayment() {
    if (!deleteId) return;

    try {
      await api.delete(`/financial/payments/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar("Payment deleted", "success");
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Delete failed", "error");
    }
  }

  const safePayments = Array.isArray(payments) ? payments : [];
  const clientPayments = safePayments.filter((p) => p.payment_type === "client_payment");
  const supplierPayments = safePayments.filter((p) => p.payment_type === "supplier_payment");

  return (
    <Box>
      <PageHeader
        title="Payments"
        subtitle="Manage all payment transactions"
        actionLabel="New Payment"
        onAction={addNew}
        icon="💳"
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
            title="Collected"
            value={`${stats.collected.toLocaleString()} DA`}
            color="success"
            icon="💰"
          />
          <EnterpriseStatCard
            title="Pending"
            value={`${stats.pending.toLocaleString()} DA`}
            color="warning"
            icon="⏳"
          />
          <EnterpriseStatCard
            title="Cash"
            value={`${stats.cash.toLocaleString()} DA`}
            color="info"
            icon="💵"
          />
          <EnterpriseStatCard
            title="Bank/Card"
            value={`${stats.bank.toLocaleString()} DA`}
            color="primary"
            icon="🏦"
          />
          <EnterpriseStatCard
            title="This Month"
            value={`${stats.thisMonth.toLocaleString()} DA`}
            color="primary"
            icon="📅"
          />
          <EnterpriseStatCard
            title="Last Month"
            value={`${stats.lastMonth.toLocaleString()} DA`}
            color="default"
            icon="📆"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search payments..."
        onRefresh={loadData}
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Client Payments (${clientPayments.length})`} />
          <Tab label={`Supplier Payments (${supplierPayments.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Client Payments */}
      {tab === 0 && (
        <EnterpriseSection title="Client Payments" loading={loading}>
          {clientPayments.length === 0 ? (
            <EnterpriseEmptyState
              message="No client payments found"
              actionLabel="Record a payment"
              onAction={addNew}
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Client</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Invoice</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Amount</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Method</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientPayments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>{p.payment_date?.slice(0, 10)}</td>
                      <td style={{ padding: "12px" }}>{p.client_name}</td>
                      <td style={{ padding: "12px" }}>{p.invoice_number || "-"}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {p.amount?.toLocaleString()} DA
                        </Typography>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Chip label={PAYMENT_METHODS.find(m => m.value === p.payment_method)?.label || p.payment_method} size="small" variant="outlined" />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => editPayment(p)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Receipt">
                            <IconButton size="small" onClick={() => window.open(`http://localhost:3000/pdf/payment/${p.id}`, "_blank")}>
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(p.id)}>
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

      {/* TAB 1: Supplier Payments */}
      {tab === 1 && (
        <EnterpriseSection title="Supplier Payments" loading={loading}>
          {supplierPayments.length === 0 ? (
            <EnterpriseEmptyState
              message="No supplier payments found"
              actionLabel="Record a payment"
              onAction={addNew}
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Supplier</th>
                    <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Amount</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Method</th>
                    <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPayments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>{p.payment_date?.slice(0, 10)}</td>
                      <td style={{ padding: "12px" }}>{p.supplier_name}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          {p.amount?.toLocaleString()} DA
                        </Typography>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Chip label={PAYMENT_METHODS.find(m => m.value === p.payment_method)?.label || p.payment_method} size="small" variant="outlined" />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => editPayment(p)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Receipt">
                            <IconButton size="small" onClick={() => window.open(`http://localhost:3000/pdf/payment/${p.id}`, "_blank")}>
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(p.id)}>
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

      {/* Payment Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Edit Payment" : "New Payment"}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Payment Type"
            name="payment_type"
            value={form.payment_type}
            onChange={change}
          >
            <MenuItem value="client_payment">Client Payment (Income)</MenuItem>
            <MenuItem value="supplier_payment">Supplier Payment (Expense)</MenuItem>
          </TextField>

          {form.payment_type === "client_payment" ? (
            <TextField
              select
              fullWidth
              margin="normal"
              label="Client"
              name="client_id"
              value={form.client_id}
              onChange={change}
            >
              <MenuItem value="">-- Select Client --</MenuItem>
              {(Array.isArray(clients) ? clients : []).map((c) => <MenuItem key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ""}</MenuItem>)}
            </TextField>
          ) : (
            <TextField
              select
              fullWidth
              margin="normal"
              label="Supplier"
              name="supplier_id"
              value={form.supplier_id}
              onChange={change}
            >
              <MenuItem value="">-- Select Supplier --</MenuItem>
              {(Array.isArray(suppliers) ? suppliers : []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          )}

          {form.payment_type === "client_payment" && (
            <TextField
              select
              fullWidth
              margin="normal"
              label="Invoice (optional)"
              name="invoice_id"
              value={form.invoice_id}
              onChange={change}
            >
              <MenuItem value="">-- None --</MenuItem>
              {(Array.isArray(invoices) ? invoices : []).map((inv) => <MenuItem key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.client_name} - {inv.amount?.toLocaleString()} DA</MenuItem>)}
            </TextField>
          )}

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
              label="Payment Date"
              name="payment_date"
              type="date"
              value={form.payment_date}
              onChange={change}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

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
              label="Reference Number"
              name="reference_number"
              value={form.reference_number}
              onChange={change}
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
          <Button variant="contained" onClick={save}>
            {editId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deletePayment}
        title="Delete Payment"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}
