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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, AccessTime as AccessTimeIcon, Today as TodayIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";

const emptyForm = {
  employee_id: "",
  date: new Date().toISOString().split("T")[0],
  clock_in: "",
  clock_out: "",
  status: "present",
  notes: "",
};

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    loadAttendance();
    loadEmployees();
  }, []);

  async function loadAttendance() {
    try {
      const params = new URLSearchParams();
      if (selectedEmployee !== "all") params.append("employee_id", selectedEmployee);
      if (selectedDate) params.append("date", selectedDate);
      
      const res = await api.get(`/employees/attendance?${params.toString()}`);
      setAttendance(res.data || []);
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

  function editRecord(rec) {
    setEditId(rec.id);
    setForm({
      employee_id: rec.employee_id || "",
      date: rec.date || "",
      clock_in: rec.clock_in || "",
      clock_out: rec.clock_out || "",
      status: rec.status || "present",
      notes: rec.notes || "",
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editId) {
        await api.put(`/employees/attendance/${editId}`, form);
        setMessage({ type: "success", text: "Attendance updated" });
      } else {
        await api.post(`/employees/${form.employee_id}/attendance`, form);
        setMessage({ type: "success", text: "Attendance recorded" });
      }
      setOpen(false);
      loadAttendance();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  return (
    <Box>
      <PageHeader
        title="Attendance"
        subtitle="Track employee attendance and hours"
        actionLabel="Record Attendance"
        onAction={addNew}
        icon="⏰"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseTableToolbar
        searchValue={selectedDate}
        onSearchChange={setSelectedDate}
        searchPlaceholder="Filter by date..."
        filters={[
          { value: "all", label: "All Employees" },
          ...employees.map((e) => ({ value: e.id, label: e.name })),
        ]}
        filterValue={selectedEmployee}
        onFilterChange={setSelectedEmployee}
        onRefresh={loadAttendance}
      />

      <EnterpriseSection title="Attendance Records">
        {attendance.length === 0 ? (
          <EnterpriseEmptyState
            message="No attendance records found"
            actionLabel="Record attendance"
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Employee</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Clock In</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Clock Out</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Hours</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Overtime</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>{rec.employee_name || rec.name || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.date}</td>
                    <td style={{ padding: "12px" }}>{rec.clock_in || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.clock_out || "-"}</td>
                    <td style={{ padding: "12px" }}>{rec.hours_worked?.toFixed(2) || "0.00"}</td>
                    <td style={{ padding: "12px" }}>{rec.overtime?.toFixed(2) || "0.00"}</td>
                    <td style={{ padding: "12px" }}>
                      {rec.late_arrival ? "🕐 Late" : rec.status === "present" ? "✅ Present" : "❌ Absent"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={() => editRecord(rec)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}
      </EnterpriseSection>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId ? "Edit Attendance" : "Record Attendance"}
        </DialogTitle>
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
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Clock In"
            name="clock_in"
            type="time"
            value={form.clock_in}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Clock Out"
            name="clock_out"
            type="time"
            value={form.clock_out}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={form.status}
            onChange={change}
          >
            <MenuItem value="present">✅ Present</MenuItem>
            <MenuItem value="absent">❌ Absent</MenuItem>
            <MenuItem value="late">🕐 Late</MenuItem>
          </TextField>
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
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}