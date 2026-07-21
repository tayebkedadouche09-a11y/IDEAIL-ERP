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
  Tabs,
  Tab,
  Chip,
  Alert,
} from "@mui/material";
import api from "../services/api";

export default function Debts() {
  const [tab, setTab] = useState(0);
  const [clientDebts, setClientDebts] = useState([]);
  const [supplierDebts, setSupplierDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    setLoading(true);
    try {
      const [clientRes, supplierRes] = await Promise.all([
        api.get("/financial/client-debts"),
        api.get("/financial/supplier-debts"),
      ]);
      setClientDebts(clientRes.data || []);
      setSupplierDebts(supplierRes.data || []);
    } catch (err) {
      console.log(err);
      setMessage({ type: "error", text: "Failed to load debts" });
    } finally {
      setLoading(false);
    }
  }

  function getDaysOverdue(invoiceDate) {
    if (!invoiceDate) return 0;
    const today = new Date();
    const dueDate = new Date(invoiceDate);
    const diffTime = Math.abs(today - dueDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getOverdueColor(days) {
    if (days > 90) return "error";
    if (days > 60) return "error";
    if (days > 30) return "warning";
    return "info";
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          💰 Debts Management
        </Typography>
        <Button variant="contained" onClick={loadDebts} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Client Debts (${clientDebts.length})`} />
          <Tab label={`Supplier Debts (${supplierDebts.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Client Debts */}
      {tab === 0 && (
        <Box>
          {clientDebts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="text.secondary">
                No client debts found. All invoices are paid!
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Invoice</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">
                    Total Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">
                    Paid
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">
                    Remaining
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Days Overdue</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientDebts.map((debt) => {
                  const daysOverdue = getDaysOverdue(debt.invoice_date);
                  return (
                    <TableRow key={debt.id}>
                      <TableCell>{debt.client_name}</TableCell>
                      <TableCell>{debt.invoice_number}</TableCell>
                      <TableCell align="right">
                        {Number(debt.amount || 0).toLocaleString()} DA
                      </TableCell>
                      <TableCell align="right">
                        {Number(debt.paid_amount || 0).toLocaleString()} DA
                      </TableCell>
                      <TableCell align="right" sx={{ color: "error.main", fontWeight: "bold" }}>
                        {Number((debt.amount || 0) - (debt.paid_amount || 0)).toLocaleString()} DA
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${daysOverdue} days`}
                          size="small"
                          color={getOverdueColor(daysOverdue)}
                        />
                      </TableCell>
                      <TableCell>{debt.invoice_date}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* TAB 1: Supplier Debts */}
      {tab === 1 && (
        <Box>
          {supplierDebts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="text.secondary">
                No supplier debts found. All expenses are paid!
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Supplier</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Expense</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">
                    Total Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">
                    Paid
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="right">
                    Remaining
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierDebts.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell>{debt.supplier_name || "-"}</TableCell>
                    <TableCell>{debt.title}</TableCell>
                    <TableCell>{debt.category_name || "-"}</TableCell>
                    <TableCell align="right">
                      {Number(debt.total_amount || 0).toLocaleString()} DA
                    </TableCell>
                    <TableCell align="right">
                      {Number(debt.paid_amount || 0).toLocaleString()} DA
                    </TableCell>
                    <TableCell align="right" sx={{ color: "error.main", fontWeight: "bold" }}>
                      {Number((debt.total_amount || 0) - (debt.paid_amount || 0)).toLocaleString()} DA
                    </TableCell>
                    <TableCell>{debt.expense_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}
    </Paper>
  );
}