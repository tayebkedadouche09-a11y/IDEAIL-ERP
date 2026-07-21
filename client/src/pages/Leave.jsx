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
import { Add as AddIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";

const emptyForm = {
  employee_id: "",
  leave_type: "annual",
  start_date: "",
  end_date: "",
  days: 1,
  notes: "",
};

export default function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, []);

  async function loadLeaves() {
    try {
      const params = new URLSearchParams();
      if (selectedEmployee !== "all") params.append("employee_id", selectedEmployee);
      
      const res = await api.get(`/employees/leave?${params.toString()}`);
      setLeaves(res.data || []);
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
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  async function save() {
    try {
      await api.post(`/employees/${form.employee_id}/leave`, form);
      setMessage({ type: "success", text: "Leave request submitted" });
      setOpen(false);
      loadLeaves();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/employees/leave/${id}`, { status });
      setMessage({ type: "success", text: "Leave request updated" });
      loadLeaves();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  return (
    <Box>
      <PageHeader
        title="Leave Requests"
        subtitle="Manage employee leave requests"
        actionLabel="New Leave Request"
        onAction={addNew}
        icon="🏖️"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseTableToolbar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="Search leave..."
        filters={[
          { value: "all", label: "All Employees" },
          ...employees.map((e) => ({ value: e.id, label: e.name })),
        ]}
        filterValue={selectedEmployee}
        onFilterChange={setSelectedEmployee}
        onRefresh={loadLeaves}
      />

      <EnterpriseSection title="Leave Requests">
        {leaves.length === 0 ? (
          <EnterpriseEmptyState
            message="No leave requests found"
            actionLabel="Submit leave request"
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Employee</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Start Date</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>End Date</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Days</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>{rec.employee_name || rec.name || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      {rec.leave_type === "annual" ? "📅 Annual" : 
                       rec.leave_type === "sick" ? "🏥 Sick" : "💸 Unpaid"}
                    </td>
                    <td style={{ padding: "12px" }}>{rec.start_date || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.end_date || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.days || 0}</td>
                    <td style={{ padding: "12px" }}>
                      {rec.status === "approved" ? "✅ Approved" : 
                       rec.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {rec.status === "pending" && (
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => updateStatus(rec.id, "approved")}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => updateStatus(rec.id, "rejected")}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </EnterpriseSection>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Leave Request</DialogTitle>
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
            select
            fullWidth
            margin="normal"
            label="Leave Type"
            name="leave_type"
            value={form.leave_type}
            onChange={change}
          >
            <MenuItem value="annual">📅 Annual Leave</MenuItem>
            <MenuItem value="sick">🏥 Sick Leave</MenuItem>
            <MenuItem value="unpaid">💸 Unpaid Leave</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Start Date"
            name="start_date"
            type="date"
            value={form.start_date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="End Date"
            name="end_date"
            type="date"
            value={form.end_date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Days"
            name="days"
            type="number"
            value={form.days}
            onChange={change}
          />
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
          <Button variant="contained" onClick={save}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}