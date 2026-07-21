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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Inventory as InventoryIcon, Warning as WarningIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import ConfirmDialog from "../components/ConfirmDialog";

import { useLanguage } from "../context/LanguageContext";

const emptyForm = {
  name: "",
  category: "",
  unit: "kg",
  purchase_price: "",
  sale_price: "",
  quantity: "",
  minimum_quantity: "",
  supplier: "",
  notes: "",
};

export default function Products() {
  const { t } = useLanguage();
  
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadCategories();
  }, [page, limit, searchTerm, categoryFilter, stockFilter]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${searchTerm}&page=${page}&limit=${limit}&category=${categoryFilter}&supplier=${categoryFilter === "all" ? "" : categoryFilter}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setProducts(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setProducts(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorLoadingProducts"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSuppliers() {
    try {
      const res = await api.get("/suppliers");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setSuppliers(res.data);
      } else {
        setSuppliers(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/products/categories");
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
      newErrors.name = t("productNameRequired");
    }

    if (form.purchase_price && isNaN(Number(form.purchase_price))) {
      newErrors.purchase_price = t("purchasePriceMustBeNumber");
    }

    if (form.sale_price && isNaN(Number(form.sale_price))) {
      newErrors.sale_price = t("salePriceMustBeNumber");
    }

    if (form.quantity && isNaN(Number(form.quantity))) {
      newErrors.quantity = t("quantityMustBeNumber");
    }

    if (form.minimum_quantity && isNaN(Number(form.minimum_quantity))) {
      newErrors.minimum_quantity = t("minimumQuantityMustBeNumber");
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

  function editProduct(product) {
    setEditId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || "",
      unit: product.unit || "kg",
      purchase_price: product.purchase_price || "",
      sale_price: product.sale_price || "",
      quantity: product.quantity || "",
      minimum_quantity: product.minimum_quantity || "",
      supplier: product.supplier || "",
      notes: product.notes || "",
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
        await api.put(`/products/${editId}`, form);
        showSnackbar(t("productUpdatedSuccessfully"), "success");
      } else {
        await api.post("/products", form);
        showSnackbar(t("productCreatedSuccessfully"), "success");
      }
      setOpen(false);
      loadProducts();
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorSavingProduct"), "error");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteProduct() {
    if (!deleteId) return;

    try {
      await api.delete(`/products/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar(t("productDeletedSuccessfully"), "success");
      loadProducts();
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorDeletingProduct"), "error");
    }
  }

  function getStockStatus(product) {
    if (product.quantity === 0 || product.quantity === null) return "out_of_stock";
    if (product.quantity <= product.minimum_quantity) return "low_stock";
    return "available";
  }

  const stats = {
    total: total,
    totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
    inventoryValue: products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.purchase_price || 0)), 0),
    lowStock: products.filter(p => p.quantity <= p.minimum_quantity && p.quantity > 0).length,
    categories: categories.length,
    suppliers: suppliers.length,
  };

  const filteredProducts = products
    .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
    .filter((p) => {
      if (stockFilter === "all") return true;
      const status = getStockStatus(p);
      return status === stockFilter;
    })
    .filter((p) =>
      searchTerm === "" ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title={t("products")}
        subtitle={t("manageProducts")}
        actionLabel={t("addProduct")}
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

      <EnterpriseSection title={t("statistics")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title={t("totalProducts")}
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title={t("totalStock")}
            value={stats.totalQuantity}
            color="info"
            icon="📦"
          />
          <EnterpriseStatCard
            title={t("inventoryValue")}
            value={`${stats.inventoryValue.toLocaleString()} DA`}
            color="success"
            icon="💰"
          />
          <EnterpriseStatCard
            title={t("lowStockItems")}
            value={stats.lowStock}
            color="warning"
            icon="⚠️"
          />
          <EnterpriseStatCard
            title={t("categories")}
            value={stats.categories}
            color="default"
            icon="📁"
          />
          <EnterpriseStatCard
            title={t("suppliers")}
            value={stats.suppliers}
            color="primary"
            icon="🏢"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchProducts")}
        filters={[
          { value: "all", label: t("allCategories") },
          ...categories.map(c => ({ value: c, label: c })),
        ]}
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        onRefresh={loadProducts}
      />

      <EnterpriseSection title={t("productList")} loading={loading}>
        {filteredProducts.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noProductsFound")}
            actionLabel={t("addFirstProduct")}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("product")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("category")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("unit")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("quantity")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("minStock")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("purchasePrice")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("salePrice")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("supplier")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            <InventoryIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {product.name}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: "12px" }}>{product.category || "-"}</td>
                      <td style={{ padding: "12px" }}>{product.unit || "-"}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {product.quantity?.toLocaleString() || 0}
                        </Typography>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {product.minimum_quantity?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {product.purchase_price?.toLocaleString() || 0} DA
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        {product.sale_price?.toLocaleString() || 0} DA
                      </td>
                      <td style={{ padding: "12px" }}>{product.supplier_name || "-"}</td>
                      <td style={{ padding: "12px" }}>
                        <StatusChip status={stockStatus} />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title={t("edit")}>
                            <IconButton size="small" color="primary" onClick={() => editProduct(product)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("delete")}>
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(product.id)}>
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
                labelRowsPerPage={t("rowsPerPage")}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t("of")} ${count}`}
              />
            )}
          </Box>
        )}
      </EnterpriseSection>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editId ? t("editProduct") : t("addProduct")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("generalInformation")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("productName")}
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
            label={t("category")}
            name="category"
            value={form.category}
            onChange={change}
          />
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

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("inventory")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("unit")}
            name="unit"
            value={form.unit}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("quantity")}
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={change}
            error={!!errors.quantity}
            helperText={errors.quantity}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("minStock")}
            name="minimum_quantity"
            type="number"
            value={form.minimum_quantity}
            onChange={change}
            error={!!errors.minimum_quantity}
            helperText={errors.minimum_quantity}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("pricing")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("purchasePriceDA")}
            name="purchase_price"
            type="number"
            value={form.purchase_price}
            onChange={change}
            error={!!errors.purchase_price}
            helperText={errors.purchase_price}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("salePriceDA")}
            name="sale_price"
            type="number"
            value={form.sale_price}
            onChange={change}
            error={!!errors.sale_price}
            helperText={errors.sale_price}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("supplier")}
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("supplier")}
            name="supplier"
            value={form.supplier}
            onChange={change}
          >
            <MenuItem value="">{t("selectSupplier")}</MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteProduct}
        title={t("deleteProduct")}
        message={t("confirmDeleteProduct")}
        confirmText={t("delete")}
        type="error"
      />
    </Box>
  );
}