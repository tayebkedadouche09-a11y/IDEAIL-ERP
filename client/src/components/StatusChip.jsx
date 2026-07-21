import { Chip } from "@mui/material";
import { borderRadius } from "../theme/designTokens";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CancelIcon from "@mui/icons-material/Cancel";
import BlockIcon from "@mui/icons-material/Block";

import { useLanguage } from "../context/LanguageContext";

// Status mapping for invoices
const invoiceStatusMap = {
  "مدفوعة": { key: "paid", color: "success", icon: CheckCircleIcon },
  "غير مدفوعة": { key: "unpaid", color: "warning", icon: ScheduleIcon },
  "ملغاة": { key: "cancelled", color: "error", icon: CancelIcon },
  "draft": { key: "draft", color: "default", icon: ScheduleIcon },
  "Draft": { key: "draft", color: "default", icon: ScheduleIcon },
  "sent": { key: "sent", color: "info", icon: ScheduleIcon },
  "Issued": { key: "issued", color: "info", icon: ScheduleIcon },
  "accepted": { key: "approved", color: "success", icon: CheckCircleIcon },
  "Accepted": { key: "accepted", color: "success", icon: CheckCircleIcon },
  "refused": { key: "rejected", color: "error", icon: CancelIcon },
  "Paid": { key: "paid", color: "success", icon: CheckCircleIcon },
  "Partially Paid": { key: "partially_paid", color: "warning", icon: ScheduleIcon },
  "Cancelled": { key: "cancelled", color: "error", icon: CancelIcon },
};

// Status mapping for projects
const projectStatusMap = {
  "جديد": { key: "new", color: "info", icon: ScheduleIcon },
  "قيد التنفيذ": { key: "in_progress", color: "warning", icon: ScheduleIcon },
  "مكتمل": { key: "completed", color: "success", icon: CheckCircleIcon },
  "ملغي": { key: "cancelled", color: "error", icon: CancelIcon },
};

// Status mapping for clients
const clientStatusMap = {
  "نشط": { key: "active", color: "success", icon: CheckCircleIcon },
  "متوقف": { key: "inactive", color: "error", icon: BlockIcon },
  "محظور": { key: "blocked", color: "error", icon: BlockIcon },
};

// Status mapping for devis (quotes)
const devisStatusMap = {
  "brouillon": { key: "draft", color: "default", icon: ScheduleIcon },
  "envoyé": { key: "sent", color: "info", icon: ScheduleIcon },
  "accepté": { key: "accepted", color: "success", icon: CheckCircleIcon },
  "refusé": { key: "rejected", color: "error", icon: CancelIcon },
  "converti": { key: "converted", color: "secondary", icon: CheckCircleIcon },
};

export default function StatusChip({ status, type = "invoice", ...props }) {
  const { t } = useLanguage();
  const statusMap = type === "project" ? projectStatusMap : type === "client" ? clientStatusMap : type === "devis" ? devisStatusMap : invoiceStatusMap;
  const statusInfo = statusMap[status] || { key: status, color: "default" };
  const Icon = statusInfo.icon;

  return (
    <Chip
      label={t(statusInfo.key) || status}
      color={statusInfo.color}
      size="small"
      variant="outlined"
      icon={Icon ? <Icon fontSize="small" /> : undefined}
      sx={{
        borderRadius: borderRadius.full,
        fontWeight: 500,
        ...props.sx,
      }}
      {...props}
    />
  );
}