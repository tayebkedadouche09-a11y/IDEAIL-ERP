import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const emptyItem = { description: "", quantity: 1, unit_price: 0, length: 0, width: 0, height: 0, surface: 0, consumption: 0 };

export default function DevisForm({ open, onClose, onSaved, editDevis }) {
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    title: "",
    description: "",
    valid_until: "",
    notes: "",
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      loadClients();
      loadProjects();
      loadProducts();
      if (editDevis) {
        setForm({
          client_id: editDevis.client_id || "",
          project_id: editDevis.project_id || "",
          title: editDevis.title || "",
          description: editDevis.description || "",
          valid_until: editDevis.valid_until || "",
          notes: editDevis.notes || "",
        });
        setItems(
          editDevis.items && editDevis.items.length > 0
            ? editDevis.items.map((i) => ({
                description: i.description,
                quantity: i.quantity,
                unit_price: i.unit_price,
                length: i.length || 0,
                width: i.width || 0,
                height: i.height || 0,
                surface: i.surface || 0,
                consumption: i.consumption || 0,
              }))
            : [{ ...emptyItem }]
        );
      } else {
        setForm({
          client_id: "",
          project_id: "",
          title: "",
          description: "",
          valid_until: "",
          notes: "",
        });
        setItems([{ ...emptyItem }]);
      }
      setError("");
    }
  }, [open, editDevis]);

  async function loadClients() {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadProjects() {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadProducts() {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleItemChange(index, field, value) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate surface and quantity when dimensions change
    if (["length", "width", "height"].includes(field)) {
      const item = newItems[index];
      const length = Number(field === "length" ? value : item.length) || 0;
      const width = Number(field === "width" ? value : item.width) || 0;
      const height = Number(field === "height" ? value : item.height) || 0;
      
      // Calculate surface area (m²) - assuming rectangular/square
      const surface = length * width;
      if (surface > 0 && "height" === field) {
        // For volume-based materials, multiply by height
        newItems[index].surface = surface;
      }
      
      // Auto-calculate quantity based on consumption rate
      const consumption = Number(item.consumption) || 1;
      if (consumption > 0 && surface > 0) {
        newItems[index].quantity = Math.ceil(surface * consumption);
      }
      newItems[index].surface = surface;
    }
    
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { ...emptyItem }]);
  }

  function removeItem(index) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function calculateTotal() {
    return items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      0
    );
  }

  function calculateSurface(item) {
    const length = Number(item.length) || 0;
    const width = Number(item.width) || 0;
    return length * width;
  }

  function calculateAutoQuantity(surface, consumption) {
    const cons = Number(consumption) || 1;
    return Math.ceil(surface * cons);
  }

  async function handleSave() {
    setError("");

    if (!form.client_id) {
      setError(t("pleaseSelectAClient"));
      return;
    }

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError(t("atLeastOneDescriptionRequired"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        project_id: form.project_id ? Number(form.project_id) : null,
        items: validItems.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
          length: Number(i.length) || 0,
          width: Number(i.width) || 0,
          height: Number(i.height) || 0,
          surface: Number(i.surface) || 0,
          consumption: Number(i.consumption) || 1,
        })),
      };

      if (editDevis) {
        await api.put(`/devis/${editDevis.id}`, payload);
      } else {
        await api.post("/devis", payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || t("failedToSaveDevis"));
    } finally {
      setSaving(false);
    }
  }

  const total = calculateTotal();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {editDevis ? t("editDevis") : t("addDevis")}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Client & Project */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 1 }}>
          <TextField
            select
            fullWidth
            label={t("client") + " *"}
            name="client_id"
            value={form.client_id}
            onChange={handleFormChange}
            disabled={!!editDevis}
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
            label={t("project") + " (optional)"}
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

        {/* Title & Valid Until */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label={t("title")}
            name="title"
            value={form.title}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label={t("validUntil")}
            name="valid_until"
            type="date"
            value={form.valid_until}
            onChange={handleFormChange}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* Description */}
        <TextField
          fullWidth
          multiline
          rows={2}
          label={t("description")}
          name="description"
          value={form.description}
          onChange={handleFormChange}
          sx={{ mb: 2 }}
        />

        {/* Items Table with Measurement Calculations */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          {t("items")}
        </Typography>

        <Table size="small" sx={{ mb: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                {t("description")}
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "8%" }} align="right">
                {t("length")} (m)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "8%" }} align="right">
                {t("width")} (m)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "8%" }} align="right">
                {t("consumption")}
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "10%" }} align="right">
                {t("surface")} (m²)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "10%" }} align="right">
                {t("quantity")}
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "12%" }} align="right">
                {t("unitPrice")} ({t("currencyDA")})
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "12%" }} align="right">
                {t("total")} ({t("currencyDA")})
              </TableCell>
              <TableCell sx={{ width: 40 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const surface = calculateSurface(item);
              return (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={item.description}
                      onChange={(e) => {
                        const selectedProduct = products.find(p => p.name === e.target.value);
                        handleItemChange(index, "description", e.target.value);
                        if (selectedProduct) {
                          handleItemChange(index, "unit_price", selectedProduct.selling_price || selectedProduct.purchase_price || 0);
                          handleItemChange(index, "consumption", selectedProduct.consumption_rate || 1);
                        }
                      }}
                    >
                      <MenuItem value="">{t("selectProduct")}</MenuItem>
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.name}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.length || ""}
                      onChange={(e) => handleItemChange(index, "length", e.target.value)}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: "right" } }}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.width || ""}
                      onChange={(e) => handleItemChange(index, "width", e.target.value)}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: "right" } }}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.consumption || ""}
                      onChange={(e) => handleItemChange(index, "consumption", e.target.value)}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: "right" } }}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {surface ? surface.toLocaleString() : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: "right" } }}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                      inputProps={{ min: 0, style: { textAlign: "right" } }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {((Number(item.quantity) || 1) * (Number(item.unit_price) || 0)).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Button
          startIcon={<AddIcon />}
          onClick={addItem}
          size="small"
          sx={{ mb: 2 }}
        >
          {t("add")} {t("item")}
        </Button>

        {/* Total */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 1.5,
            bgcolor: "#f5f5f5",
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {t("total")}: {total.toLocaleString()} {t("currencyDA")}
          </Typography>
        </Box>

        {/* Notes */}
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
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t("saving") : editDevis ? t("update") : t("create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}