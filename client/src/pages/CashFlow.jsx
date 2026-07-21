import { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Chip,
  Alert,
  TextField,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import api from "../services/api";

const emptyForm = {
  movement_type: "income",
  category: "",
  amount: "",
  payment_method: "cash",
  reference_id: "",
  reference_type: "",
  description: "",
  movement_date: "",
};

export default function CashFlow() {
  const [movements, setMovements] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dateFilter, setDateFilter] = useState({
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    loadMovements();
  }, []);

  async function loadMovements() {
    try {
      const res = await api.get("/financial/cash-movements", {
        params: dateFilter,
      });
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setMovements(data);
    } catch (err) {
      setMovements([]);
      setMessage({ type: "error", text: "Failed to load cash movements" });
    }
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function save() {
    try {
      await api.post("/financial/cash-movements", form);
      setMessage({ type: "success", text: "Cash movement recorded" });
      setOpen(false);
      setForm(emptyForm);
      loadMovements();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  const safeMovements = Array.isArray(movements) ? movements : [];
  const totalIncome = safeMovements
    .filter((m) => m.movement_type === "income")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const totalExpense = safeMovements
    .filter((m) => m.movement_type === "expense")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          💵 Cash Flow Tracking
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Movement
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
        <Box sx={{ p: 2, bgcolor: "#e8f5e9", borderRadius: 1, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">
            Total Income
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="success.main">
            {totalIncome.toLocaleString()} DA
          </Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: "#ffebee", borderRadius: 1, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">
            Total Expense
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="error.main">
            {totalExpense.toLocaleString()} DA
          </Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: balance >= 0 ? "#e3f2fd" : "#fff3e0", borderRadius: 1, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary">
            Balance
          </Typography>
          <Typography variant="h5" fontWeight="bold" color={balance >= 0 ? "primary" : "warning.main"}>
            {balance.toLocaleString()} DA
          </Typography>
        </Box>
      </Box>

      {/* Date Filter */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          type="date"
          size="small"
          label="Start Date"
          value={dateFilter.start_date}
          onChange={(e) => setDateFilter({ ...dateFilter, start_date: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          size="small"
          label="End Date"
          value={dateFilter.end_date}
          onChange={(e) => setDateFilter({ ...dateFilter, end_date: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="outlined" onClick={loadMovements}>
          Filter
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="right">
              Amount
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Method</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="text.secondary">No cash movements found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.movement_date?.slice(0, 10)}</TableCell>
                <TableCell>
                  <Chip
                    label={m.movement_type === "income" ? "Income" : "Expense"}
                    size="small"
                    color={m.movement_type === "income" ? "success" : "error"}
                  />
                </TableCell>
                <TableCell>{m.category || "-"}</TableCell>
                <TableCell>{m.description || "-"}</TableCell>
                <TableCell align="right" sx={{ color: m.movement_type === "income" ? "success.main" : "error.main" }}>
                  {m.movement_type === "income" ? "+" : "-"}
                  {Number(m.amount || 0).toLocaleString()} DA
                </TableCell>
                <TableCell>{m.payment_method}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Movement Dialog */}
      {open && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Paper sx={{ p: 3, width: 400 }}>
            <Typography variant="h6" mb={2}>
              New Cash Movement
            </Typography>
            <TextField
              select
              fullWidth
              label="Type"
              name="movement_type"
              value={form.movement_type}
              onChange={change}
              sx={{ mb: 2 }}
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={form.category}
              onChange={change}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Amount (DA)"
              name="amount"
              type="number"
              value={form.amount}
              onChange={change}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              fullWidth
              label="Payment Method"
              name="payment_method"
              value={form.payment_method}
              onChange={change}
              sx={{ mb: 2 }}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="check">Check</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={form.description}
              onChange={change}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Date"
              name="movement_date"
              type="date"
              value={form.movement_date}
              onChange={change}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={save}>
                Save
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Paper>
  );
}
