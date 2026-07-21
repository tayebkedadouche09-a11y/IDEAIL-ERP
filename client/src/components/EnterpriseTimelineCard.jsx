import { Box, Typography } from "@mui/material";
import { borderRadius, transitions } from "../theme/designTokens";

export default function EnterpriseTimelineCard({
  events,
  sx,
}) {
  return (
    <Box sx={{ position: "relative", ...sx }}>
      {events.map((event, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            mb: 2,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              left: 12,
              top: 24,
              bottom: -16,
              width: 2,
              bgcolor: "divider",
              display: index === events.length - 1 ? "none" : undefined,
            },
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mr: 2,
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            {event.icon || "📅"}
          </Box>
          <Box>
            <Typography fontWeight="medium">
              {event.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {event.date}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}