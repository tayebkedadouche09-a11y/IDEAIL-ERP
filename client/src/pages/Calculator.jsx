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
  Divider,
  InputAdornment,
  TablePagination,
  Snackbar,
} from "@mui/material";
import { Calculate as CalculateIcon, Save as SaveIcon, Refresh as RefreshIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Description as DescriptionIcon, Engineering as EngineeringIcon, AttachMoney as MoneyIcon, Factory as FactoryIcon, Build as BuildIcon, History as HistoryIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import EnterpriseSummaryBox from "../components/EnterpriseSummaryBox";
import EnterpriseMetricCard from "../components/EnterpriseMetricCard";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { useLanguage } from "../context/LanguageContext";

const SECTORS = [
  { value: "industrial", label: "Industrial Works", icon: "🏭" },
  { value: "construction", label: "Construction", icon: "🏗️" },
  { value: "resin", label: "Resin / Epoxy", icon: "🧪" },
  { value: "services", label: "Services", icon: "🔧" },
  { value: "manufacturing", label: "Manufacturing", icon: "⚙️" },
  { value: "general", label: "General Business", icon: "📊" },
];

const emptyForm = {
  system_id: "",
  client_id: "",
  project_id: "",
  surface: "",
  thickness: "",
  labor_cost: "",
  transport: "",
  equipment: "",
  external_services: "",
  other_costs: "",
  margin: "30",
  waste_percentage: "5",
  vat_rate: "20",
  notes: "",
};

export default function Calculator() {
  const [surface, setSurface] = useState("");
  const [thickness, setThickness] = useState("");
  const [labor, setLabor] = useState("");
  const [transport, setTransport] = useState("");
  const [equipment, setEquipment] = useState("");
  const [externalServices, setExternalServices] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const [margin, setMargin] = useState("30");
  const [sector, setSector] = useState("resin");
  const [vatRate, setVatRate] = useState("20");

  const [systems, setSystems] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);

  const [systemId, setSystemId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [wastePercentage, setWastePercentage] = useState(5);

  const [result, setResult] = useState(null);
  const [technicalResult, setTechnicalResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState({
    totalCalculations: 0,
    savedEstimates: 0,
    averageCost: 0,
    averageMargin: 0,
    recentCalculations: 0,
    totalEstimatedValue: 0,
  });

  // Calculation history
  const [calculations, setCalculations] = useState([]);
  const [openHistory, setOpenHistory] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSystems();
    loadClients();
    loadProducts();
    loadCalculations();
  }, [page, limit, searchTerm]);

  useEffect(() => {
    if (clientId) {
      loadProjects(clientId);
    } else {
      setProjects([]);
      setProjectId("");
    }
  }, [clientId]);

  async function loadSystems() {
    try {
      const res = await api.get("/systems");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setSystems(res.data);
      } else {
        setSystems(res.data.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function loadClients() {
    try {
      const res = await api.get("/clients");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setClients(res.data);
      } else {
        setClients(res.data.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function loadProducts() {
    try {
      const res = await api.get("/products");
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts(res.data.data || []);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function loadProjects(id) {
    try {
      const res = await api.get("/projects");
      // Handle both old format (array) and new format (object with data)
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      const filtered = data.filter((p) => Number(p.client_id) === Number(id));
      setProjects(filtered);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadCalculations() {
    setLoading(true);
    try {
      const res = await api.get(`/calculations?page=${page}&limit=${limit}&search=${searchTerm}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setCalculations(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setCalculations(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function validateForm() {
    const newErrors = {};

    if (sector === "resin" && !systemId) {
      newErrors.system_id = "System is required for resin calculations";
    }

    if (sector === "resin" && !surface) {
      newErrors.surface = "Surface is required for resin calculations";
    }

    if (margin && isNaN(Number(margin))) {
      newErrors.margin = "Margin must be a number";
    }

    if (vatRate && isNaN(Number(vatRate))) {
      newErrors.vat_rate = "VAT rate must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function calculate() {
    if (!validateForm()) {
      return;
    }

    try {
      let materialTotal = 0;
      let materials = [];

      if (sector === "resin" && systemId && surface) {
        const res = await api.get(`/calculator/${systemId}`);
        materials = res.data.map((item) => {
          const quantity = Number(surface) * Number(item.consumption);
          const cost = quantity * Number(item.purchase_price);
          materialTotal += cost;
          return {
            name: item.name,
            quantity: quantity.toFixed(2),
            price: item.purchase_price,
            cost: cost.toFixed(2),
          };
        });
      }

      const totalCost =
        materialTotal +
        Number(labor || 0) +
        Number(transport || 0) +
        Number(equipment || 0) +
        Number(externalServices || 0) +
        Number(otherCosts || 0);

      const profit = totalCost * Number(margin || 0) / 100;
      const clientPrice = totalCost + profit;
      const vatAmount = clientPrice * Number(vatRate || 0) / 100;
      const finalPrice = clientPrice + vatAmount;

      setResult({
        materials,
        materialTotal: materialTotal.toFixed(2),
        total: totalCost.toFixed(2),
        margin,
        price: clientPrice.toFixed(2),
        profit: profit.toFixed(2),
        vat: vatAmount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
      });

      setStats((prev) => ({
        ...prev,
        totalCalculations: prev.totalCalculations + 1,
        totalEstimatedValue: prev.totalEstimatedValue + Number(clientPrice),
      }));

      showSnackbar("Calculation completed", "success");
    } catch (error) {
      console.log(error);
      showSnackbar("Calculation failed", "error");
    }
  }

  async function saveCalculation() {
    if (!result) {
      showSnackbar("Please calculate first", "error");
      return;
    }

    setSaving(true);
    try {
      const calculationData = {
        system_id: systemId || null,
        client_id: clientId || null,
        project_id: projectId || null,
        surface: Number(surface) || 0,
        thickness: Number(thickness) || 0,
        labor_cost: Number(labor) || 0,
        transport: Number(transport) || 0,
        equipment: Number(equipment) || 0,
        external_services: Number(externalServices) || 0,
        other_costs: Number(otherCosts) || 0,
        margin: Number(margin) || 30,
        waste_percentage: Number(wastePercentage) || 5,
        vat_rate: Number(vatRate) || 20,
        total_cost: Number(result.total) || 0,
        profit: Number(result.profit) || 0,
        selling_price: Number(result.price) || 0,
        final_price: Number(result.finalPrice) || 0,
        notes: "",
      };

      if (editId) {
        await api.put(`/calculations/${editId}`, calculationData);
        showSnackbar("Calculation updated successfully", "success");
      } else {
        await api.post("/calculations", calculationData);
        showSnackbar("Calculation saved successfully", "success");
      }
      setEditId(null);
      loadCalculations();
    } catch (error) {
      console.log(error);
      showSnackbar("Failed to save calculation", "error");
    } finally {
      setSaving(false);
    }
  }

  async function createDevis() {
    if (!clientId || !projectId || !result) {
      showSnackbar("Please select client, project and calculate first", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/devis", {
        client_id: clientId,
        project_id: projectId,
        title: "Quotation from Calculator",
        description: `Surface: ${surface}m², Thickness: ${thickness}mm`,
        items: result.materials.map((m) => ({
          description: m.name,
          quantity: m.quantity,
          unit_price: m.price,
        })),
      });
      showSnackbar("Devis created successfully", "success");
    } catch (error) {
      console.log(error);
      showSnackbar("Failed to create devis", "error");
    } finally {
      setSaving(false);
    }
  }

  async function calculateTechnical() {
    if (!systemId || !surface) {
      showSnackbar("Please select system and enter surface", "error");
      return;
    }

    try {
      const res = await api.get(`/calculation/system/${systemId}/${surface}?waste=${wastePercentage}`);
      setTechnicalResult(res.data);
      showSnackbar("Technical calculation completed", "success");
    } catch (error) {
      console.log(error);
      showSnackbar("Technical calculation failed", "error");
    }
  }

  function openEditDialog(calc) {
    setEditId(calc.id);
    setSystemId(calc.system_id || "");
    setClientId(calc.client_id || "");
    setProjectId(calc.project_id || "");
    setSurface(calc.surface || "");
    setThickness(calc.thickness || "");
    setLabor(calc.labor_cost || "");
    setTransport(calc.transport || "");
    setEquipment(calc.equipment || "");
    setExternalServices(calc.external_services || "");
    setOtherCosts(calc.other_costs || "");
    setMargin(calc.margin || "30");
    setWastePercentage(calc.waste_percentage || 5);
    setVatRate(calc.vat_rate || "20");
    setOpenEdit(true);
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteCalculation() {
    if (!deleteId) return;

    try {
      await api.delete(`/calculations/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar("Calculation deleted successfully", "success");
      loadCalculations();
    } catch (error) {
      console.log(error);
      showSnackbar("Failed to delete calculation", "error");
    }
  }

  return (
    <Box>
      <PageHeader
        title="Cost Calculator"
        subtitle="Estimate costs, prices and profitability"
        actionLabel="New Calculation"
        onAction={() => {
          setSurface("");
          setThickness("");
          setLabor("");
          setTransport("");
          setEquipment("");
          setExternalServices("");
          setOtherCosts("");
          setResult(null);
          setTechnicalResult(null);
          setEditId(null);
        }}
        icon="🧮"
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
          <EnterpriseMetricCard
            title="Total Calculations"
            value={stats.totalCalculations}
            color="primary"
            icon="📊"
          />
          <EnterpriseMetricCard
            title="Saved Estimates"
            value={stats.savedEstimates}
            color="success"
            icon="💾"
          />
          <EnterpriseMetricCard
            title="Average Cost"
            value={`${stats.averageCost.toLocaleString()} DA`}
            color="info"
            icon="💰"
          />
          <EnterpriseMetricCard
            title="Average Margin"
            value={`${stats.averageMargin}%`}
            color="warning"
            icon="📈"
          />
          <EnterpriseMetricCard
            title="Recent Calculations"
            value={stats.recentCalculations}
            color="default"
            icon="🕒"
          />
          <EnterpriseMetricCard
            title="Total Estimated Value"
            value={`${stats.totalEstimatedValue.toLocaleString()} DA`}
            color="primary"
            icon="💎"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title="Calculator Categories" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title="Materials" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Material quantity, unit price, waste percentage
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <TextField
                size="small"
                label="Waste %"
                type="number"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title="Labor" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Workers, hours/days, hourly rate, labor cost
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title="Expenses" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Transport, equipment, external services, other costs
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title="Pricing" sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cost total, profit margin, selling price, VAT
            </Typography>
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title="Calculation Workspace" sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            fullWidth
            label="Sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            error={!!errors.sector}
            helperText={errors.sector}
          >
            {SECTORS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.icon} {s.label}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              select
              fullWidth
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <MenuItem value="">Select client</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <MenuItem value="">Select project</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            {sector === "resin" && (
              <TextField
                select
                fullWidth
                label="System"
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
                error={!!errors.system_id}
                helperText={errors.system_id}
              >
                <MenuItem value="">Select system</MenuItem>
                {systems.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>

          {sector === "resin" && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                fullWidth
                label="Surface m²"
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                error={!!errors.surface}
                helperText={errors.surface}
              />
              <TextField
                fullWidth
                label="Thickness mm"
                type="number"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
              />
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              fullWidth
              label="Labor Cost (DA)"
              type="number"
              value={labor}
              onChange={(e) => setLabor(e.target.value)}
            />
            <TextField
              fullWidth
              label="Transport (DA)"
              type="number"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            />
            <TextField
              fullWidth
              label="Equipment (DA)"
              type="number"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              fullWidth
              label="External Services (DA)"
              type="number"
              value={externalServices}
              onChange={(e) => setExternalServices(e.target.value)}
            />
            <TextField
              fullWidth
              label="Other Costs (DA)"
              type="number"
              value={otherCosts}
              onChange={(e) => setOtherCosts(e.target.value)}
            />
            <TextField
              fullWidth
              label="Profit Margin %"
              type="number"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              error={!!errors.margin}
              helperText={errors.margin}
            />
          </Box>

          <TextField
            fullWidth
            label="VAT Rate %"
            type="number"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            error={!!errors.vat_rate}
            helperText={errors.vat_rate}
          />

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button variant="contained" size="large" onClick={calculate} startIcon={<CalculateIcon />}>
              Calculate
            </Button>
            <Button variant="outlined" disabled={!result || saving} onClick={saveCalculation} startIcon={<SaveIcon />}>
              Save Calculation
            </Button>
            <Button variant="outlined" disabled={!clientId || !projectId || !result || saving} onClick={createDevis} startIcon={<DescriptionIcon />}>
              Create Devis
            </Button>
            <Button variant="outlined" onClick={() => setOpenHistory(true)} startIcon={<HistoryIcon />}>
              History
            </Button>
          </Box>
        </Box>
      </EnterpriseSection>

      {result && (
        <EnterpriseSection title="Profitability Summary">
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <EnterpriseSummaryBox
              title="Material Cost"
              value={`${result.materialTotal} DA`}
              color="primary"
            />
            <EnterpriseSummaryBox
              title="Labor Cost"
              value={`${labor || 0} DA`}
              color="info"
            />
            <EnterpriseSummaryBox
              title="Other Expenses"
              value={`${Number(transport || 0) + Number(equipment || 0) + Number(externalServices || 0) + Number(otherCosts || 0)} DA`}
              color="warning"
            />
            <EnterpriseSummaryBox
              title="Total Cost"
              value={`${result.total} DA`}
              color="error"
            />
            <EnterpriseSummaryBox
              title="Profit Amount"
              value={`${result.profit} DA`}
              color="success"
            />
            <EnterpriseSummaryBox
              title="Profit Margin"
              value={`${result.margin}%`}
              color="success"
            />
            <EnterpriseSummaryBox
              title="Selling Price"
              value={`${result.price} DA`}
              color="primary"
            />
            <EnterpriseSummaryBox
              title="VAT Amount"
              value={`${result.vat} DA`}
              color="info"
            />
            <EnterpriseSummaryBox
              title="Final Price"
              value={`${result.finalPrice} DA`}
              color="secondary"
            />
          </Box>

          {result.materials.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Materials Breakdown
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px", fontWeight: "bold" }}>Item</th>
                      <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Quantity</th>
                      <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Unit Price</th>
                      <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.materials.map((m) => (
                      <tr key={m.name} style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <td style={{ padding: "8px" }}>{m.name}</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{m.quantity} kg</td>
                        <td style={{ padding: "8px", textAlign: "right" }}>{m.price} DA</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{m.cost} DA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}
        </EnterpriseSection>
      )}

      {/* Technical Calculation Section */}
      {sector === "resin" && (
        <EnterpriseSection title="Technical Calculation" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                fullWidth
                label="System"
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
              >
                <MenuItem value="">Select system</MenuItem>
                {systems.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Surface (m²)"
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
              />
              <TextField
                fullWidth
                label="Waste Percentage %"
                type="number"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(e.target.value)}
              />
            </Box>

            <Button variant="contained" onClick={calculateTechnical} startIcon={<CalculateIcon />}>
              Calculate Materials
            </Button>
          </Box>

          {technicalResult && (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 3 }}>
                <EnterpriseMetricCard
                  title="Material Cost"
                  value={`${Number(technicalResult.totalCost).toLocaleString()} DA`}
                  color="primary"
                  icon="💰"
                />
                <EnterpriseMetricCard
                  title="Estimated Cost"
                  value={`${Number(technicalResult.totalCost).toLocaleString()} DA`}
                  color="info"
                  icon="💵"
                />
                <EnterpriseMetricCard
                  title="Selling Price"
                  value={`${(Number(technicalResult.totalCost) * (1 + Number(margin) / 100)).toLocaleString()} DA`}
                  color="success"
                  icon="💎"
                />
                <EnterpriseMetricCard
                  title="Expected Profit"
                  value={`${(Number(technicalResult.totalCost) * Number(margin) / 100).toLocaleString()} DA`}
                  color="warning"
                  icon="📈"
                />
                <EnterpriseMetricCard
                  title="Margin %"
                  value={`${margin}%`}
                  color="secondary"
                  icon="📊"
                />
              </Box>

              {technicalResult.materials && technicalResult.materials.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Material Requirement
                  </Typography>
                  <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "8px", fontWeight: "bold" }}>Material</th>
                          <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Quantity</th>
                          <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Unit</th>
                          <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Unit Price</th>
                          <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {technicalResult.materials.map((m) => (
                          <tr key={m.product_id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                            <td style={{ padding: "8px" }}>{m.product_name}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{m.quantity}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{m.unit}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{m.unit_price} DA</td>
                            <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>{m.total_cost} DA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}
            </>
          )}
        </EnterpriseSection>
      )}

      {/* History Dialog */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Calculation History
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : calculations.length === 0 ? (
            <EnterpriseEmptyState
              message="No saved calculations"
            />
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px", fontWeight: "bold" }}>Date</th>
                    <th style={{ textAlign: "left", padding: "8px", fontWeight: "bold" }}>System</th>
                    <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Surface</th>
                    <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Total Cost</th>
                    <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Selling Price</th>
                    <th style={{ textAlign: "right", padding: "8px", fontWeight: "bold" }}>Final Price</th>
                    <th style={{ textAlign: "left", padding: "8px", fontWeight: "bold" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.map((calc) => (
                    <tr key={calc.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "8px" }}>{calc.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: "8px" }}>{calc.system_name || "-"}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{calc.surface} m²</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{calc.total_cost} DA</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{calc.selling_price} DA</td>
                      <td style={{ padding: "8px", textAlign: "right" }}>{calc.final_price} DA</td>
                      <td style={{ padding: "8px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => openEditDialog(calc)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDeleteDialog(calc.id)}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteCalculation}
        title="Delete Calculation"
        message="Are you sure you want to delete this calculation? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </Box>
  );
}