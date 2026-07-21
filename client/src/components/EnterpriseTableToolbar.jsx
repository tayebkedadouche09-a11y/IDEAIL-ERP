import { Box, IconButton, useMediaQuery } from "@mui/material";
import { borderRadius, transitions } from "../theme/designTokens";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

export default function EnterpriseTableToolbar({
  onFilter,
  onSort,
  onRefresh,
  onExport,
  children,
  sx,
}) {
  const theme = useMediaQuery("(theme)");

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 2,
        flexWrap: "wrap",
        ...sx,
      }}
    >
      {children}

      {onFilter && (
        <IconButton size="small" aria-label="Filter">
          <FilterListIcon />
        </IconButton>
      )}

      {onSort && (
        <IconButton size="small" aria-label="Sort">
          <SortIcon />
        </IconButton>
      )}

      {onRefresh && (
        <IconButton size="small" aria-label="Refresh" onClick={onRefresh}>
          <RefreshIcon />
        </IconButton>
      )}

      {onExport && (
        <IconButton size="small" aria-label="Export">
          <FileDownloadIcon />
        </IconButton>
      )}
    </Box>
  );
}