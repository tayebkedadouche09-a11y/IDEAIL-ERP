import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  IconButton,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, PictureAsPdf as PdfIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";

const emptyForm = {
  employee_id: "",
  period: "",
  base_salary: 0,
  overtime: 0,
  bonuses: 0,
  deductions: 0,
  tax: 0,
};

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
  }, []);

  async function loadPayrolls() {
    try {
      const params = new URLSearchParams();
      if (selectedEmployee !== "all") params.append("employee_id", selectedEmployee);
      
      const res = await api.get(`/employees/payroll?${params.toString()}`);
      setPayrolls(res.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data.data || res.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: parseFloat(e.target.value) || 0 });
  }

  function addNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  async function save() {
    try {
      await api.post(`/employees/${form.employee_id}/payroll`, form);
      setMessage({ type: "success", text: "Payroll generated" });
      setOpen(false);
      loadPayrolls();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  return (
    <Box>
      <PageHeader
        title="Payroll"
        subtitle="Generate and manage employee payroll"
        actionLabel="Generate Payroll"
        onAction={addNew}
        icon="💰"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseTableToolbar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Search payroll..."
        filters={[
          { value: "all", label: "All Employees" },
          ...employees.map((e) => ({ value: e.id, label: e.name })),
        ]}
        filterValue={selectedEmployee}
        onFilterChange={setSelectedEmployee}
        onRefresh={loadPayrolls}
      />

      <EnterpriseSection title="Payroll Records">
        {payrolls.length === 0 ? (
          <EnterpriseEmptyState
            message="No payroll records found"
            actionLabel="Generate payroll"
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Employee</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Period</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Base Salary</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Overtime</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Bonuses</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Deductions</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Tax</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Net Salary</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>{rec.employee_name || rec.name || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.period || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.base_salary?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px" }}>{rec.overtime?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px" }}>{rec.bonuses?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px" }}>{rec.deductions?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px" }}>{rec.tax?.toLocaleString() || 0} DA</td>
                    <td style={{ padding: "12px" }}>
                      <Typography fontWeight="bold" color="primary">
                        {rec.net_salary?.toLocaleString() || 0} DA
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {rec.status === "paid" ? "✅ Paid" : "📄 Draft"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </EnterpriseSection>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Employee"
            name="employee_id"
            value={form.employee_id}
            onChange={change}
            required
          >
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Period"
            name="period"
            value={form.period}
            onChange={change}
            placeholder="e.g., 2024-01"
          />
          <TextField
            fullWidth
            margin="normal"
            label="Base Salary (DA)"
            name="base_salary"
            type="number"
            value={form.base_salary}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Overtime (DA)"
            name="overtime"
            type="number"
            value={form.overtime}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Bonuses (DA)"
            name="bonuses"
            type="number"
            value={form.bonuses}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Deductions (DA)"
            name="deductions"
            type="number"
            value={form.deductions}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Tax (DA)"
            name="tax"
            type="number"
            value={form.tax}
            onChange={change}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Generate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}