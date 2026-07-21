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
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Download as DownloadIcon, Assessment as AssessmentIcon, BarChart as BarChartIcon, PieChart as PieChartIcon, PictureAsPdf as PdfIcon } from "@mui/icons-material";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import ChartCard from "../components/ChartCard";

const REPORT_TYPES = [
  { key: "profit-loss", label: "Profit & Loss", category: "Financial" },
  { key: "cash-flow", label: "Cash Flow", category: "Financial" },
  { key: "expense-summary", label: "Expense Summary", category: "Financial" },
  { key: "vat-report", label: "VAT Report", category: "Financial" },
  { key: "monthly-revenue", label: "Monthly Revenue", category: "Financial" },
  { key: "project-profitability", label: "Project Profitability", category: "Projects" },
  { key: "top-clients", label: "Top Clients", category: "Clients" },
  { key: "top-projects", label: "Top Projects", category: "Projects" },
  { key: "employee-summary", label: "Employee Summary", category: "Employees" },
  { key: "vehicle-cost", label: "Vehicle Cost", category: "Vehicles" },
  { key: "material-consumption", label: "Material Consumption", category: "Inventory" },
  { key: "stock-valuation", label: "Stock Valuation", category: "Inventory" },
  { key: "invoice-aging", label: "Invoice Aging", category: "Financial" },
];

const REPORT_CATEGORIES = [
  { key: "all", label: "All Reports" },
  { key: "Financial", label: "Financial" },
  { key: "Projects", label: "Projects" },
  { key: "Clients", label: "Clients" },
  { key: "Employees", label: "Employees" },
  { key: "Vehicles", label: "Vehicles" },
  { key: "Inventory", label: "Inventory" },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function Reports() {
  const [reportType, setReportType] = useState("profit-loss");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    activeProjects: 0,
    outstandingPayments: 0,
    vatAmount: 0,
  });

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [summaryRes, projectsRes, invoicesRes] = await Promise.all([
        api.get("/financial/dashboard-summary"),
        api.get("/projects"),
        api.get("/invoices"),
      ]);
      
      // Ensure arrays are safe with Array.isArray check
      const invoicesData = Array.isArray(invoicesRes.data) 
        ? invoicesRes.data 
        : (invoicesRes.data?.data || []);
      
      const projectsData = Array.isArray(projectsRes.data) 
        ? projectsRes.data 
        : (projectsRes.data?.data || []);
      
      setStats({
        totalRevenue: summaryRes.data?.totalRevenue || 0,
        totalExpenses: summaryRes.data?.totalExpenses || 0,
        netProfit: summaryRes.data?.netProfit || 0,
        activeProjects: projectsData.length || 0,
        outstandingPayments: Array.isArray(invoicesData) 
          ? invoicesData.filter(i => i.status !== "مدفوعة" && i.status !== "paid").reduce((sum, i) => sum + (i.amount || 0), 0) || 0
          : 0,
        vatAmount: (summaryRes.data?.totalExpenses || 0) * 0.19 || 0,
      });
    } catch (err) {
      console.log(err);
      setStats({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        activeProjects: 0,
        outstandingPayments: 0,
        vatAmount: 0,
      });
    }
  }

  async function loadReport() {
    setLoading(true);
    setData(null);
    try {
      let res;
      switch (reportType) {
        case "profit-loss":
          res = await api.get("/reports/profit-loss", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "cash-flow":
          res = await api.get("/reports/cash-flow", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "expense-summary":
          res = await api.get("/reports/expense-summary", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "vat-report":
          res = await api.get("/reports/vat-report", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "monthly-revenue":
          res = await api.get("/reports/monthly-revenue");
          break;
        case "project-profitability":
          res = await api.get("/reports/project-profitability");
          break;
        case "top-clients":
          res = await api.get("/reports/top-clients", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "top-projects":
          res = await api.get("/reports/top-projects");
          break;
        case "employee-summary":
          res = await api.get("/reports/employee-summary", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "vehicle-cost":
          res = await api.get("/reports/vehicle-cost", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "material-consumption":
          res = await api.get("/reports/material-consumption", {
            params: { start_date: startDate, end_date: endDate },
          });
          break;
        case "stock-valuation":
          res = await api.get("/reports/stock-valuation");
          break;
        case "invoice-aging":
          res = await api.get("/reports/invoice-aging");
          break;
        default:
          return;
      }
      setData(res.data);
      setMessage({ type: "success", text: "Report loaded" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to load report" });
      setData(null);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }

  async function exportCSV() {
    if (!data) return;
    try {
      const params =
        startDate && endDate
          ? { start_date: startDate, end_date: endDate }
          : {};
      const res = await api.get(`/reports/export/${reportType}`, {
        params,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportType}-${startDate || "all"}-${endDate || "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to export CSV" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }

  async function exportPDF() {
    if (!data) return;
    try {
      const params =
        startDate && endDate
          ? { start_date: startDate, end_date: endDate }
          : {};
      const res = await api.get(`/reports/pdf/${reportType}`, {
        params,
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: res.headers?.["content-type"] || "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportType}-${startDate || "all"}-${endDate || "all"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to export PDF" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Business intelligence and financial analysis"
        actionLabel="Generate Report"
        onAction={loadReport}
        icon="📊"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseSection title="Statistics" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title="Total Revenue"
            value={`${stats.totalRevenue.toLocaleString()} DA`}
            color="primary"
            icon="💰"
          />
          <EnterpriseStatCard
            title="Total Expenses"
            value={`${stats.totalExpenses.toLocaleString()} DA`}
            color="error"
            icon="💸"
          />
          <EnterpriseStatCard
            title="Net Profit"
            value={`${stats.netProfit.toLocaleString()} DA`}
            color="success"
            icon="📈"
          />
          <EnterpriseStatCard
            title="Active Projects"
            value={stats.activeProjects}
            color="info"
            icon="📋"
          />
          <EnterpriseStatCard
            title="Outstanding Payments"
            value={`${stats.outstandingPayments.toLocaleString()} DA`}
            color="warning"
            icon="⏳"
          />
          <EnterpriseStatCard
            title="VAT Amount"
            value={`${stats.vatAmount.toLocaleString()} DA`}
            color="default"
            icon="📊"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title="Report Categories" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title="Financial" sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label="Profit & Loss" size="small" variant="outlined" onClick={() => setReportType("profit-loss")} />
              <Chip label="Cash Flow" size="small" variant="outlined" onClick={() => setReportType("cash-flow")} />
              <Chip label="Expense Summary" size="small" variant="outlined" onClick={() => setReportType("expense-summary")} />
              <Chip label="VAT Report" size="small" variant="outlined" onClick={() => setReportType("vat-report")} />
              <Chip label="Monthly Revenue" size="small" variant="outlined" onClick={() => setReportType("monthly-revenue")} />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title="Projects" sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label="Project Profitability" size="small" variant="outlined" onClick={() => setReportType("project-profitability")} />
              <Chip label="Top Projects" size="small" variant="outlined" onClick={() => setReportType("top-projects")} />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title="Clients" sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label="Top Clients" size="small" variant="outlined" onClick={() => setReportType("top-clients")} />
              <Chip label="Invoice Aging" size="small" variant="outlined" onClick={() => setReportType("invoice-aging")} />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title="Employees" sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label="Employee Summary" size="small" variant="outlined" onClick={() => setReportType("employee-summary")} />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title="Vehicles" sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label="Vehicle Cost" size="small" variant="outlined" onClick={() => setReportType("vehicle-cost")} />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title="Inventory" sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label="Stock Valuation" size="small" variant="outlined" onClick={() => setReportType("stock-valuation")} />
              <Chip label="Material Consumption" size="small" variant="outlined" onClick={() => setReportType("material-consumption")} />
            </Box>
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 3 }}>
        <TextField
          select
          size="small"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {REPORT_TYPES.map((r) => (
            <MenuItem key={r.key} value={r.key}>{r.label}</MenuItem>
          ))}
        </TextField>

        {(reportType === "profit-loss" || reportType === "vat-report" || reportType === "cash-flow" || reportType === "expense-summary") && (
          <>
            <TextField
              type="date"
              size="small"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </>
        )}

        <Button variant="contained" onClick={loadReport} disabled={loading}>
          {loading ? "Loading..." : "Load Report"}
        </Button>

        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV} disabled={!data}>
          Export CSV
        </Button>

        <Button variant="outlined" startIcon={<PdfIcon />} onClick={exportPDF} disabled={!data}>
          Export PDF
        </Button>
      </Box>

      <EnterpriseSection title="Report Results">
        {!data ? (
          <EnterpriseEmptyState
            message="No reports generated yet"
            actionLabel="Generate First Report"
            onAction={loadReport}
          />
        ) : (
          <Box>
            {reportType === "profit-loss" && (
              <Box>
                <Box sx={{ display: "flex", gap: 4, mb: 3, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {data.revenue?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Costs</Typography>
                    <Typography variant="h5" fontWeight="bold" color="error">
                      {data.costs?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Expenses</Typography>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {data.expenses?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Profit</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {data.profit?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Margin</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {data.margin}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Period: {data.start_date} to {data.end_date}
                </Typography>
              </Box>
            )}

            {reportType === "cash-flow" && (
              <Box>
                <Box sx={{ display: "flex", gap: 4, mb: 3, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Income</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {data.totalIncome?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Expense</Typography>
                    <Typography variant="h5" fontWeight="bold" color="error">
                      {data.totalExpense?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Net Flow</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {data.netFlow?.toLocaleString()} DA
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {reportType === "expense-summary" && (
              <Box>
                <Box sx={{ display: "flex", gap: 4, mb: 3, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                    <Typography variant="h5" fontWeight="bold" color="error">
                      {data.total?.toLocaleString()} DA
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Category</th>
                        <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Amount</th>
                        <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(data.items) && data.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #e0e0e0" }}>
                          <td style={{ padding: "12px" }}>{item.category_name || "-"}</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{item.total_amount?.toLocaleString()} DA</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}

            {reportType === "project-profitability" && (
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Project</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Client</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Status</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Amount</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Cost</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Profit</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data) && data.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "12px" }}>
                          <Typography color="text.secondary">No projects found</Typography>
                        </td>
                      </tr>
                    ) : (
                      Array.isArray(data) ? data.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                          <td style={{ padding: "12px" }}>{p.name}</td>
                          <td style={{ padding: "12px" }}>{p.client_name}</td>
                          <td style={{ padding: "12px" }}>
                            <StatusChip status={p.status} />
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.amount?.toLocaleString()} DA</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.total_cost?.toLocaleString()} DA</td>
                          <td style={{ padding: "12px", textAlign: "right", color: p.profit >= 0 ? "success.main" : "error.main", fontWeight: "bold" }}>
                            {p.profit?.toLocaleString()} DA
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.profit_margin}%</td>
                        </tr>
                      )) : null
                    )}
                  </tbody>
                </table>
              </Box>
            )}

            {reportType === "monthly-revenue" && (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.isArray(data) ? data : []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {reportType === "top-clients" && (
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Client</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Phone</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Invoiced</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Paid</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data?.items) && data.items.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ padding: "12px" }}>{c.name}</td>
                        <td style={{ padding: "12px" }}>{c.phone || "-"}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{c.total_invoiced?.toLocaleString()} DA</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{c.total_paid?.toLocaleString()} DA</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{c.total_pending?.toLocaleString()} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}

            {reportType === "employee-summary" && (
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Employee</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Job Title</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Days</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Cost</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data?.items) && data.items.map((e) => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ padding: "12px" }}>{e.name}</td>
                        <td style={{ padding: "12px" }}>{e.job_title || "-"}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{e.total_days}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{e.total_cost?.toLocaleString()} DA</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{e.total_paid?.toLocaleString()} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}

            {reportType === "vehicle-cost" && (
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Registration</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Brand</th>
                      <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Model</th>
                      <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Total Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(data?.items) && data.items.map((v) => (
                      <tr key={v.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ padding: "12px" }}>{v.registration_number}</td>
                        <td style={{ padding: "12px" }}>{v.brand || "-"}</td>
                        <td style={{ padding: "12px" }}>{v.model || "-"}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{v.total_expenses?.toLocaleString()} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}

            {reportType === "stock-valuation" && (
              <Box>
                <Box sx={{ display: "flex", gap: 4, mb: 3, flexWrap: "wrap" }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Cost Value</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {data.totalCost?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Retail Value</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {data.totalRetail?.toLocaleString()} DA
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Potential Profit</Typography>
                    <Typography variant="h5" fontWeight="bold" color="secondary">
                      {data.potentialProfit?.toLocaleString()} DA
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Product</th>
                        <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>Category</th>
                        <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Qty</th>
                        <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Purchase Price</th>
                        <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Cost Value</th>
                        <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>Retail Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(data?.items) && data.items.map((p) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                          <td style={{ padding: "12px" }}>{p.name}</td>
                          <td style={{ padding: "12px" }}>{p.category || "-"}</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.quantity}</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.purchase_price?.toLocaleString()} DA</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.cost_value?.toLocaleString()} DA</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>{p.retail_value?.toLocaleString()} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </EnterpriseSection>
    </Box>
  );
}
