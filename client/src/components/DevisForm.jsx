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

const emptyItem = { description: "", quantity: 1, unit_price: 0 };

export default function DevisForm({ open, onClose, onSaved, editDevis }) {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
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

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleItemChange(index, field, value) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
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

  async function handleSave() {
    setError("");

    if (!form.client_id) {
      setError("Please select a client");
      return;
    }

    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError("At least one item with a description is required");
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
      setError(err.response?.data?.error || "Failed to save devis");
    } finally {
      setSaving(false);
    }
  }

  const total = calculateTotal();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editDevis ? "Edit Devis" : "New Devis"}
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
            label="Client *"
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
            label="Project (optional)"
            name="project_id"
            value={form.project_id}
            onChange={handleFormChange}
          >
            <MenuItem value="">-- None --</MenuItem>
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
            label="Title"
            name="title"
            value={form.title}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            label="Valid Until"
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
          label="Description"
          name="description"
          value={form.description}
          onChange={handleFormChange}
          sx={{ mb: 2 }}
        />

        {/* Items Table */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Items
        </Typography>

        <Table size="small" sx={{ mb: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", width: "50%" }}>
                Description
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "15%" }} align="right">
                Quantity
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "20%" }} align="right">
                Unit Price (DA)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "15%" }} align="right">
                Total (DA)
              </TableCell>
              <TableCell sx={{ width: 40 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Item description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    inputProps={{ min: 0, style: { textAlign: "right" } }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={item.unit_price}
                    onChange={(e) =>
                      handleItemChange(index, "unit_price", e.target.value)
                    }
                    inputProps={{ min: 0, style: { textAlign: "right" } }}
                    sx={{ width: 100 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {(
                      (Number(item.quantity) || 1) *
                      (Number(item.unit_price) || 0)
                    ).toLocaleString()}
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
            ))}
          </TableBody>
        </Table>

        <Button
          startIcon={<AddIcon />}
          onClick={addItem}
          size="small"
          sx={{ mb: 2 }}
        >
          Add Item
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
            Total: {total.toLocaleString()} DA
          </Typography>
        </Box>

        {/* Notes */}
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Notes"
          name="notes"
          value={form.notes}
          onChange={handleFormChange}
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : editDevis ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}