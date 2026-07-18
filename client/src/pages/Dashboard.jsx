import { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import api from "../services/api";
import StatCard from "../components/StatCard";

function Dashboard() {
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    invoices: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await api.get("/dashboard");
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        📊 Dashboard
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Clients"
            value={stats.clients}
            icon="👥"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Projects"
            value={stats.projects}
            icon="📁"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Invoices"
            value={stats.invoices}
            icon="🧾"
          />
        </Grid>

      </Grid>
    </>
  );
}

export default Dashboard;