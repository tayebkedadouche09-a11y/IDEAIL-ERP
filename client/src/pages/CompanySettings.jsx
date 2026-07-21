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
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon, Business as BusinessIcon, Settings as SettingsIcon, Security as SecurityIcon, Backup as BackupIcon, Language as LanguageIcon, Palette as PaletteIcon } from "@mui/icons-material";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import EnterpriseSection from "../components/EnterpriseSection";
import EnterprisePanel from "../components/EnterprisePanel";
import EnterpriseFormSection from "../components/EnterpriseFormSection";
import EnterpriseInfoCard from "../components/EnterpriseInfoCard";

export default function CompanySettings() {
  const [form, setForm] = useState({
    company_name: "",
    phone: "",
    email: "",
    address: "",
    website: "",
    activity_type: "",
    registration_number: "",
    tax_number: "",
    nif: "",
    nis: "",
    rc: "",
    ai: "",
    vat_rate: "19",
    default_currency: "DZD",
    payment_terms: "30",
    invoice_prefix: "INV-",
    quote_prefix: "QUO-",
    language: "ar",
    theme: "light",
    date_format: "dd/mm/yyyy",
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      const res = await api.get("/company");
      setForm({
        company_name: res.data.company_name || "",
        phone: res.data.phone || "",
        email: res.data.email || "",
        address: res.data.address || "",
        website: res.data.website || "",
        activity_type: res.data.activity_type || "",
        registration_number: res.data.registration_number || "",
        tax_number: res.data.tax_number || "",
        nif: res.data.nif || "",
        nis: res.data.nis || "",
        rc: res.data.rc || "",
        ai: res.data.ai || "",
        vat_rate: res.data.vat_rate || "19",
        default_currency: res.data.default_currency || "DZD",
        payment_terms: res.data.payment_terms || "30",
        invoice_prefix: res.data.invoice_prefix || "INV-",
        quote_prefix: res.data.quote_prefix || "QUO-",
        language: res.data.language || "ar",
        theme: res.data.theme || "light",
        date_format: res.data.date_format || "dd/mm/yyyy",
      });
      if (res.data.logo_url) {
        setLogoPreview(res.data.logo_url);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function save() {
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });
      if (logo) {
        data.append("logo", logo);
      }
      await api.post("/company", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage({ type: "success", text: "Company information saved successfully" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || "Save failed" });
    }
    setLoading(false);
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  return (
    <Box>
      <PageHeader
        title="Company Settings"
        subtitle="Manage company information and system preferences"
        actionLabel="Save Changes"
        onAction={save}
        icon="🏢"
      />

      {message.text && (
        <Alert severity={message.type || "info"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* Left side: Settings navigation */}
        <Box sx={{ width: { xs: "100%", md: 250 } }}>
          <EnterprisePanel title="Settings Menu">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Chip icon={<BusinessIcon />} label="Company Information" color="primary" variant="outlined" />
              <Chip icon={<SettingsIcon />} label="Financial Settings" variant="outlined" />
              <Chip icon={<LanguageIcon />} label="System Settings" variant="outlined" />
              <Chip icon={<SecurityIcon />} label="Security Settings" variant="outlined" />
              <Chip icon={<BackupIcon />} label="Backup Settings" variant="outlined" />
            </Box>
          </EnterprisePanel>
        </Box>

        {/* Right side: Settings content */}
        <Box sx={{ flex: 1 }}>
          {/* Company Information Section */}
          <EnterpriseSection title="Company Information" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
              <EnterpriseInfoCard title="Current Logo">
                {logoPreview ? (
                  <Avatar
                    src={logoPreview}
                    sx={{ width: 100, height: 100, mb: 2 }}
                    variant="rounded"
                  />
                ) : (
                  <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: "primary.main" }}>
                    <BusinessIcon fontSize="large" />
                  </Avatar>
                )}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" size="small" component="label">
                    Upload
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </Button>
                  {logoPreview && (
                    <Button variant="text" size="small" color="error" onClick={() => { setLogo(null); setLogoPreview(null); }}>
                      Remove
                    </Button>
                  )}
                </Box>
              </EnterpriseInfoCard>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={form.company_name}
                onChange={change}
                required
              />
              <TextField
                fullWidth
                label="Activity Type"
                name="activity_type"
                value={form.activity_type}
                onChange={change}
              />
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={form.address}
                onChange={change}
                multiline
                rows={2}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={change}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={change}
                />
              </Box>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={form.website}
                onChange={change}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  name="registration_number"
                  value={form.registration_number}
                  onChange={change}
                />
                <TextField
                  fullWidth
                  label="Tax Number"
                  name="tax_number"
                  value={form.tax_number}
                  onChange={change}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="NIF"
                  name="nif"
                  value={form.nif}
                  onChange={change}
                />
                <TextField
                  fullWidth
                  label="NIS"
                  name="nis"
                  value={form.nis}
                  onChange={change}
                />
                <TextField
                  fullWidth
                  label="RC"
                  name="rc"
                  value={form.rc}
                  onChange={change}
                />
              </Box>
              <TextField
                fullWidth
                label="AI"
                name="ai"
                value={form.ai}
                onChange={change}
              />
            </Box>
          </EnterpriseSection>

          {/* Financial Settings Section */}
          <EnterpriseSection title="Financial Settings" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Default Currency"
                name="default_currency"
                value={form.default_currency}
                onChange={change}
              >
                <MenuItem value="DZD">DZD - Algerian Dinar</MenuItem>
                <MenuItem value="EUR">EUR - Euro</MenuItem>
                <MenuItem value="USD">USD - US Dollar</MenuItem>
              </TextField>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="VAT Rate (%)"
                  name="vat_rate"
                  type="number"
                  value={form.vat_rate}
                  onChange={change}
                />
                <TextField
                  fullWidth
                  label="Payment Terms (days)"
                  name="payment_terms"
                  type="number"
                  value={form.payment_terms}
                  onChange={change}
                />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Invoice Prefix"
                  name="invoice_prefix"
                  value={form.invoice_prefix}
                  onChange={change}
                />
                <TextField
                  fullWidth
                  label="Quote Prefix"
                  name="quote_prefix"
                  value={form.quote_prefix}
                  onChange={change}
                />
              </Box>
            </Box>
          </EnterpriseSection>

          {/* System Settings Section */}
          <EnterpriseSection title="System Settings" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Language"
                name="language"
                value={form.language}
                onChange={change}
              >
                <MenuItem value="ar">🇩🇿 Arabic</MenuItem>
                <MenuItem value="fr">🇫🇷 French</MenuItem>
                <MenuItem value="en">🇬🇧 English</MenuItem>
              </TextField>
              <TextField
                select
                fullWidth
                label="Theme"
                name="theme"
                value={form.theme}
                onChange={change}
              >
                <MenuItem value="light">☀️ Light</MenuItem>
                <MenuItem value="dark">🌙 Dark</MenuItem>
              </TextField>
              <TextField
                select
                fullWidth
                label="Date Format"
                name="date_format"
                value={form.date_format}
                onChange={change}
              >
                <MenuItem value="dd/mm/yyyy">DD/MM/YYYY</MenuItem>
                <MenuItem value="mm/dd/yyyy">MM/DD/YYYY</MenuItem>
                <MenuItem value="yyyy-mm-dd">YYYY-MM-DD</MenuItem>
              </TextField>
            </Box>
          </EnterpriseSection>

          {/* Security Settings Section */}
          <EnterpriseSection title="Security Settings" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button variant="outlined" startIcon={<SecurityIcon />}>
                Change Password
              </Button>
              <Button variant="outlined" startIcon={<SecurityIcon />}>
                Session Management
              </Button>
              <Button variant="outlined" startIcon={<SecurityIcon />}>
                User Permissions
              </Button>
            </Box>
          </EnterpriseSection>

          {/* Backup Settings Section */}
          <EnterpriseSection title="Backup Settings" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button variant="contained" startIcon={<BackupIcon />}>
                Create Backup
              </Button>
              <Button variant="outlined" startIcon={<BackupIcon />}>
                Restore Backup
              </Button>
              <Button variant="outlined" startIcon={<BackupIcon />}>
                Export Data
              </Button>
            </Box>
          </EnterpriseSection>
        </Box>
      </Box>
    </Box>
  );
}