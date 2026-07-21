import { Box, Typography, Paper } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  revenue: "#1976d2",
  costs: "#dc3545",
  profit: "#28a745",
  paid: "#28a745",
  pending: "#ffc107",
};

const STATUS_COLORS = {
  "جديد": "#6c757d",
  "قيد التنفيذ": "#1976d2",
  "منتهي": "#28a745",
  "معلق": "#dc3545",
};

// ===============================
// Revenue Bar Chart
// ===============================
export function RevenueBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No revenue data available
      </Typography>
    );
  }

  const formatMonth = (m) => {
    const parts = m.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return months[parseInt(parts[1]) - 1];
  };

  const formattedData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
    revenueDA: d.revenue / 1000, // Convert to thousands for display
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="monthLabel" fontSize={12} />
        <YAxis
          fontSize={12}
          tickFormatter={(v) => `${v}k`}
        />
        <Tooltip
          formatter={(value) => [`${(value * 1000).toLocaleString()} DA`, "Revenue"]}
        />
        <Bar dataKey="revenueDA" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===============================
// Profit Trend Chart
// ===============================
export function ProfitTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No profit data available
      </Typography>
    );
  }

  const formatMonth = (m) => {
    const parts = m.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return months[parseInt(parts[1]) - 1];
  };

  const formattedData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
    revenueDA: Math.round(d.revenue / 1000),
    costsDA: Math.round(d.costs / 1000),
    profitDA: Math.round(d.profit / 1000),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="monthLabel" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `${v}k`} />
        <Tooltip
          formatter={(value) => [`${(value * 1000).toLocaleString()} DA`]}
        />
        <Line
          type="monotone"
          dataKey="revenueDA"
          stroke={COLORS.revenue}
          strokeWidth={2}
          name="Revenue"
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="costsDA"
          stroke={COLORS.costs}
          strokeWidth={2}
          name="Costs"
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="profitDA"
          stroke={COLORS.profit}
          strokeWidth={2}
          name="Profit"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ===============================
// Project Status Pie Chart
// ===============================
export function ProjectStatusPieChart({ data }) {
  if (!data) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No project data
      </Typography>
    );
  }

  const chartData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name,
      value,
    }));

  if (chartData.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No projects yet
      </Typography>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.name] || "#6c757d"}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          verticalAlign="bottom"
          height={30}
          formatter={(value) => (
            <span style={{ fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ===============================
// Section Wrapper
// ===============================
export function ChartSection({ title, children, fullWidth }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 2,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}