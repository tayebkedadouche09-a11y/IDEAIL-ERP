import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Chip,
  IconButton,
  Box,
  Alert,
  Tooltip,
  TablePagination,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon, Receipt as ReceiptIcon, Payment as PaymentIcon, Refresh as RefreshIcon, Send as SendIcon, Cancel as CancelIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import ConfirmDialog from "../components/ConfirmDialog";
import { useLanguage } from "../context/LanguageContext";

const STATUS_CONFIG = {
  Draft: { key: "draft", color: "default" },
  Issued: { key: "issued", color: "info" },
  "Partially Paid": { key: "partially_paid", color: "warning" },
  Paid: { key: "paid", color: "success" },
  Cancelled: { key: "cancelled", color: "error" },
};

export default function Invoices() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("all");
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
    paid: 0,
    unpaid: 0,
    overdue: 0,
    revenue: 0,
    vat: 0,
  });

  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    amount: "",
    vat_amount: "",
    discount: "",
    status: "Draft",
    invoice_date: "",
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
  });

  useEffect(() => {
    loadInvoices();
    loadClients();
    loadProjects();
    loadQuotations();
  }, [page, limit, searchTerm, filter]);

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await api.get(`/invoices?search=${searchTerm}&page=${page}&limit=${limit}&status=${filter}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setInvoices(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setInvoices(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
      calculateStats(res.data.data || res.data);
    } catch (error) {
      console.log(error);
      showSnackbar(t("errorLoadingInvoices"), "error");
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function calculateStats(data) {
    const invoiceData = Array.isArray(data) ? data : (data || []);
    const today = new Date().toISOString().slice(0, 10);
    const newStats = {
      total: invoiceData.length,
      paid: invoiceData.filter(d => d.status === "Paid").length,
      unpaid: invoiceData.filter(d => d.status === "Draft" || d.status === "Issued" || d.status === "Partially Paid").length,
      overdue: invoiceData.filter(d => d.status !== "Paid" && d.invoice_date < today).length,
      revenue: invoiceData.reduce((sum, d) => sum + (d.amount || 0), 0),
      vat: invoiceData.reduce((sum, d) => sum + (d.vat_amount || 0), 0),
    };
    setStats(newStats);
  }

  async function loadClients() {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadProjects() {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadQuotations() {
    try {
      const res = await api.get("/devis?status=accepté");
      setQuotations(res.data.data || res.data || []);
    } catch (error) {
      console.log(error);
    }
  }

  function addNew() {
    setEditId(null);
    setForm({
      client_id: "",
      project_id: "",
      amount: "",
      vat_amount: "",
      discount: "",
      status: "Draft",
      invoice_date: "",
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    });
    setOpen(true);
  }

  function createFromQuotation(quotation) {
    setForm({
      client_id: quotation.client_id,
      project_id: quotation.project_id || "",
      amount: quotation.amount || "",
      vat_amount: "",
      discount: "",
      status: "Issued",
      invoice_date: new Date().toISOString().slice(0, 10),
      notes: quotation.notes || "",
      items: quotation.items ? quotation.items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })) : [{ description: "", quantity: 1, unit_price: 0 }],
    });
    setEditId(null);
    setOpen(true);
  }

  function editInvoice(inv) {
    setEditId(inv.id);
    setForm({
      client_id: inv.client_id,
      project_id: inv.project_id || "",
      amount: inv.amount || "",
      vat_amount: inv.vat_amount || "",
      discount: inv.discount || "",
      status: inv.status || "Draft",
      invoice_date: inv.invoice_date || "",
      notes: inv.notes || "",
      items: inv.items && inv.items.length > 0
        ? inv.items.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unit_price: i.unit_price,
          }))
        : [{ description: "", quantity: 1, unit_price: 0 }],
    });
    setOpen(true);
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleItemChange(index, field, value) {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  }

  function addItem() {
    setForm({
      ...form,
      items: [...form.items, { description: "", quantity: 1, unit_price: 0 }],
    });
  }

  function removeItem(index) {
    if (form.items.length <= 1) return;
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  }

  function calculateTotal() {
    const itemsTotal = form.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      0
    );
    const vat = Number(form.vat_amount) || 0;
    const discount = Number(form.discount) || 0;
    return itemsTotal + vat - discount;
  }

  async function saveInvoice() {
    if (!form.client_id) {
      showSnackbar(t("clientRequired"), "error");
      return;
    }

    const validItems = form.items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      showSnackbar(t("atLeastOneDescriptionRequired"), "error");
      return;
    }

    const payload = {
      ...form,
      client_id: Number(form.client_id),
      project_id: form.project_id ? Number(form.project_id) : null,
      amount: calculateTotal(),
      vat_amount: Number(form.vat_amount) || 0,
      discount: Number(form.discount) || 0,
      items: validItems.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 1,
        unit_price: Number(i.unit_price) || 0,
      })),
    };

    try {
      if (editId) {
        await api.put(`/invoices/${editId}`, payload);
      } else {
        await api.post("/invoices", payload);
      }
      setOpen(false);
      showSnackbar(t("invoiceSavedSuccessfully"), "success");
      loadInvoices();
    } catch (error) {
      showSnackbar(error.response?.data?.error || t("errorSavingInvoice"), "error");
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteInvoice() {
    if (!deleteId) return;

    try {
      await api.delete(`/invoices/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar(t("invoiceDeletedSuccessfully"), "success");
      loadInvoices();
    } catch (error) {
      showSnackbar(error.response?.data?.error || t("errorDeletingInvoice"), "error");
    }
  }

  async function registerPayment(invoiceId) {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const remaining = (invoice.amount || 0) - (invoice.paid_amount || 0);
    const paymentAmount = prompt(`${t("enterPaymentAmount")} (${t("remainingLabel")}: ${remaining} DA):`, remaining);

    if (!paymentAmount || isNaN(paymentAmount)) return;

    try {
      await api.post("/financial/payments", {
        payment_type: "client_payment",
        invoice_id: invoiceId,
        amount: Number(paymentAmount),
        payment_date: new Date().toISOString().slice(0, 10),
      });
      showSnackbar(t("paymentRegisteredSuccessfully"), "success");
      loadInvoices();
    } catch (error) {
      showSnackbar(error.response?.data?.error || t("paymentFailed"), "error");
    }
  }

  const filteredInvoices = invoices
    .filter(inv => filter === "all" || inv.status === filter)
    .filter(inv =>
      searchTerm === "" ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title={t("invoices")}
        subtitle={t("manageInvoices")}
        actionLabel={t("add")}
        onAction={addNew}
        icon="🧾"
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

      <EnterpriseSection title={t("statisticsStat")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title={t("total")}
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title={t("paid")}
            value={stats.paid}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title={t("unpaid")}
            value={stats.unpaid}
            color="warning"
            icon="⏳"
          />
          <EnterpriseStatCard
            title={t("overdue")}
            value={stats.overdue}
            color="error"
            icon="⚠️"
          />
          <EnterpriseStatCard
            title={t("revenue")}
            value={`${stats.revenue.toLocaleString()} DA`}
            color="primary"
            icon="💰"
          />
          <EnterpriseStatCard
            title={t("vat")}
            value={`${stats.vat.toLocaleString()} DA`}
            color="info"
            icon="📈"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchInvoices")}
        filters={[
          { value: "all", label: t("allStatus") },
          { value: "Draft", label: t("draft") },
          { value: "Issued", label: t("issued") },
          { value: "Partially Paid", label: t("partially_paid") },
          { value: "Paid", label: t("paid") },
          { value: "Cancelled", label: t("cancelled") },
        ]}
        filterValue={filter}
        onFilterChange={setFilter}
        onRefresh={loadInvoices}
      />

      <EnterpriseSection title={t("invoiceList")} loading={loading}>
        {filteredInvoices.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noInvoicesFound")}
            actionLabel={t("createFirstInvoice")}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("invoiceNumber")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("client")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("project")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("invoiceDate")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("amount")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("paidAmount")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("remainingAmount")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const remaining = (inv.amount || 0) - (inv.paid_amount || 0);
                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {inv.invoice_number}
                        </Typography>
                      </td>
                      <td style={{ padding: "12px" }}>{inv.client_name}</td>
                      <td style={{ padding: "12px" }}>{inv.project_name || "-"}</td>
                      <td style={{ padding: "12px" }}>{inv.invoice_date?.slice(0, 10)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {inv.amount?.toLocaleString()} DA
                        </Typography>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {inv.paid_amount?.toLocaleString() || 0} DA
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <Typography variant="body2" color={remaining > 0 ? "error" : "success"}>
                          {remaining.toLocaleString()} DA
                        </Typography>
                      </td>
<td style={{ padding: "12px" }}>
                        <StatusChip status={inv.status} type="invoice" />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {(inv.status === "Draft" || inv.status === "Issued" || inv.status === "Partially Paid") && (
                            <Tooltip title={t("edit")}>
                              <IconButton size="small" color="primary" onClick={() => editInvoice(inv)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {inv.status === "Draft" && (
                            <Tooltip title={t("issue")}>
                              <IconButton size="small" color="info" onClick={() => api.put(`/invoices/${inv.id}/status`, { status: "Issued" }).then(() => loadInvoices())}>
                                <SendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {inv.status !== "Paid" && inv.status !== "Cancelled" && (
                            <Tooltip title={t("registerPayment")}>
                              <IconButton size="small" color="success" onClick={() => registerPayment(inv.id)}>
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title={t("printPDF")}>
                            <IconButton size="small" onClick={() => window.open(`http://localhost:3000/pdf/invoice/${inv.id}`, "_blank")}>
                              <PdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {inv.status === "Draft" && (
                            <Tooltip title={t("delete")}>
                              <IconButton size="small" color="error" onClick={() => openDeleteDialog(inv.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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
                labelRowsPerPage={t("rowsPerPage")}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t("of")} ${count}`}
              />
            )}
          </Box>
        )}
      </EnterpriseSection>

      {/* Create from Quotation Section */}
      {quotations.length > 0 && (
        <EnterpriseSection title={t("createFromQuotation")} sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {quotations.map((q) => (
              <Button
                key={q.id}
                variant="outlined"
                size="small"
                onClick={() => createFromQuotation(q)}
              >
                {q.devis_number} - {q.client_name}
              </Button>
            ))}
          </Box>
        </EnterpriseSection>
      )}

      {/* Invoice Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? t("editInvoice") : t("addInvoice")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 1 }}>
            <TextField
              select
              fullWidth
              label={t("client")}
              name="client_id"
              value={form.client_id}
              onChange={handleFormChange}
              disabled={!!editId}
              required
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} {c.company_name ? `(${c.company_name})` : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label={t("project")}
              name="project_id"
              value={form.project_id}
              onChange={handleFormChange}
            >
              <MenuItem value="">{t("none")}</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("vatAmount")}
              name="vat_amount"
              type="number"
              value={form.vat_amount}
              onChange={handleFormChange}
            />
            <TextField
              fullWidth
              label={t("discount")}
              name="discount"
              type="number"
              value={form.discount}
              onChange={handleFormChange}
            />
          </Box>

          <TextField
            select
            fullWidth
            margin="normal"
            label={t("status")}
            name="status"
            value={form.status}
            onChange={handleFormChange}
          >
            <MenuItem value="Draft">{t("draft")}</MenuItem>
            <MenuItem value="Issued">{t("issued")}</MenuItem>
            <MenuItem value="Partially Paid">{t("partially_paid")}</MenuItem>
            <MenuItem value="Paid">{t("paid")}</MenuItem>
            <MenuItem value="Cancelled">{t("cancelled")}</MenuItem>
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            type="date"
            label={t("invoiceDate")}
            name="invoice_date"
            InputLabelProps={{ shrink: true }}
            value={form.invoice_date}
            onChange={handleFormChange}
          />

          {/* Items Table */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
            {t("items")}
          </Typography>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px", fontWeight: "bold" }}>{t("description")}</th>
                <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>{t("quantity")}</th>
                <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>{t("unitPrice")}</th>
                <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>{t("total")}</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "4px" }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={t("description")}
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </td>
                  <td style={{ padding: "4px" }}>
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: "right" } }}
                      sx={{ width: 80 }}
                    />
                  </td>
                  <td style={{ padding: "4px" }}>
                    <TextField
                      size="small"
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: "right" } }}
                      sx={{ width: 100 }}
                    />
                  </td>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    <Typography variant="body2" fontWeight="bold">
                      {((Number(item.quantity) || 1) * (Number(item.unit_price) || 0)).toLocaleString()}
                    </Typography>
                  </td>
                  <td style={{ padding: "4px" }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button
            startIcon={<AddIcon />}
            onClick={addItem}
            size="small"
            sx={{ mt: 1 }}
          >
            {t("add")}
          </Button>

          {/* Total */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: 1.5,
              bgcolor: "#f5f5f5",
              borderRadius: 1,
              mt: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {t("total")}: {calculateTotal().toLocaleString()} DA
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            label={t("notes")}
            name="notes"
            value={form.notes}
            onChange={handleFormChange}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={saveInvoice}>
            {editId ? t("edit") : t("add")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteInvoice}
        title={t("deleteInvoice")}
        message={t("confirmDeleteInvoice")}
        confirmText={t("delete")}
        type="error"
      />
    </Box>
  );
}