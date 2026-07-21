import { Skeleton, Box } from "@mui/material";
import { spacing, borderRadius } from "../theme/designTokens";

// Loading Skeleton for Cards
export function CardSkeleton({ height = 100 }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: borderRadius.lg,
        bgcolor: "background.paper",
      }}
    >
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={height} />
    </Box>
  );
}

// Loading Skeleton for Tables
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", mb: 1, pb: 1, borderBottom: 1, borderColor: "divider" }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${100 / columns}%`}
            height={20}
            sx={{ mr: 1 }}
          />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex", py: 1 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${100 / columns}%`}
              height={16}
              sx={{ mr: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

// Loading Skeleton for Lists
export function ListSkeleton({ items = 5 }) {
  return (
    <Box>
      {Array.from({ length: items }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="70%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="40%" height={14} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Loading Skeleton for Form
export function FormSkeleton({ fields = 4 }) {
  return (
    <Box>
      {Array.from({ length: fields }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          width="100%"
          height={56}
          sx={{
            mb: 2,
            borderRadius: borderRadius.md,
          }}
        />
      ))}
      <Skeleton variant="rectangular" width={120} height={36} />
    </Box>
  );
}

// Generic Loading Overlay
export function LoadingOverlay({ loading, children }) {
  if (!loading) return children;
  return (
    <Box sx={{ position: "relative" }}>
      {children}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: "rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <Skeleton variant="circular" width={40} height={40} />
      </Box>
    </Box>
  );
}

export default {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  FormSkeleton,
  LoadingOverlay,
};