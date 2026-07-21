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
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Business as BusinessIcon, LocalShipping as ShippingIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import EnterpriseStatCard from "../components/EnterpriseStatCard";

import { useLanguage } from "../context/LanguageContext";

const SUPPLIER_CATEGORIES = [
  { value: "materials", key: "materials" },
  { value: "equipment", key: "equipment" },
  { value: "services", key: "services" },
  { value: "transport", key: "transport" },
  { value: "maintenance", key: "maintenance" },
];

const emptyForm = {
  name: "",
  category: "materials",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  registration_number: "",
  tax_number: "",
  nif: "",
  nis: "",
  rc: "",
  payment_terms: "30",
  credit_limit: "",
  bank_name: "",
  bank_account: "",
  notes: "",
};

export default function Suppliers() {
  const { t } = useLanguage();
  
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    materialSuppliers: 0,
    totalPurchases: 0,
    balanceDue: 0,
    avgRating: 0,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

async function loadSuppliers() {
    try {
      const res = await api.get("/suppliers");
      // Handle both old format (array) and new format (object with data)
      let data;
      if (Array.isArray(res.data)) {
        data = res.data;
      } else {
        data = res.data.data || [];
      }
      setSuppliers(data);
      calculateStats(data);
    } catch (err) {
      console.log(err);
    }
  }

  function calculateStats(data) {
    const newStats = {
      total: data.length,
      active: data.filter(s => s.status === "active").length,
      materialSuppliers: data.filter(s => s.category === "materials").length,
      totalPurchases: data.reduce((sum, s) => sum + (s.total_purchases || 0), 0),
      balanceDue: data.reduce((sum, s) => sum + (s.balance_due || 0), 0),
      avgRating: data.length > 0 ? data.reduce((sum, s) => sum + (s.rating || 0), 0) / data.length : 0,
    };
    setStats(newStats);
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function editSupplier(supplier) {
    setEditId(supplier.id);
    setForm({
      name: supplier.name || "",
      category: supplier.category || "materials",
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      registration_number: supplier.registration_number || "",
      tax_number: supplier.tax_number || "",
      nif: supplier.nif || "",
      nis: supplier.nis || "",
      rc: supplier.rc || "",
      payment_terms: supplier.payment_terms || "30",
      credit_limit: supplier.credit_limit || "",
      bank_name: supplier.bank_name || "",
      bank_account: supplier.bank_account || "",
      notes: supplier.notes || "",
    });
    setOpen(true);
  }

async function save() {
    try {
      if (editId) {
        await api.put(`/suppliers/${editId}`, form);
        setMessage({ type: "success", text: t("supplierUpdatedSuccessfully") });
      } else {
        await api.post("/suppliers", form);
        setMessage({ type: "success", text: t("supplierCreatedSuccessfully") });
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      loadSuppliers();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("errorSavingSupplier") });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  async function remove(id) {
    if (!window.confirm(t("confirmDeleteSupplier"))) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setMessage({ type: "success", text: t("supplierDeletedSuccessfully") });
      loadSuppliers();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("deleteFailed") });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  const filteredSuppliers = suppliers
    .filter((s) => categoryFilter === "all" || s.category === categoryFilter)
    .filter((s) => statusFilter === "all" || s.status === statusFilter)
    .filter((s) =>
      searchTerm === "" ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title={t("suppliers")}
        subtitle={t("manageSuppliers")}
        actionLabel={t("addSupplier")}
        onAction={addNew}
        icon="🚚"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseSection title={t("statistics")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title={t("totalSuppliers")}
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title={t("activeSuppliers")}
            value={stats.active}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title={t("materialSuppliers")}
            value={stats.materialSuppliers}
            color="info"
            icon="📦"
          />
          <EnterpriseStatCard
            title={t("totalPurchases")}
            value={`${stats.totalPurchases.toLocaleString()} DA`}
            color="warning"
            icon="💰"
          />
          <EnterpriseStatCard
            title={t("balanceDue")}
            value={`${stats.balanceDue.toLocaleString()} DA`}
            color="error"
            icon="⏳"
          />
          <EnterpriseStatCard
            title={t("avgRating")}
            value={stats.avgRating.toFixed(1)}
            color="default"
            icon="⭐"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchSuppliers")}
        filters={[
          { value: "all", label: t("allCategories") },
          ...SUPPLIER_CATEGORIES.map(c => ({ value: c.value, label: t(c.key) })),
        ]}
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        onRefresh={loadSuppliers}
      />

      <EnterpriseSection title={t("supplierList")}>
        {filteredSuppliers.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noSuppliersFound")}
            actionLabel={t("addFirstSupplier")}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("id")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("name")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("category")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("contactPerson")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("phone")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("email")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("address")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("purchases")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("balance")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        <BusinessIcon fontSize="small" />
                      </Avatar>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {s.name}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>{t(s.category) || s.category}</td>
                    <td style={{ padding: "12px" }}>{s.contact_person || "-"}</td>
                    <td style={{ padding: "12px" }}>{s.phone || "-"}</td>
                    <td style={{ padding: "12px" }}>{s.email || "-"}</td>
                    <td style={{ padding: "12px" }}>{s.address || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{s.total_purchases?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{s.balance_due?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px" }}>
                      <StatusChip status={s.status} />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title={t("view")}>
                          <IconButton size="small" color="primary" onClick={() => editSupplier(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("delete")}>
                          <IconButton size="small" color="error" onClick={() => remove(s.id)}>
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? t("editSupplier") : t("addSupplier")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("generalInformation")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("supplierName")}
            name="name"
            value={form.name}
            onChange={change}
            required
          />
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("category")}
            name="category"
            value={form.category}
            onChange={change}
          >
            {SUPPLIER_CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>{t(c.key) || c.key}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label={t("contactPerson")}
            name="contact_person"
            value={form.contact_person}
            onChange={change}
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("phone")}
              name="phone"
              value={form.phone}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("email")}
              name="email"
              value={form.email}
              onChange={change}
            />
          </Box>
          <TextField
            fullWidth
            margin="normal"
            label={t("address")}
            name="address"
            value={form.address}
            onChange={change}
            multiline
            rows={2}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("businessInformation")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("registrationNumber")}
              name="registration_number"
              value={form.registration_number}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("taxNumber")}
              name="tax_number"
              value={form.tax_number}
              onChange={change}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("nif")}
              name="nif"
              value={form.nif}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("nis")}
              name="nis"
              value={form.nis}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("rc")}
              name="rc"
              value={form.rc}
              onChange={change}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("financialInformation")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("paymentTermsDays")}
              name="payment_terms"
              type="number"
              value={form.payment_terms}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("creditLimitDA")}
              name="credit_limit"
              type="number"
              value={form.credit_limit}
              onChange={change}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("bankName")}
              name="bank_name"
              value={form.bank_name}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("bankAccount")}
              name="bank_account"
              value={form.bank_account}
              onChange={change}
            />
          </Box>

          <TextField
            fullWidth
            margin="normal"
            label={t("notes")}
            name="notes"
            value={form.notes}
            onChange={change}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={save}>{t("save")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}