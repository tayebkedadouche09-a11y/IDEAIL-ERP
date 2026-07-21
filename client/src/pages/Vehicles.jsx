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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, DirectionsCar as CarIcon, Build as BuildIcon, LocalGasStation as FuelIcon, Description as DescriptionIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import EnterpriseSummaryBox from "../components/EnterpriseSummaryBox";

import { useLanguage } from "../context/LanguageContext";

const VEHICLE_TYPES = [
  { value: "truck", key: "truck" },
  { value: "van", key: "van" },
  { value: "car", key: "car" },
  { value: "motorcycle", key: "motorcycle" },
  { value: "bus", key: "bus" },
  { value: "machinery", key: "machinery" },
];

const VEHICLE_STATUSES = [
  { value: "available", key: "available" },
  { value: "in_use", key: "inUse" },
  { value: "maintenance", key: "maintenance" },
  { value: "out_of_service", key: "outOfService" },
];

const emptyForm = {
  registration_number: "",
  internal_code: "",
  brand: "",
  model: "",
  year: "",
  type: "truck",
  fuel_type: "",
  vin: "",
  color: "",
  purchase_date: "",
  purchase_price: "",
  insurance: "",
  technical_inspection: "",
  current_mileage: "",
  status: "available",
  notes: "",
  photo: "",
  driver_id: "",
  department: "",
  project_id: "",
  insurance_cost: "",
  fuel_budget: "",
  last_service_date: "",
  next_service_date: "",
};

export default function Vehicles() {
  const { t } = useLanguage();
  
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    available: 0,
    monthlyFuel: 0,
    maintenance: 0,
    insurance: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vehiclesRes, driversRes, projectsRes] = await Promise.all([
        api.get("/vehicles"),
        api.get("/employees"),
        api.get("/projects"),
      ]);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
      setProjects(projectsRes.data || []);
      calculateStats(vehiclesRes.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  function calculateStats(data) {
    const newStats = {
      total: data.length,
      active: data.filter(v => v.status === "in_use").length,
      available: data.filter(v => v.status === "available").length,
      monthlyFuel: data.reduce((sum, v) => sum + (v.fuel_budget || 0), 0),
      maintenance: data.reduce((sum, v) => sum + (v.maintenance_cost || 0), 0),
      insurance: data.reduce((sum, v) => sum + (v.insurance_cost || 0), 0),
    };
    setStats(newStats);
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function editVehicle(vehicle) {
    setEditId(vehicle.id);
    setForm({
      registration_number: vehicle.registration_number || "",
      internal_code: vehicle.internal_code || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      type: vehicle.type || "truck",
      fuel_type: vehicle.fuel_type || "",
      vin: vehicle.vin || "",
      color: vehicle.color || "",
      purchase_date: vehicle.purchase_date || "",
      purchase_price: vehicle.purchase_price || "",
      insurance: vehicle.insurance || "",
      technical_inspection: vehicle.technical_inspection || "",
      current_mileage: vehicle.current_mileage || "",
      status: vehicle.status || "available",
      notes: vehicle.notes || "",
      photo: vehicle.photo || "",
      driver_id: vehicle.driver_id || "",
      department: vehicle.department || "",
      project_id: vehicle.project_id || "",
      insurance_cost: vehicle.insurance_cost || "",
      fuel_budget: vehicle.fuel_budget || "",
      last_service_date: vehicle.last_service_date || "",
      next_service_date: vehicle.next_service_date || "",
    });
    setOpen(true);
  }

  async function save() {
    try {
      if (editId) {
        await api.put(`/vehicles/${editId}`, form);
        setMessage({ type: "success", text: t("vehicleUpdated") });
      } else {
        await api.post("/vehicles", form);
        setMessage({ type: "success", text: t("vehicleAdded") });
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("saveFailed") });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  async function remove(id) {
    if (!window.confirm(t("deleteVehicleConfirm"))) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setMessage({ type: "success", text: t("vehicleDeleted") });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("deleteFailed") });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  const filteredVehicles = vehicles
    .filter((v) => typeFilter === "all" || v.type === typeFilter)
    .filter((v) => statusFilter === "all" || v.status === statusFilter)
    .filter((v) =>
      searchTerm === "" ||
      v.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title={t("vehicles")}
        subtitle={t("manageVehicles")}
        actionLabel={t("addVehicle")}
        onAction={addNew}
        icon="🚗"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseSection title={t("statistics")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseSummaryBox
            title={t("totalVehicles")}
            value={stats.total}
            color="primary"
          />
          <EnterpriseSummaryBox
            title={t("activeVehicles")}
            value={stats.active}
            color="info"
          />
          <EnterpriseSummaryBox
            title={t("availableVehicles")}
            value={stats.available}
            color="success"
          />
          <EnterpriseSummaryBox
            title={t("monthlyFuelCost")}
            value={`${stats.monthlyFuel.toLocaleString()} DA`}
            color="warning"
          />
          <EnterpriseSummaryBox
            title={t("maintenanceCost")}
            value={`${stats.maintenance.toLocaleString()} DA`}
            color="default"
          />
          <EnterpriseSummaryBox
            title={t("insuranceExpenses")}
            value={`${stats.insurance.toLocaleString()} DA`}
            color="error"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title={t("fleetOverview")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title={t("available")} sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="h4" color="success.main" fontWeight="bold">
              {stats.available}
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title={t("inUse")} sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {stats.active}
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title={t("maintenance")} sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {vehicles.filter(v => v.status === "maintenance").length}
            </Typography>
          </EnterprisePanel>
          <EnterprisePanel title={t("outOfService")} sx={{ flex: 1, minWidth: 150 }}>
            <Typography variant="h4" color="error.main" fontWeight="bold">
              {vehicles.filter(v => v.status === "out_of_service").length}
            </Typography>
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchVehicles")}
      filters={[
          { value: "all", label: t("allTypes") },
          ...VEHICLE_TYPES.map((vt) => ({ value: vt.value, label: t(vt.key) || vt.key })),
        ]}
        filterValue={typeFilter}
        onFilterChange={setTypeFilter}
        onRefresh={loadData}
      />

      <EnterpriseSection title={t("vehiclesList")}>
        {filteredVehicles.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noVehiclesFound")}
            actionLabel={t("addFirstVehicle")}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("id")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("registration")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("brand")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("model")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("type")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("year")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("driver")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        <CarIcon fontSize="small" />
                      </Avatar>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {v.registration_number}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>{v.brand}</td>
                    <td style={{ padding: "12px" }}>{v.model}</td>
                    <td style={{ padding: "12px" }}>{t(v.type) || v.type}</td>
                    <td style={{ padding: "12px" }}>{v.year}</td>
                    <td style={{ padding: "12px" }}>{v.driver_name || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <StatusChip status={v.status} />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title={t("view")}>
                          <IconButton size="small" color="primary" onClick={() => editVehicle(v)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("delete")}>
                          <IconButton size="small" color="error" onClick={() => remove(v.id)}>
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
          {editId ? t("editVehicle") : t("addVehicle")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("generalInformation")}
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            label={t("registrationNumber")}
            name="registration_number"
            value={form.registration_number}
            onChange={change}
            required
          />
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("brand")}
              name="brand"
              value={form.brand}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("model")}
              name="model"
              value={form.model}
              onChange={change}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            select
            fullWidth
            label={t("type")}
            name="type"
            value={form.type}
            onChange={change}
          >
            {VEHICLE_TYPES.map((vt) => (
              <MenuItem key={vt.value} value={vt.value}>{t(vt.key) || vt.key}</MenuItem>
            ))}
          </TextField>
            <TextField
              fullWidth
              label={t("year")}
              name="year"
              type="number"
              value={form.year}
              onChange={change}
            />
          </Box>
          <TextField
            fullWidth
            margin="normal"
            label={t("color")}
            name="color"
            value={form.color}
            onChange={change}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("operationalInformation")}
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("assignedDriver")}
            name="driver_id"
            value={form.driver_id}
            onChange={change}
          >
            <MenuItem value="">{t("none")}</MenuItem>
            {drivers.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label={t("department")}
            name="department"
            value={form.department}
            onChange={change}
          />
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("currentProject")}
            name="project_id"
            value={form.project_id}
            onChange={change}
          >
            <MenuItem value="">{t("none")}</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("financialInformation")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("purchasePriceDA")}
              name="purchase_price"
              type="number"
              value={form.purchase_price}
              onChange={change}
            />
            <TextField
              fullWidth
              label={t("insuranceCostDA")}
              name="insurance_cost"
              type="number"
              value={form.insurance_cost}
              onChange={change}
            />
          </Box>
          <TextField
            fullWidth
            margin="normal"
            label={t("fuelBudgetDA")}
            name="fuel_budget"
            type="number"
            value={form.fuel_budget}
            onChange={change}
          />

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("maintenance")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label={t("lastServiceDate")}
              name="last_service_date"
              type="date"
              value={form.last_service_date}
              onChange={change}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t("nextServiceDate")}
              name="next_service_date"
              type="date"
              value={form.next_service_date}
              onChange={change}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
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