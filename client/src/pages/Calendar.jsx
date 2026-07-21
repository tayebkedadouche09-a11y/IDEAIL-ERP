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
  TablePagination,
  Snackbar,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Event as EventIcon, Today as TodayIcon, CalendarViewMonth as MonthIcon, CalendarViewDay as DayIcon, CalendarViewWeek as WeekIcon } from "@mui/icons-material";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

const localizer = momentLocalizer(moment);

const EVENT_TYPES = [
  { value: "general", label: "General", color: "default" },
  { value: "project_deadline", label: "Project Deadline", color: "primary" },
  { value: "payment_due", label: "Payment Due", color: "warning" },
  { value: "meeting", label: "Meeting", color: "info" },
  { value: "maintenance", label: "Maintenance", color: "secondary" },
];

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  start_time: "",
  end_time: "",
  type: "general",
  project_id: "",
  client_id: "",
  employee_id: "",
  status: "planned",
  notes: "",
};

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    upcoming: 0,
    completed: 0,
    projectDeadlines: 0,
    paymentsDue: 0,
  });
  const [view, setView] = useState("month");

  useEffect(() => {
    loadData();
  }, [page, limit, searchTerm, typeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [eventsRes, projectsRes, clientsRes, employeesRes, statsRes] =
        await Promise.all([
          api.get(`/calendar?page=${page}&limit=${limit}&search=${searchTerm}&type=${typeFilter}`),
          api.get("/projects"),
          api.get("/clients"),
          api.get("/employees"),
          api.get("/calendar/stats/summary"),
        ]);
      
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(eventsRes.data)) {
        setEvents(eventsRes.data);
        setTotal(eventsRes.data.length);
        setTotalPages(1);
      } else {
        setEvents(eventsRes.data.data || []);
        setTotal(eventsRes.data.pagination?.total || 0);
        setTotalPages(eventsRes.data.pagination?.totalPages || 1);
      }
      
      setProjects(projectsRes.data || []);
      setClients(clientsRes.data || []);
      setEmployees(employeesRes.data || []);
      setStats(statsRes.data || stats);
    } catch (err) {
      console.log(err);
      showSnackbar("Error loading calendar data", "error");
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addNew() {
    setEditId(null);
    setForm({
      ...emptyForm,
      event_date: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  function editEvent(event) {
    setEditId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      event_date: event.event_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      type: event.type || "general",
      project_id: event.project_id || "",
      client_id: event.client_id || "",
      employee_id: event.employee_id || "",
      status: event.status || "planned",
      notes: event.notes || "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.title || !form.event_date) {
      showSnackbar("Title and date are required", "error");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/calendar/${editId}`, form);
        showSnackbar("Event updated", "success");
      } else {
        await api.post("/calendar", form);
        showSnackbar("Event created", "success");
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteEvent() {
    if (!deleteId) return;

    try {
      await api.delete(`/calendar/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar("Event deleted", "success");
      loadData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Delete failed", "error");
    }
  }

  const filteredEvents = events.filter((e) =>
    typeFilter === "all" || e.type === typeFilter
  );

  // Convert events for calendar
  const calendarEvents = events.map((e) => ({
    ...e,
    start: new Date(`${e.event_date}T${e.start_time || "00:00"}`),
    end: new Date(`${e.event_date}T${e.end_time || "23:59"}`),
  }));

  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="Manage events, deadlines, and appointments"
        actionLabel="Add Event"
        onAction={addNew}
        icon="📅"
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

      <EnterpriseSection title="Statistics" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title="Total Events"
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title="This Month"
            value={stats.thisMonth}
            color="info"
            icon="📅"
          />
          <EnterpriseStatCard
            title="Upcoming"
            value={stats.upcoming}
            color="warning"
            icon="⏳"
          />
          <EnterpriseStatCard
            title="Completed"
            value={stats.completed}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title="Project Deadlines"
            value={stats.projectDeadlines}
            color="default"
            icon="📁"
          />
          <EnterpriseStatCard
            title="Payments Due"
            value={stats.paymentsDue}
            color="error"
            icon="💰"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title="Calendar View" sx={{ mb: 3 }}>
        <Box sx={{ height: 500 }}>
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            views={["month", "week", "day"]}
            defaultView="month"
            onSelectEvent={(event) => editEvent(event)}
            style={{ height: "100%" }}
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search events..."
        filters={[
          { value: "all", label: "All Types" },
          ...EVENT_TYPES.map(t => ({ value: t.value, label: t.label })),
        ]}
        filterValue={typeFilter}
        onFilterChange={setTypeFilter}
        onRefresh={loadData}
      />

      <EnterpriseSection title="Events List" loading={loading}>
        {filteredEvents.length === 0 ? (
          <EnterpriseEmptyState
            message="No events found"
            actionLabel="Add your first event"
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Related</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>{event.event_date}</td>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {event.title}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Chip label={EVENT_TYPES.find(t => t.value === event.type)?.label || event.type} size="small" />
                    </td>
                    <td style={{ padding: "12px" }}>
                      {event.project_name || event.client_name || "-"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Chip label={event.status} size="small" variant="outlined" />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => editEvent(event)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => openDeleteDialog(event.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))}
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
                labelRowsPerPage="Rows per page"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
              />
            )}
          </Box>
        )}
      </EnterpriseSection>

      {/* Event Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId ? "Edit Event" : "Add Event"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Title"
            name="title"
            value={form.title}
            onChange={change}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={form.description}
            onChange={change}
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            margin="normal"
            type="date"
            label="Date"
            name="event_date"
            value={form.event_date}
            onChange={change}
            InputLabelProps={{ shrink: true }}
            required
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Start Time"
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={change}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Time"
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={change}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Type"
            name="type"
            value={form.type}
            onChange={change}
          >
            {EVENT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Project"
            name="project_id"
            value={form.project_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Client"
            name="client_id"
            value={form.client_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Employee"
            name="employee_id"
            value={form.employee_id}
            onChange={change}
          >
            <MenuItem value="">-- None --</MenuItem>
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label="Status"
            name="status"
            value={form.status}
            onChange={change}
          >
            <MenuItem value="planned">Planned</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
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
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}