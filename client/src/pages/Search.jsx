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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon, Description as DescriptionIcon, Folder as FolderIcon, Receipt as ReceiptIcon, Payment as PaymentIcon, Inventory as InventoryIcon, Person as PersonIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseStatCard from "../components/EnterpriseStatCard";
import EnterpriseSection from "../components/EnterpriseSection";
import { useLanguage } from "../context/LanguageContext";

export default function Search() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    clients: [],
    projects: [],
    invoices: [],
    payments: [],
    products: [],
    documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  async function performSearch() {
    if (!query.trim()) {
      setResults({
        clients: [],
        projects: [],
        invoices: [],
        payments: [],
        products: [],
        documents: [],
      });
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/search?query=${encodeURIComponent(query)}`);
      // Ensure all arrays are safe with Array.isArray check
      const rawResults = res.data?.results || {};
      setResults({
        clients: Array.isArray(rawResults.clients) ? rawResults.clients : [],
        projects: Array.isArray(rawResults.projects) ? rawResults.projects : [],
        invoices: Array.isArray(rawResults.invoices) ? rawResults.invoices : [],
        payments: Array.isArray(rawResults.payments) ? rawResults.payments : [],
        products: Array.isArray(rawResults.products) ? rawResults.products : [],
        documents: Array.isArray(rawResults.documents) ? rawResults.documents : [],
      });
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.log(err);
      // Reset to empty arrays on error to prevent crashes
      setResults({
        clients: [],
        projects: [],
        invoices: [],
        payments: [],
        products: [],
        documents: [],
      });
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setResults({
      clients: [],
      projects: [],
      invoices: [],
      payments: [],
      products: [],
      documents: [],
    });
    setTotal(0);
  }

  return (
    <Box>
      <PageHeader
        title={t("search")}
        subtitle={t("searchAcrossAllModules")}
        icon="🔍"
      />

      <EnterpriseSection title={t("search")} sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label={t("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && performSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} size="small">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" onClick={performSearch} disabled={loading || !query.trim()}>
            {loading ? t("searching") : t("search")}
          </Button>
        </Box>
      </EnterpriseSection>

      {total > 0 && (
        <EnterpriseSection title={`${t("results")} (${total})`}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <EnterpriseStatCard
              title={t("clients")}
              value={results.clients.length}
              color="primary"
              icon="👥"
            />
            <EnterpriseStatCard
              title={t("projects")}
              value={results.projects.length}
              color="info"
              icon="📁"
            />
            <EnterpriseStatCard
              title={t("invoices")}
              value={results.invoices.length}
              color="success"
              icon="🧾"
            />
            <EnterpriseStatCard
              title={t("payments")}
              value={results.payments.length}
              color="warning"
              icon="💰"
            />
            <EnterpriseStatCard
              title={t("products")}
              value={results.products.length}
              color="default"
              icon="📦"
            />
            <EnterpriseStatCard
              title={t("documents")}
              value={results.documents.length}
              color="error"
              icon="📄"
            />
          </Box>

          {results.clients.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>{t("clients")}</Typography>
              <List>
                {results.clients.map((client) => (
                  <ListItem key={client.id}>
                    <ListItemText primary={client.name || client.company_name} secondary={client.phone} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {results.projects.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>{t("projects")}</Typography>
              <List>
                {results.projects.map((project) => (
                  <ListItem key={project.id}>
                    <ListItemText primary={project.name} secondary={project.project_code} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {results.invoices.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>{t("invoices")}</Typography>
              <List>
                {results.invoices.map((invoice) => (
                  <ListItem key={invoice.id}>
                    <ListItemText primary={invoice.invoice_number} secondary={`${invoice.amount} DA`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {results.payments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>{t("payments")}</Typography>
              <List>
                {results.payments.map((payment) => (
                  <ListItem key={payment.id}>
                    <ListItemText primary={`${payment.amount} DA`} secondary={payment.payment_date} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {results.products.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>{t("products")}</Typography>
              <List>
                {results.products.map((product) => (
                  <ListItem key={product.id}>
                    <ListItemText primary={product.name} secondary={product.category} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {results.documents.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>{t("documents")}</Typography>
              <List>
                {results.documents.map((doc) => (
                  <ListItem key={doc.id}>
                    <ListItemText primary={doc.name} secondary={doc.document_type} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </EnterpriseSection>
      )}

      {query && total === 0 && !loading && (
        <EnterpriseSection title={t("noResults")}>
          <Typography color="text.secondary">{t("noResultsFoundFor")} "{query}"</Typography>
        </EnterpriseSection>
      )}
    </Box>
  );
}