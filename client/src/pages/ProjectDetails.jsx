import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Divider,
  IconButton,
  useMediaQuery,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import StatusChip from "../components/StatusChip";
import { spacing, borderRadius, shadows, transitions } from "../theme/designTokens";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "@mui/material/styles";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const [workerForm, setWorkerForm] = useState({
    employee_id: "",
    days_worked: 1,
    daily_rate: 0,
    notes: "",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    loadProject();
    loadEmployees();
    loadWorkers();
    loadMaterials();
    loadExpenses();
    loadDocuments();
    loadTimeline();
  }, []);

  async function loadProject() {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadWorkers() {
    try {
      const res = await api.get(`/projects/${id}/workers`);
      setWorkers(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadMaterials() {
    try {
      const res = await api.get(`/project-materials/${id}`);
      setMaterials(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadExpenses() {
    try {
      const res = await api.get(`/project-expenses/${id}`);
      setExpenses(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadDocuments() {
    try {
      const res = await api.get(`/projects/${id}/documents`);
      setDocuments(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadTimeline() {
    try {
      const res = await api.get(`/projects/${id}/timeline`);
      setTimeline(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  function changeWorker(e) {
    setWorkerForm({
      ...workerForm,
      [e.target.name]: e.target.value,
    });
  }

  async function addWorker() {
    if (!workerForm.employee_id) {
      alert("اختر العامل");
      return;
    }

    try {
      await api.post(`/projects/${id}/workers`, {
        ...workerForm,
        days_worked: Number(workerForm.days_worked),
        daily_rate: Number(workerForm.daily_rate),
      });

      loadWorkers();
      setWorkerForm({
        employee_id: "",
        days_worked: 1,
        daily_rate: 0,
        notes: "",
      });
    } catch (err) {
      console.log(err);
    }
  }

  async function deleteWorker(workerId) {
    if (!window.confirm("هل تريد حذف العامل؟")) return;

    try {
      await api.delete(`/projects/${id}/workers/${workerId}`);
      loadWorkers();
    } catch (err) {
      console.log(err);
    }
  }

  const workerCost = workers.reduce(
    (total, w) =>
      total +
      Number(w.days_worked || 0) *
      Number(w.daily_rate || 0),
    0
  );

  const materialCost = materials.reduce(
    (total, m) =>
      total +
      Number(m.total_cost || 0),
    0
  );

  const expenseCost = expenses.reduce(
    (total, e) =>
      total +
      Number(e.amount || 0),
    0
  );

  const totalCost = workerCost + materialCost + expenseCost;

  const profit =
    Number(project?.amount || 0) -
    totalCost;

  const profitPercent =
    project?.amount
      ? ((profit / project.amount) * 100).toFixed(2)
      : 0;

  async function createInvoice() {
    try {
      const res = await api.post(
        `/invoices/from-project/${id}`
      );

      alert(
        "تم إنشاء الفاتورة رقم: " +
        res.data.invoice_number
      );

      window.open(
        `http://localhost:3000/pdf/invoice/${res.data.id}`,
        "_blank"
      );
    } catch (err) {
      console.log(err);
      alert("خطأ أثناء إنشاء الفاتورة");
    }
  }

  return (
    <Box>
      {/* Page Header */}
      <PageHeader
        title={project?.name || "Project Details"}
        subtitle="Project workspace"
        icon="📁"
        onRefresh={loadProject}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<RequestQuoteIcon />}
              sx={{ mr: 1 }}
            >
              Generate Quote
            </Button>
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={createInvoice}
            >
              Generate Invoice
            </Button>
          </>
        }
      />

      {/* Main Layout */}
      <Grid container spacing={3}>
        {/* Left Side - 70% */}
        <Grid item xs={12} lg={8}>
          {/* Project Summary Card */}
          {project && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: borderRadius.lg,
                boxShadow: shadows.card,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {project.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Code: {project.project_code || "-"}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <StatusChip
                      status={project.status || "جديد"}
                      type="project"
                    />
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Client
                  </Typography>
                  <Typography>{project.client_name || "-"}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    System
                  </Typography>
                  <Typography>{project.system_name || "-"}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography>{project.start_date || "-"}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    End Date
                  </Typography>
                  <Typography>{project.end_date || "-"}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Tabs */}
          <Paper
            sx={{
              borderRadius: borderRadius.lg,
              boxShadow: shadows.card,
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Overview" />
              <Tab label="Materials" />
              <Tab label="Employees" />
              <Tab label="Expenses" />
              <Tab label="Documents" />
              <Tab label="Timeline" />
              <Tab label="Profitability" />
            </Tabs>

            {/* Overview Tab */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <StatCard
                      title="Revenue"
                      value={`${(project?.amount / 1000).toFixed(0) || 0}k DA`}
                      icon="💰"
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <StatCard
                      title="Cost"
                      value={`${(totalCost / 1000).toFixed(0) || 0}k DA`}
                      icon="💸"
                      color="error"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <StatCard
                      title="Profit"
                      value={`${(profit / 1000).toFixed(0) || 0}k DA`}
                      icon="📈"
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <StatCard
                      title="Margin"
                      value={`${profitPercent}%`}
                      icon="📊"
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <StatCard
                      title="Completion"
                      value="0%"
                      icon="✅"
                      color="warning"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Materials Tab */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Materials
                </Typography>
                {materials.length === 0 ? (
                  <Typography color="text.secondary">No materials added</Typography>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Material</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Quantity</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Unit</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Price</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m) => (
                          <tr key={m.id}>
                            <td style={{ padding: 8 }}>{m.product_name}</td>
                            <td style={{ padding: 8 }}>{m.quantity}</td>
                            <td style={{ padding: 8 }}>{m.unit || "kg"}</td>
                            <td style={{ padding: 8 }}>{m.unit_price} DA</td>
                            <td style={{ padding: 8 }}>{m.total_cost} DA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </Box>
            )}

            {/* Employees Tab */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Employees
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    mb: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label="Employee"
                    name="employee_id"
                    value={workerForm.employee_id}
                    onChange={changeWorker}
                    sx={{ minWidth: 150 }}
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    size="small"
                    type="number"
                    label="Days"
                    name="days_worked"
                    value={workerForm.days_worked}
                    onChange={changeWorker}
                    sx={{ width: 100 }}
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Rate"
                    name="daily_rate"
                    value={workerForm.daily_rate}
                    onChange={changeWorker}
                    sx={{ width: 120 }}
                  />

                  <Button variant="contained" onClick={addWorker}>
                    Add
                  </Button>
                </Box>

                {workers.length === 0 ? (
                  <Typography color="text.secondary">No employees assigned</Typography>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Employee</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Days</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Rate</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Cost</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((w) => (
                          <tr key={w.id}>
                            <td style={{ padding: 8 }}>{w.employee_name}</td>
                            <td style={{ padding: 8 }}>{w.days_worked}</td>
                            <td style={{ padding: 8 }}>{w.daily_rate} DA</td>
                            <td style={{ padding: 8 }}>
                              {Number(w.days_worked) * Number(w.daily_rate)} DA
                            </td>
                            <td style={{ padding: 8 }}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteWorker(w.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </Box>
            )}

            {/* Expenses Tab */}
            {tabValue === 3 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Expenses
                </Typography>
                {expenses.length === 0 ? (
                  <Typography color="text.secondary">No expenses recorded</Typography>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Category</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Amount</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Date</th>
                          <th style={{ textAlign: "left", padding: 8, fontWeight: 600 }}>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id}>
                            <td style={{ padding: 8 }}>{e.category || "-"}</td>
                            <td style={{ padding: 8 }}>{e.amount} DA</td>
                            <td style={{ padding: 8 }}>{e.expense_date || "-"}</td>
                            <td style={{ padding: 8 }}>{e.supplier_name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </Box>
            )}

            {/* Documents Tab */}
            {tabValue === 4 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Documents
                </Typography>
                {documents.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary" mb={2}>
                      No documents uploaded
                    </Typography>
                    <Button variant="outlined">
                      Upload Document
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {documents.map((doc) => (
                      <Box
                        key={doc.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                          mb: 1,
                          borderRadius: borderRadius.md,
                          bgcolor: "action.hover",
                        }}
                      >
                        <Box>
                          <Typography fontWeight="medium">
                            {doc.document_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.document_type}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" sx={{ mr: 1 }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Timeline Tab */}
            {tabValue === 5 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Timeline
                </Typography>
                {timeline.length === 0 ? (
                  <Typography color="text.secondary">No timeline events</Typography>
                ) : (
                  <Box>
                    {timeline.map((event) => (
                      <Box
                        key={event.id}
                        sx={{
                          display: "flex",
                          mb: 2,
                          position: "relative",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 12,
                            top: 24,
                            bottom: -16,
                            width: 2,
                            bgcolor: "divider",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mr: 2,
                            zIndex: 1,
                          }}
                        >
                          📅
                        </Box>
                        <Box>
                          <Typography fontWeight="medium">
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.event_date}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Profitability Tab */}
            {tabValue === 6 && (
              <Box sx={{ p: 3 }}>
                <EnterpriseSection title="Profitability Analysis" sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <EnterpriseStatCard
                      title="Revenue"
                      value={`${(project?.amount / 1000).toFixed(0) || 0}k DA`}
                      color="primary"
                      icon="💰"
                    />
                    <EnterpriseStatCard
                      title="Material Cost"
                      value={`${(materialCost / 1000).toFixed(0) || 0}k DA`}
                      color="error"
                      icon="📦"
                    />
                    <EnterpriseStatCard
                      title="Labor Cost"
                      value={`${(workerCost / 1000).toFixed(0) || 0}k DA`}
                      color="warning"
                      icon="👷"
                    />
                    <EnterpriseStatCard
                      title="Expenses"
                      value={`${(expenseCost / 1000).toFixed(0) || 0}k DA`}
                      color="info"
                      icon="💸"
                    />
                    <EnterpriseStatCard
                      title="Total Cost"
                      value={`${(totalCost / 1000).toFixed(0) || 0}k DA`}
                      color="default"
                      icon="💵"
                    />
                    <EnterpriseStatCard
                      title="Net Profit"
                      value={`${(profit / 1000).toFixed(0) || 0}k DA`}
                      color="success"
                      icon="📈"
                    />
                    <EnterpriseStatCard
                      title="Profit Margin"
                      value={`${profitPercent}%`}
                      color="secondary"
                      icon="📊"
                    />
                  </Box>
                </EnterpriseSection>

                <EnterpriseSection title="Cost Breakdown">
                  <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: 12, fontWeight: 600 }}>Category</th>
                          <th style={{ textAlign: "right", padding: 12, fontWeight: 600 }}>Amount (DA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: 12 }}>Materials</td>
                          <td style={{ padding: 12, textAlign: "right" }}>{materialCost.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 12 }}>Labor</td>
                          <td style={{ padding: 12, textAlign: "right" }}>{workerCost.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 12 }}>Expenses</td>
                          <td style={{ padding: 12, textAlign: "right" }}>{expenseCost.toLocaleString()}</td>
                        </tr>
                        <tr style={{ borderTop: "2px solid #e0e0e0" }}>
                          <td style={{ padding: 12, fontWeight: 600 }}>Total Cost</td>
                          <td style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>{totalCost.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 12, fontWeight: 600, color: "success.main" }}>Profit</td>
                          <td style={{ padding: 12, textAlign: "right", fontWeight: 600, color: "success.main" }}>{profit.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                </EnterpriseSection>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Side - 30% */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: borderRadius.lg,
              boxShadow: shadows.card,
              position: { lg: "sticky" },
              top: 80,
            }}
          >
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Project Information
            </Typography>

            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Client
              </Typography>
              <Typography>{project?.client_name || "-"}</Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Address
              </Typography>
              <Typography>{project?.client_address || "-"}</Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="caption" color="text.secondary">
                Phone
              </Typography>
              <Typography>{project?.client_phone || "-"}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" fontWeight="bold" mb={2}>
              Quick Actions
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mb: 1 }}
            >
              Edit Project
            </Button>

            <Button
              fullWidth
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={createInvoice}
              sx={{ mb: 1 }}
            >
              Generate Invoice
            </Button>

            <Button
              fullWidth
              variant="contained"
              startIcon={<RequestQuoteIcon />}
              sx={{ mb: 1 }}
            >
              Generate Quote
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}