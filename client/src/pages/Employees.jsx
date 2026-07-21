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
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Work as WorkIcon, Phone as PhoneIcon, Email as EmailIcon, Badge as BadgeIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";

import { useLanguage } from "../context/LanguageContext";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  birth_date: "",
  hire_date: "",
  job_title: "",
  department: "",
  emergency_contact: "",
  national_id: "",
  tax_number: "",
  social_security_number: "",
  salary_type: "daily",
  daily_rate: "",
  hourly_rate: "",
  monthly_salary: "",
  status: "active",
  notes: "",
};

export default function Employees() {
  const { t } = useLanguage();
  
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    totalSalary: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadEmployees();
    loadStats();
  }, []);

  async function loadEmployees() {
    try {
      const res = await api.get(`/employees?status=${statusFilter}&search=${searchTerm}`);
      setEmployees(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      console.log(err);
    }
  }

  async function loadStats() {
    try {
      const res = await api.get("/employees/stats");
      setStats(res.data);
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

  function editEmployee(emp) {
    setEditId(emp.id);
    setForm({
      name: emp.name || "",
      phone: emp.phone || "",
      email: emp.email || "",
      address: emp.address || "",
      birth_date: emp.birth_date || "",
      hire_date: emp.hire_date || "",
      job_title: emp.job_title || "",
      department: emp.department || "",
      emergency_contact: emp.emergency_contact || "",
      national_id: emp.national_id || "",
      tax_number: emp.tax_number || "",
      social_security_number: emp.social_security_number || "",
      salary_type: emp.salary_type || "daily",
      daily_rate: emp.daily_rate || "",
      hourly_rate: emp.hourly_rate || "",
      monthly_salary: emp.monthly_salary || "",
      status: emp.status || "active",
      notes: emp.notes || "",
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editId) {
        await api.put(`/employees/${editId}`, form);
        setMessage({ type: "success", text: t("employeeUpdated") });
      } else {
        await api.post("/employees", form);
        setMessage({ type: "success", text: t("employeeAdded") });
      }
      setOpen(false);
      loadEmployees();
      loadStats();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("saveFailed") });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  async function remove(id) {
    if (!window.confirm(t("deleteEmployeeConfirm"))) return;
    try {
      await api.delete(`/employees/${id}`);
      setMessage({ type: "success", text: t("employeeDeleted") });
      loadEmployees();
      loadStats();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("deleteFailed") });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  const filteredEmployees = employees.filter((e) =>
    statusFilter === "all" || e.status === statusFilter
  );

  return (
    <Box>
      <PageHeader
        title={t("employees")}
        subtitle={t("manageEmployees")}
        actionLabel={t("addEmployee")}
        onAction={addNew}
        icon="👷"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseSection title={t("statistics")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title={t("totalEmployees")}
            value={stats.total}
            color="primary"
            icon="👥"
          />
          <EnterpriseStatCard
            title={t("active")}
            value={stats.active}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title={t("onLeave")}
            value={stats.onLeave}
            color="warning"
            icon="🏖️"
          />
          <EnterpriseStatCard
            title={t("monthlySalary")}
            value={`${stats.totalSalary?.toLocaleString() || 0} DA`}
            color="primary"
            icon="💰"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchEmployees")}
        filters={[
          { value: "all", label: t("allStatus") },
          { value: "active", label: t("active") },
          { value: "inactive", label: t("inactive") },
        ]}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        onRefresh={loadEmployees}
      />

      <EnterpriseSection title={t("employeeList")}>
        {filteredEmployees.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noEmployeesFound")}
            actionLabel={t("addFirstEmployee")}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("avatar")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("code")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("name")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("position")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("department")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("phone")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("email")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>
                      <Avatar src={emp.photo} sx={{ bgcolor: "primary.main" }}>
                        {emp.name?.charAt(0) || "👷"}
                      </Avatar>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" color="text.secondary">
                        {emp.employee_code}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {emp.name}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>{emp.job_title || "-"}</td>
                    <td style={{ padding: "12px" }}>{emp.department || "-"}</td>
                    <td style={{ padding: "12px" }}>{emp.phone || "-"}</td>
                    <td style={{ padding: "12px" }}>{emp.email || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <StatusChip status={emp.status} />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title={t("view")}>
                          <IconButton size="small" color="primary" onClick={() => editEmployee(emp)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("delete")}>
                          <IconButton size="small" color="error" onClick={() => remove(emp.id)}>
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
          {editId ? t("editEmployee") : t("addEmployee")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("personalInformation")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("name")}
            name="name"
            value={form.name}
            onChange={change}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("phone")}
            name="phone"
            value={form.phone}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("email")}
            name="email"
            type="email"
            value={form.email}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("address")}
            name="address"
            value={form.address}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("birthDate")}
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("hireDate")}
            name="hire_date"
            type="date"
            value={form.hire_date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("workInformation")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("position")}
            name="job_title"
            value={form.job_title}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("department")}
            name="department"
            value={form.department}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("emergencyContact")}
            name="emergency_contact"
            value={form.emergency_contact}
            onChange={change}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("identification")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("nationalId")}
            name="national_id"
            value={form.national_id}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("taxNumber")}
            name="tax_number"
            value={form.tax_number}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("socialSecurityNumber")}
            name="social_security_number"
            value={form.social_security_number}
            onChange={change}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("financialInformation")}
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("salaryType")}
            name="salary_type"
            value={form.salary_type}
            onChange={change}
          >
            <MenuItem value="daily">{t("daily")}</MenuItem>
            <MenuItem value="monthly">{t("monthly")}</MenuItem>
            <MenuItem value="hourly">{t("hourly")}</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label={t("dailyRateDA")}
            name="daily_rate"
            type="number"
            value={form.daily_rate}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("hourlyRateDA")}
            name="hourly_rate"
            type="number"
            value={form.hourly_rate}
            onChange={change}
          />
          <TextField
            fullWidth
            margin="normal"
            label={t("monthlySalaryDA")}
            name="monthly_salary"
            type="number"
            value={form.monthly_salary}
            onChange={change}
          />

          <TextField
            select
            fullWidth
            margin="normal"
            label={t("status")}
            name="status"
            value={form.status}
            onChange={change}
          >
            <MenuItem value="active">🟢 {t("active")}</MenuItem>
            <MenuItem value="inactive">🔴 {t("inactive")}</MenuItem>
          </TextField>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("additional")}
          </Typography>
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