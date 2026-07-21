import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Paper,
  Box,
  Typography,
} from "@mui/material";
import { spacing, borderRadius, shadows } from "../theme/designTokens";
import { TableSkeleton } from "./LoadingSkeleton";

export default function DataTable({
  columns,
  data,
  loading = false,
  page = 0,
  rowsPerPage = 10,
  totalRows = 0,
  onPageChange,
  onRowsPerPageChange,
  emptyMessage = "No data available",
  emptyIcon = "📭",
  sx,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: borderRadius.lg,
        boxShadow: shadows.card,
        overflow: "hidden",
        ...sx,
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || "left"}
                  sx={{
                    fontWeight: "bold",
                    bgcolor: "action.hover",
                    borderBottom: 2,
                    borderColor: "divider",
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ p: 0 }}>
                  <TableSkeleton rows={rowsPerPage} columns={columns.length} />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 6,
                    }}
                  >
                    <Typography variant="h3" sx={{ mb: 1, opacity: 0.3 }}>
                      {emptyIcon}
                    </Typography>
                    <Typography color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  hover
                  sx={{
                    "&:last-child td": { border: 0 },
                    transition: "background-color 0.2s",
                  }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell
                        key={column.id}
                        align={column.align || "left"}
                      >
                        {column.render ? column.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalRows > rowsPerPage && (
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Rows per page"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
        />
      )}
    </Paper>
  );
}