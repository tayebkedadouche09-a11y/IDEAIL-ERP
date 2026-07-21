import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Chip,
  IconButton,
  Box,
  Alert,
  Tooltip,
  TablePagination,
  Snackbar,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon, Send as SendIcon, CheckCircle as AcceptIcon, Cancel as RejectIcon, Receipt as ConvertIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import api from "../services/api";
import DevisForm from "../components/DevisForm";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterpriseTableToolbar from "../components/EnterpriseTableToolbar";
import EnterpriseEmptyState from "../components/EnterpriseEmptyState";
import StatusChip from "../components/StatusChip";
import ConfirmDialog from "../components/ConfirmDialog";
import { useLanguage } from "../context/LanguageContext";

const STATUS_CONFIG = {
  brouillon: { key: "draft", color: "default" },
  envoyé: { key: "sent", color: "info" },
  accepté: { key: "accepted", color: "success" },
  refusé: { key: "rejected", color: "error" },
  converti: { key: "converted", color: "secondary" },
};

export default function Devis() {
  const { t } = useLanguage();
  const [devisList, setDevisList] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editDevis, setEditDevis] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState({
    total: 0,
    brouillon: 0,
    envoyé: 0,
    accepté: 0,
    refusé: 0,
    converti: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadDevis();
  }, [page, limit, searchTerm, statusFilter]);

  async function loadDevis() {
    setLoading(true);
    try {
      const res = await api.get(`/devis?search=${searchTerm}&page=${page}&limit=${limit}&status=${statusFilter}`);
      // Handle both old format (array) and new format (object with data)
      if (Array.isArray(res.data)) {
        setDevisList(res.data);
        setTotal(res.data.length);
        setTotalPages(1);
      } else {
        setDevisList(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
      calculateStats(res.data.data || res.data);
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorLoadingDevis"), "error");
    } finally {
      setLoading(false);
    }
  }

  function showSnackbar(message, severity = "success") {
    setSnackbar({ open: true, message, severity });
  }

  function calculateStats(data) {
    const devisData = Array.isArray(data) ? data : (data || []);
    const newStats = {
      total: devisData.length,
      brouillon: devisData.filter(d => d.status === "brouillon").length,
      envoyé: devisData.filter(d => d.status === "envoyé").length,
      accepté: devisData.filter(d => d.status === "accepté").length,
      refusé: devisData.filter(d => d.status === "refusé").length,
      converti: devisData.filter(d => d.status === "converti").length,
      totalValue: devisData.reduce((sum, d) => sum + (d.amount || 0), 0),
    };
    setStats(newStats);
  }

  function addNew() {
    setEditDevis(null);
    setOpenForm(true);
  }

  async function editItem(devis) {
    try {
      const res = await api.get(`/devis/${devis.id}`);
      setEditDevis(res.data);
      setOpenForm(true);
    } catch (err) {
      console.log(err);
      showSnackbar(t("errorLoadingDevis"), "error");
    }
  }

  function onSaved() {
    showSnackbar(editDevis ? t("devisUpdatedSuccessfully") : t("devisCreatedSuccessfully"), "success");
    loadDevis();
  }

  function openDeleteDialog(id) {
    setDeleteId(id);
    setOpenDelete(true);
  }

  async function deleteDevis() {
    if (!deleteId) return;

    try {
      await api.delete(`/devis/${deleteId}`);
      setOpenDelete(false);
      setDeleteId(null);
      showSnackbar(t("devisDeletedSuccessfully"), "success");
      loadDevis();
    } catch (err) {
      showSnackbar(err.response?.data?.error || t("errorDeletingDevis"), "error");
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/devis/${id}/status`, { status });
      showSnackbar(t("updatedSuccessfully"), "success");
      loadDevis();
    } catch (err) {
      showSnackbar(err.response?.data?.error || t("errorSavingDevis"), "error");
    }
  }

  async function convertToInvoice(id) {
    if (!window.confirm(t("convertDevisToInvoice"))) return;
    try {
      const res = await api.post(`/devis/${id}/convert-to-invoice`);
      showSnackbar(`${t("invoiceCreatedSuccessfully")}: ${res.data.invoice_number}`, "success");
      loadDevis();
    } catch (err) {
      showSnackbar(err.response?.data?.error || t("errorSavingDevis"), "error");
    }
  }

  const filteredDevis = devisList
    .filter((d) => statusFilter === "all" || d.status === statusFilter)
    .filter((d) => 
      searchTerm === "" || 
      d.devis_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Box>
      <PageHeader
        title={t("devis")}
        subtitle={t("manageQuotations")}
        actionLabel={t("add")}
        onAction={addNew}
        icon="📋"
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

      <EnterpriseSection title={t("statisticsStat")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <EnterpriseStatCard
            title={t("totalDevis")}
            value={stats.total}
            color="primary"
            icon="📊"
          />
          <EnterpriseStatCard
            title={t("draft")}
            value={stats.brouillon}
            color="default"
            icon="📄"
          />
          <EnterpriseStatCard
            title={t("sent")}
            value={stats.envoyé}
            color="info"
            icon="📤"
          />
          <EnterpriseStatCard
            title={t("accepted")}
            value={stats.accepté}
            color="success"
            icon="✅"
          />
          <EnterpriseStatCard
            title={t("rejected")}
            value={stats.refusé}
            color="error"
            icon="❌"
          />
          <EnterpriseStatCard
            title={t("converted")}
            value={stats.converti}
            color="secondary"
            icon="🔄"
          />
          <EnterpriseStatCard
            title={t("totalValue")}
            value={`${stats.totalValue.toLocaleString()} DA`}
            color="primary"
            icon="💰"
          />
        </Box>
      </EnterpriseSection>

      <EnterpriseTableToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t("searchDevis")}
        filters={[
          { value: "all", label: t("allStatus") },
          { value: "brouillon", label: t("draft") },
          { value: "envoyé", label: t("sent") },
          { value: "accepté", label: t("accepted") },
          { value: "refusé", label: t("rejected") },
          { value: "converti", label: t("converted") },
        ]}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        onRefresh={loadDevis}
      />

      <EnterpriseSection title={t("devisList")} loading={loading}>
        {filteredDevis.length === 0 ? (
          <EnterpriseEmptyState
            message={t("noDevisFound")}
            actionLabel={t("createFirstDevis")}
            onAction={addNew}
          />
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("devisNumber")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("client")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("date")}</th>
                  <th style={{ textAlign: "right", padding: "12px", fontWeight: "bold" }}>{t("amount")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("status")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("validUntil")}</th>
                  <th style={{ textAlign: "left", padding: "12px", fontWeight: "bold" }}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map((d) => {
                  const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.brouillon;
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                      <td style={{ padding: "12px" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {d.devis_number}
                        </Typography>
                      </td>
                      <td style={{ padding: "12px" }}>{d.client_name}</td>
                      <td style={{ padding: "12px" }}>{d.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <Typography variant="body2" fontWeight="bold">
                          {d.amount?.toLocaleString()} DA
                        </Typography>
                      </td>
<td style={{ padding: "12px" }}>
                        <StatusChip status={d.status} type="devis" />
                      </td>
                      <td style={{ padding: "12px" }}>{d.valid_until || "-"}</td>
                      <td style={{ padding: "12px" }}>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {(d.status === "brouillon" || d.status === "envoyé") && (
                            <Tooltip title={t("edit")}>
                              <IconButton size="small" color="primary" onClick={() => editItem(d)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {d.status === "brouillon" && (
                            <Tooltip title={t("send")}>
                              <IconButton size="small" color="info" onClick={() => updateStatus(d.id, "envoyé")}>
                                <SendIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {d.status === "envoyé" && (
                            <>
                              <Tooltip title={t("approveDevis")}>
                                <IconButton size="small" color="success" onClick={() => updateStatus(d.id, "accepté")}>
                                  <AcceptIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t("rejectDevis")}>
                                <IconButton size="small" color="error" onClick={() => updateStatus(d.id, "refusé")}>
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {d.status === "accepté" && (
                            <Tooltip title={t("convertDevisToInvoice")}>
                              <IconButton size="small" color="secondary" onClick={() => convertToInvoice(d.id)}>
                                <ConvertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title={t("downloadPDF")}>
                            <IconButton size="small" onClick={() => window.open(`http://localhost:3000/pdf/devis/${d.id}`, "_blank")}>
                              <PdfIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {d.status === "brouillon" && (
                            <Tooltip title={t("delete")}>
                              <IconButton size="small" color="error" onClick={() => openDeleteDialog(d.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </td>
                    </tr>
                  );
                })}
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
                labelRowsPerPage={t("rowsPerPage")}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} ${t("of")} ${count}`}
              />
            )}
          </Box>
        )}
      </EnterpriseSection>

      <DevisForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSaved={onSaved}
        editDevis={editDevis}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={deleteDevis}
        title={t("deleteDevis")}
        message={t("confirmDeleteDevis")}
        confirmText={t("delete")}
        type="error"
      />
    </Box>
  );
}