import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
import { Add, Delete, Edit, Refresh } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";

const CONFIG = {
  companies: { title: "Companies", fields: ["name", "code", "tax_number", "currency", "address", "phone", "email", "status"] },
  accounts: { title: "Chart of Accounts", fields: ["code", "name", "account_type", "opening_balance", "active"] },
  periods: { title: "Financial Periods", fields: ["name", "start_date", "end_date", "status"] },
  journalEntries: { title: "Journal Entries", fields: ["entry_number", "entry_date", "reference", "description", "status"] },
  purchaseRequests: { title: "Purchase Requests", fields: ["request_number", "department", "request_date", "required_date", "status", "notes"] },
  assets: { title: "Assets", fields: ["asset_code", "name", "category", "purchase_date", "purchase_value", "location", "status"] },
  qualityInspections: { title: "Quality Inspections", fields: ["inspection_number", "subject_type", "subject_id", "inspection_date", "status", "result", "defects", "corrective_action"] },
  billsOfMaterials: { title: "Bills of Materials", fields: ["product_id", "version", "quantity", "status", "notes"] },
  productionOrders: { title: "Production Orders", fields: ["order_number", "product_id", "bom_id", "planned_quantity", "completed_quantity", "start_date", "due_date", "status"] },
  leads: { title: "Sales Leads", fields: ["name", "company_name", "email", "phone", "source", "stage", "estimated_value", "notes"] },
  tasks: { title: "Tasks", fields: ["title", "description", "project_id", "assignee_id", "priority", "due_date", "status"] },
  teams: { title: "Teams", fields: ["name", "leader_id", "department", "notes"] },
  contracts: { title: "Contracts", fields: ["contract_number", "title", "contract_type", "client_id", "supplier_id", "start_date", "end_date", "value", "status", "terms"] },
  reportTemplates: { title: "Custom Report Designer", fields: ["name", "data_source", "fields_json", "filters_json", "sort_json"] },
  workflows: { title: "Workflow Builder", fields: ["name", "entity_type", "definition_json", "active"] },
  approvals: { title: "Approvals", fields: ["entity_type", "entity_id", "step_name", "approver_id", "status", "comments", "decided_at"] },
  portalRequests: { title: "Portal Requests", fields: ["portal_type", "requester_name", "requester_email", "subject", "message", "status", "related_project_id"] },
  maintenance: { title: "Maintenance", fields: ["asset_id", "vehicle_id", "title", "due_date", "interval_days", "cost", "status", "notes"] },
};

const fieldLabel = (field) => field.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
const fieldType = (field) => /date$/.test(field) ? "date" : /(amount|value|quantity|cost|balance|id|life|days)/.test(field) ? "number" : "text";

export default function EnterpriseModule({ module }) {
  const config = CONFIG[module];
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const empty = () => Object.fromEntries(config.fields.map((field) => [field, field === "active" ? 1 : ""]));

  const load = async () => {
    setLoading(true);
    try { const response = await api.get(`/enterprise/${module}`); setRows(response.data?.data || []); setError(""); }
    catch (err) { setError(err.response?.data?.error || "Unable to load records"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [module]);
  const startNew = () => { setEditing(null); setForm(empty()); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm(Object.fromEntries(config.fields.map((field) => [field, row?.[field] ?? ""]))); setOpen(true); };
  const save = async () => {
    try { editing ? await api.put(`/enterprise/${module}/${editing.id}`, form) : await api.post(`/enterprise/${module}`, form); setOpen(false); load(); }
    catch (err) { setError(err.response?.data?.error || "Unable to save record"); }
  };
  const remove = async (id) => { if (!window.confirm("Delete this record?")) return; try { await api.delete(`/enterprise/${module}/${id}`); load(); } catch (err) { setError(err.response?.data?.error || "Unable to delete record"); } };

  if (!config) return null;
  return <Box>
    <PageHeader title={config.title} subtitle={`Manage ${config.title.toLowerCase()}`} actionLabel="Add" onAction={startNew} icon="▦" />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <EnterpriseSection title={config.title} loading={loading}>
      {!loading && rows.length === 0 ? <EnterpriseEmptyState message={`No ${config.title.toLowerCase()} found`} actionLabel="Add" onAction={startNew} /> :
        <Box sx={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{config.fields.slice(0, 5).map((field) => <th key={field} style={{ textAlign: "left", padding: 10 }}>{fieldLabel(field)}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.fields.slice(0, 5).map((field) => <td key={field} style={{ padding: 10 }}>{String(row?.[field] ?? "—")}</td>)}<td><IconButton onClick={() => startEdit(row)}><Edit /></IconButton><IconButton color="error" onClick={() => remove(row.id)}><Delete /></IconButton></td></tr>)}</tbody></table></Box>}
    </EnterpriseSection>
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth><DialogTitle>{editing ? "Edit" : "Add"} {config.title}</DialogTitle><DialogContent><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mt: 1 }}>{config.fields.map((field) => <TextField key={field} label={fieldLabel(field)} type={fieldType(field)} value={form[field] ?? ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} InputLabelProps={fieldType(field) === "date" ? { shrink: true } : undefined} multiline={/(description|notes|terms|message|json|defects|action)/.test(field)} />)}</Box></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions></Dialog>
  </Box>;
}
