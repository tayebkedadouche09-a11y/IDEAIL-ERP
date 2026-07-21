import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  useMediaQuery,
} from "@mui/material";
import { PlayArrow as PlayIcon, Schedule as ScheduleIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseStatCard from "../components/EnterpriseStatCard";

export default function Automation() {
  const [status, setStatus] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadStatus();
    loadLogs();
  }, []);

  async function loadStatus() {
    try {
      const res = await api.get("/automation/status");
      setStatus(res.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadLogs() {
    try {
      const res = await api.get("/automation/logs");
      setLogs(res.data);
    } catch (error) {
      console.log(error);
    }
  }

  async function runJob(job) {
    setLoading(true);
    try {
      await api.post(`/automation/run/${job}`);
      loadStatus();
      loadLogs();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Automation Center"
        subtitle="مركز الأتمتة - جدولة المهام التلقائية"
        icon="⚙️"
      />

      <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 2 }}>
        {/* Scheduler Status */}
        <Box sx={{ flex: 1 }}>
          <EnterpriseSection title="Scheduler Status">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <EnterpriseStatCard
                title="Daily Jobs"
                value={status.daily?.status || "Not run"}
                color={status.daily?.status === "completed" ? "success" : "warning"}
                icon="📅"
              />
              <EnterpriseStatCard
                title="Weekly Jobs"
                value={status.weekly?.status || "Not run"}
                color={status.weekly?.status === "completed" ? "success" : "warning"}
                icon="📆"
              />
              <EnterpriseStatCard
                title="Monthly Jobs"
                value={status.monthly?.status || "Not run"}
                color={status.monthly?.status === "completed" ? "success" : "warning"}
                icon="📊"
              />
              <EnterpriseStatCard
                title="Last Backup"
                value={status.backup?.status || "Not run"}
                color={status.backup?.status === "completed" ? "success" : "warning"}
                icon="💾"
              />
            </Box>
          </EnterpriseSection>

          {/* Manual Run Buttons */}
          <EnterpriseSection title="Manual Run">
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => runJob("daily")}
                disabled={loading}
              >
                Run Daily
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => runJob("weekly")}
                disabled={loading}
              >
                Run Weekly
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => runJob("monthly")}
                disabled={loading}
              >
                Run Monthly
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => runJob("backup")}
                disabled={loading}
              >
                Run Backup
              </Button>
            </Box>
          </EnterpriseSection>
        </Box>

        {/* Automation Logs */}
        <Box sx={{ flex: 1 }}>
          <EnterpriseSection title="Automation Logs">
            <Paper sx={{ maxHeight: 400, overflow: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Job</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.job_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={
                            log.status === "completed"
                              ? "success"
                              : log.status === "error"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </EnterpriseSection>
        </Box>
      </Box>
    </Box>
  );
}