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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon, Description as DescriptionIcon, Upload as UploadIcon, Download as DownloadIcon, Image as ImageIcon, PictureAsPdf as PdfIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import { useLanguage } from "../context/LanguageContext";

const DOCUMENT_CATEGORIES = [
  { value: "projects", key: "projects", icon: "📁" },
  { value: "finance", key: "finance", icon: "💰" },
  { value: "hr", key: "hr", icon: "👥" },
  { value: "company", key: "company", icon: "🏢" },
];

const DOCUMENT_TYPES = [
  { value: "photo", key: "photo", icon: "🖼️" },
  { value: "report", key: "report", icon: "📊" },
  { value: "technical", key: "technical", icon: "🔧" },
  { value: "invoice", key: "invoices", icon: "🧾" },
  { value: "quote", key: "quotes", icon: "📄" },
  { value: "contract", key: "contracts", icon: "📋" },
  { value: "certificate", key: "certificates", icon: "📜" },
];

const emptyForm = {
  name: "",
  category: "projects",
  type: "photo",
  project_id: "",
  client_id: "",
  supplier_id: "",
  description: "",
};

export default function Documents() {
  const { t } = useLanguage();
  
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [stats, setStats] = useState({
    total: 0,
    projectDocs: 0,
    invoiceDocs: 0,
    contractDocs: 0,
    storageUsed: "0 MB",
    recentUploads: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [docsRes, projectsRes, clientsRes, suppliersRes] = await Promise.all([
        api.get("/documents"),
        api.get("/projects"),
        api.get("/clients"),
        api.get("/suppliers"),
      ]);
      setDocuments(docsRes.data || []);
      setProjects(projectsRes.data || []);
      setClients(clientsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      calculateStats(docsRes.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  function calculateStats(data) {
    const totalSize = data.reduce((sum, d) => sum + (d.size || 0), 0);
    const newStats = {
      total: data.length,
      projectDocs: data.filter(d => d.category === "projects").length,
      invoiceDocs: data.filter(d => d.type === "invoice").length,
      contractDocs: data.filter(d => d.type === "contract").length,
      storageUsed: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      recentUploads: data.filter(d => {
        const uploadDate = new Date(d.created_at);
        const now = new Date();
        return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear();
      }).length,
    };
    setStats(newStats);
  }

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setForm({ ...form, name: selectedFile.name });
    }
  }

  function addNew() {
    setEditId(null);
    setForm(emptyForm);
    setFile(null);
    setOpen(true);
  }

  async function save() {
    if (!file && !editId) {
      setMessage({ type: "error", text: t("selectFileRequired") || "Please select a file" });
      return;
    }

    try {
      const data = new FormData();
      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });
      if (file) {
        data.append("file", file);
      }

      if (editId) {
        await api.put(`/documents/${editId}`, data);
        setMessage({ type: "success", text: t("documentUpdated") || "Document updated" });
      } else {
        await api.post("/documents", data);
        setMessage({ type: "success", text: t("documentUploaded") || "Document uploaded" });
      }
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      setFile(null);
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("saveFailed") || "Save failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  function editDocument(doc) {
    setEditId(doc.id);
    setForm({
      name: doc.name || "",
      category: doc.category || "projects",
      type: doc.type || "photo",
      project_id: doc.project_id || "",
      client_id: doc.client_id || "",
      supplier_id: doc.supplier_id || "",
      description: doc.description || "",
    });
    setOpen(true);
  }

  async function remove(id) {
    if (!window.confirm(t("deleteDocumentConfirm") || "Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      setMessage({ type: "success", text: t("documentDeleted") || "Document deleted" });
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || t("deleteFailed") || "Delete failed" });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  function getFileIcon(type) {
    if (type?.includes("image")) return <ImageIcon />;
    if (type?.includes("pdf")) return <PdfIcon />;
    return <DescriptionIcon />;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  const filteredDocuments = documents
    .filter((d) => categoryFilter === "all" || d.category === categoryFilter)
    .filter((d) => typeFilter === "all" || d.type === typeFilter)
    .filter((d) =>
      searchTerm === "" ||
      d.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title={t("documents") || "Documents"}
        subtitle={t("manageDocuments") || "Manage company files, project documents and attachments"}
        actionLabel={t("uploadDocument") || "Upload Document"}
        onAction={addNew}
        icon="📁"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <EnterpriseSection title={t("statistics") || "Statistics"} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title={t("totalDocuments") || "Total Documents"}
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title={t("projectDocuments") || "Project Documents"}
            value={stats.projectDocs}
            color="info"
            icon="📁"
          />
          <EnterpriseStatCard
            title={t("invoiceDocuments") || "Invoice Documents"}
            value={stats.invoiceDocs}
            color="warning"
            icon="🧾"
          />
          <EnterpriseStatCard
            title={t("contractDocuments") || "Contract Documents"}
            value={stats.contractDocs}
            color="success"
            icon="📋"
          />
          <EnterpriseStatCard
            title={t("storageUsed") || "Storage Used"}
            value={stats.storageUsed}
            color="default"
            icon="💾"
          />
          <EnterpriseStatCard
            title={t("recentUploads") || "Recent Uploads"}
            value={stats.recentUploads}
            color="error"
            icon="📤"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseSection title={t("documentCategories") || "Document Categories"} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterprisePanel title={t("projects") || "Projects"} sx={{ flex: 1, minWidth: 150 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label={t("photos") || "Photos"} size="small" variant="outlined" />
              <Chip label={t("reports") || "Reports"} size="small" variant="outlined" />
              <Chip label={t("technicalFiles") || "Technical Files"} size="small" variant="outlined" />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title={t("finance") || "Finance"} sx={{ flex: 1, minWidth: 150 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label={t("invoices") || "Invoices"} size="small" variant="outlined" />
              <Chip label={t("quotes") || "Quotes"} size="small" variant="outlined" />
              <Chip label={t("payments") || "Payments"} size="small" variant="outlined" />
            </Box>
          </EnterprisePanel>
          <EnterprisePanel title={t("hr") || "HR"} sx={{ flex: 1, minWidth: 150 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip label={t("employeeDocs") || "Employee Docs"} size="small" variant="outlined" />
              <Chip label={t("contracts") || "Contracts"} size="small" variant="outlined" />
            </Box>
          </EnterprisePanel>
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchDocuments") || "Search documents..."}
        filters={[
          { value: "all", label: t("allCategories") || "All Categories" },
          ...DOCUMENT_CATEGORIES.map((dc) => ({ value: dc.value, label: t(dc.key) || dc.label })),
        ]}
        filterValue={categoryFilter}
        onFilterChange={setCategoryFilter}
        onRefresh={loadData}
      />

      <EnterpriseSection title={t("documentsList") || "Documents List"}>
        {filteredDocuments.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noDocumentsFound") || "No documents found"}
            actionLabel={t("uploadYourFirstDocument") || "Upload your first document"}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("preview") || "Preview"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("name") || "Name"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("category") || "Category"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("related") || "Related"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("type") || "Type"}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("size") || "Size"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("date") || "Date"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("by") || "By"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status") || "Status"}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "12px" }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        {getFileIcon(doc.file_type)}
                      </Avatar>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Typography variant="body2" fontWeight="bold">
                        {doc.name}
                      </Typography>
                    </td>
                    <td style={{ padding: "12px" }}>{t(doc.category) || doc.category}</td>
                    <td style={{ padding: "12px" }}>{doc.related_name || "-"}</td>
                    <td style={{ padding: "12px" }}>{t(doc.type) || doc.type}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatSize(doc.size)}</td>
                    <td style={{ padding: "12px" }}>{doc.created_at?.slice(0, 10)}</td>
                    <td style={{ padding: "12px" }}>{doc.uploaded_by || "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <StatusChip status={doc.status} />
                    </td>
                    <td style={{ padding: "12px" }}>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title={t("view") || "View"}>
                          <IconButton size="small" color="primary" onClick={() => editDocument(doc)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("download") || "Download"}>
                          <IconButton size="small" color="info">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("delete") || "Delete"}>
                          <IconButton size="small" color="error" onClick={() => remove(doc.id)}>
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
          {editId ? t("editDocument") || "Edit Document" : t("uploadDocument") || "Upload Document"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("fileInformation") || "File Information"}
          </Typography>
          <Button variant="outlined" component="label" fullWidth sx={{ mb: 2 }}>
            {file ? file.name : t("selectFile") || "Select File"}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("category") || "Category"}
            name="category"
            value={form.category}
            onChange={change}
          >
            {DOCUMENT_CATEGORIES.map((dc) => (
              <MenuItem key={dc.value} value={dc.value}>
                {dc.icon} {t(dc.key) || dc.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("type") || "Type"}
            name="type"
            value={form.type}
            onChange={change}
          >
            {DOCUMENT_TYPES.map((dt) => (
              <MenuItem key={dt.value} value={dt.value}>
                {dt.icon} {t(dt.key) || dt.label}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {t("relation") || "Relation"}
          </Typography>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("relatedProject") || "Related Project"}
            name="project_id"
            value={form.project_id}
            onChange={change}
          >
            <MenuItem value="">-- {t("none") || "None"} --</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("relatedClient") || "Related Client"}
            name="client_id"
            value={form.client_id}
            onChange={change}
          >
            <MenuItem value="">-- {t("none") || "None"} --</MenuItem>
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            margin="normal"
            label={t("relatedSupplier") || "Related Supplier"}
            name="supplier_id"
            value={form.supplier_id}
            onChange={change}
          >
            <MenuItem value="">-- {t("none") || "None"} --</MenuItem>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label={t("description") || "Description"}
            name="description"
            value={form.description}
            onChange={change}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t("cancel") || "Cancel"}</Button>
          <Button variant="contained" onClick={save}>{t("save") || "Save"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}