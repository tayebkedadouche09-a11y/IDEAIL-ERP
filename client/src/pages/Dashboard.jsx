import { useEffect, useState } from "react";
import { Grid, Typography, Box, Paper, IconButton, useMediaQuery, Skeleton } from "@mui/material";
import api from "../services/api";
import StatCard from "../components/StatCard";
import {
  RevenueBarChart,
  ProfitTrendChart,
  ProjectStatusPieChart,
} from "../components/DashboardCharts";
import ChartCard from "../components/ChartCard";
import { spacing, borderRadius, shadows, transitions } from "../theme/designTokens";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import DescriptionIcon from "@mui/icons-material/Description";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useTheme } from "@mui/material/styles";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import ErrorIcon from "@mui/icons-material/Error";
import BusinessIcon from "@mui/icons-material/Business";
import FolderIcon from "@mui/icons-material/Folder";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(new Date());

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  useEffect(() => {
    loadDashboard();
  }, []);

async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, revenueRes, profitRes, statsRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/revenue"),
        api.get("/dashboard/profit-trend"),
        api.get("/dashboard/stats"),
      ]);
      setSummary({
        ...summaryRes.data,
        ...statsRes.data,
      });
      const revenueData = Array.isArray(revenueRes.data)
        ? revenueRes.data
        : Array.isArray(revenueRes.data?.data)
          ? revenueRes.data.data
          : [];
      const profitData = Array.isArray(profitRes.data)
        ? profitRes.data
        : Array.isArray(profitRes.data?.data)
          ? profitRes.data.data
          : [];
      setRevenueData(revenueData);
      setProfitData(profitData);
      setLastSync(new Date());
    } catch (err) {
      setError("Failed to load dashboard data");
      setSummary(null);
      setRevenueData([]);
      setProfitData([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Box sx={{ width: 150, height: 32, bgcolor: "action.hover", borderRadius: 1 }} />
          </Box>
          <Box sx={{ width: 200, height: 16, bgcolor: "action.hover", borderRadius: 1 }} />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Box key={i} sx={{ flex: 1, minWidth: 150, height: 100, bgcolor: "action.hover", borderRadius: 1 }} />
          ))}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 300, height: 320, bgcolor: "action.hover", borderRadius: 1 }} />
          <Box sx={{ flex: 1, minWidth: 300, height: 320, bgcolor: "action.hover", borderRadius: 1 }} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  const counts = summary?.counts || {};
  const revenue = summary?.revenue || {};
  const profit = summary?.profit || {};
  const projectStatus = summary?.projectStatus || {};
  const stockAlerts = summary?.stockAlerts || [];
  const recentInvoices = summary?.recentInvoices || [];
  const topProjects = summary?.topProjects || [];
  const topClients = summary?.topClients || [];
  const topSuppliers = summary?.topSuppliers || [];
  const expenseCategories = summary?.expenseCategories || [];
  const overdueInvoices = summary?.overdueInvoices || [];
  const delayedProjects = summary?.delayedProjects || [];
  const upcomingPayments = summary?.upcomingPayments || [];
  const recentActivity = summary?.recentActivity || [];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const quickActions = [
    {
      title: "Create Project",
      icon: <AddIcon />,
      color: "primary",
      path: "/projects",
    },
    {
      title: "Create Invoice",
      icon: <ReceiptLongIcon />,
      color: "secondary",
      path: "/invoices",
    },
    {
      title: "Create Quote",
      icon: <RequestQuoteIcon />,
      color: "info",
      path: "/devis",
    },
    {
      title: "Add Client",
      icon: <PersonAddIcon />,
      color: "success",
      path: "/clients",
    },
    {
      title: "Add Expense",
      icon: <DescriptionIcon />,
      color: "warning",
      path: "/expenses",
    },
    {
      title: "Open Reports",
      icon: <BarChartIcon />,
      color: "error",
      path: "/reports",
    },
  ];

  return (
    <Box>
      {/* Hero Header */}
      <Box
        sx={{
          mb: 3,
          pb: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              Welcome to IDEAIL ERP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentDate}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Last sync: {lastSync.toLocaleTimeString()}
            </Typography>
            <IconButton onClick={loadDashboard} aria-label="Refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={6} sm={4} md={2} key={action.title}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.card,
                  textAlign: "center",
                  transition: transitions.fast,
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: shadows.elevated,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: borderRadius.full,
                    bgcolor: `${action.color}.light`,
                    color: `${action.color}.main`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1,
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {action.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

{/* Advanced KPI Cards */}
      <EnterpriseSection title="Key Performance Indicators" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title="Clients"
            value={summary?.totalClients || 0}
            color="primary"
            icon={<BusinessIcon />}
            subtitle="Total clients"
          />
          <EnterpriseStatCard
            title="Projects"
            value={summary?.totalProjects || 0}
            color="info"
            icon={<FolderIcon />}
            subtitle={`${summary?.activeProjects || 0} active`}
          />
          <EnterpriseStatCard
            title="Revenue"
            value={`${(revenue.total / 1000).toFixed(0)}k DA`}
            color="primary"
            icon="💰"
            subtitle={`${(revenue.paid / 1000).toFixed(0)}k paid`}
          />
          <EnterpriseStatCard
            title="Expenses"
            value={`${(revenue.expenses / 1000 || 0).toFixed(0)}k DA`}
            color="error"
            icon="💸"
            subtitle={`${summary?.totalExpenses || 0} records`}
          />
          <EnterpriseStatCard
            title="Profit"
            value={`${(summary?.estimatedProfit / 1000 || 0).toFixed(0)}k DA`}
            color="success"
            icon="📈"
            subtitle={`Margin: ${profit.avgMargin || 0}%`}
          />
          <EnterpriseStatCard
            title="Stock Value"
            value={`${(summary?.stockValue / 1000 || 0).toFixed(0)}k DA`}
            color="warning"
            icon={<ShoppingCartIcon />}
            subtitle={`${summary?.lowStockAlerts || 0} alerts`}
          />
          <EnterpriseStatCard
            title="Pending Payments"
            value={overdueInvoices.length}
            color="warning"
            icon="⏳"
            subtitle="Overdue invoices"
          />
          <EnterpriseStatCard
            title="Stock Alerts"
            value={stockAlerts.length}
            color="error"
            icon="⚠️"
            subtitle="Low stock items"
          />
        </Box>
      </EnterpriseSection>

      {/* Charts Section */}
      <EnterpriseSection title="Analytics" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <ChartCard title="Monthly Revenue vs Expenses" loading={loading}>
              <RevenueBarChart data={revenueData} />
            </ChartCard>
          </Box>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <ChartCard title="Profit Trend" loading={loading}>
              <ProfitTrendChart data={profitData} />
            </ChartCard>
          </Box>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <ChartCard title="Project Status Distribution" loading={loading}>
              <ProjectStatusPieChart data={projectStatus} />
            </ChartCard>
          </Box>
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <ChartCard title="Cash Flow" loading={loading}>
              <Typography color="text.secondary">Cash flow data will be displayed here</Typography>
            </ChartCard>
          </Box>
        </Box>
      </EnterpriseSection>

      {/* Intelligence Panels */}
      <EnterpriseSection title="Intelligence Center" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title="Top Profitable Projects" sx={{ flex: 1, minWidth: 250 }}>
            {topProjects.length === 0 ? (
              <Typography color="text.secondary">No data</Typography>
            ) : (
              topProjects.slice(0, 5).map((p) => (
                <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                  <Typography variant="body2">{p.name}</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {p.profit?.toLocaleString()} DA
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
          <EnterprisePanel title="Top Clients" sx={{ flex: 1, minWidth: 250 }}>
            {topClients.length === 0 ? (
              <Typography color="text.secondary">No data</Typography>
            ) : (
              topClients.slice(0, 5).map((c) => (
                <Box key={c.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                  <Typography variant="body2">{c.name}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {c.total?.toLocaleString()} DA
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
          <EnterprisePanel title="Top Suppliers" sx={{ flex: 1, minWidth: 250 }}>
            {topSuppliers.length === 0 ? (
              <Typography color="text.secondary">No data</Typography>
            ) : (
              topSuppliers.slice(0, 5).map((s) => (
                <Box key={s.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                  <Typography variant="body2">{s.name}</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {s.total?.toLocaleString()} DA
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
          <EnterprisePanel title="Expense Categories" sx={{ flex: 1, minWidth: 250 }}>
            {expenseCategories.length === 0 ? (
              <Typography color="text.secondary">No data</Typography>
            ) : (
              expenseCategories.slice(0, 5).map((e) => (
                <Box key={e.category} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                  <Typography variant="body2">{e.category}</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error">
                    {e.total?.toLocaleString()} DA
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      {/* Alerts Center */}
      <EnterpriseSection title="Alerts Center" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title="Low Stock" sx={{ flex: 1, minWidth: 200 }}>
            {stockAlerts.length === 0 ? (
              <Typography color="text.secondary">All stock levels OK</Typography>
            ) : (
              stockAlerts.slice(0, 3).map((a) => (
                <Box key={a.id} sx={{ py: 0.5 }}>
                  <Typography variant="body2" color="error">
                    {a.name}: {a.quantity} / {a.minimum}
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
          <EnterprisePanel title="Overdue Invoices" sx={{ flex: 1, minWidth: 200 }}>
            {overdueInvoices.length === 0 ? (
              <Typography color="text.secondary">No overdue invoices</Typography>
            ) : (
              overdueInvoices.slice(0, 3).map((i) => (
                <Box key={i.id} sx={{ py: 0.5 }}>
                  <Typography variant="body2" color="warning.main">
                    {i.invoice_number}: {i.amount?.toLocaleString()} DA
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
          <EnterprisePanel title="Delayed Projects" sx={{ flex: 1, minWidth: 200 }}>
            {delayedProjects.length === 0 ? (
              <Typography color="text.secondary">No delays</Typography>
            ) : (
              delayedProjects.slice(0, 3).map((p) => (
                <Box key={p.id} sx={{ py: 0.5 }}>
                  <Typography variant="body2" color="error">
                    {p.name}: {p.days_delayed} days
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
          <EnterprisePanel title="Upcoming Payments" sx={{ flex: 1, minWidth: 200 }}>
            {upcomingPayments.length === 0 ? (
              <Typography color="text.secondary">No upcoming payments</Typography>
            ) : (
              upcomingPayments.slice(0, 3).map((p) => (
                <Box key={p.id} sx={{ py: 0.5 }}>
                  <Typography variant="body2" color="info.main">
                    {p.supplier}: {p.amount?.toLocaleString()} DA
                  </Typography>
                </Box>
              ))
            )}
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      {/* Recent Activity */}
      <EnterpriseSection title="Recent Activity">
        {recentActivity.length === 0 ? (
          <Typography color="text.secondary">No recent activity</Typography>
        ) : (
          <Box>
            {recentActivity.slice(0, 10).map((a) => (
              <Box
                key={a.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "primary.light",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <Typography variant="caption">{a.icon}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {a.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.created_at?.slice(0, 10)} - {a.user}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </EnterpriseSection>
    </Box>
  );
}

export default Dashboard;
