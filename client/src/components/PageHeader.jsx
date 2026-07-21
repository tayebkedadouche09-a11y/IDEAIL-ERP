import { Box, Typography, Breadcrumbs, Link, IconButton } from "@mui/material";
import { spacing, borderRadius } from "../theme/designTokens";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function PageHeader({
  title,
  subtitle,
  icon,
  breadcrumbs,
  onRefresh,
  actions,
  sx,
}) {
  return (
    <Box
      sx={{
        mb: spacing.lg,
        pb: spacing.md,
        borderBottom: 1,
        borderColor: "divider",
        ...sx,
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ mb: 1 }}
        >
          <Link
            underline="hover"
            color="inherit"
            href="/"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <HomeIcon fontSize="small" />
          </Link>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={index} color="text.primary" fontWeight="medium">
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                underline="hover"
                color="inherit"
                href={crumb.href}
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Title Row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {icon && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: borderRadius.lg,
                bgcolor: "primary.light",
                color: "primary.main",
                fontSize: 24,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {onRefresh && (
            <IconButton onClick={onRefresh} aria-label="Refresh">
              <RefreshIcon />
            </IconButton>
          )}
          {actions}
        </Box>
      </Box>
    </Box>
  );
}