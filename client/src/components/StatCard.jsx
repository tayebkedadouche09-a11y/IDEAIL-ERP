import { Card, CardContent, Typography } from "@mui/material";

export default function StatCard({ title, value, icon }) {
  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h4">{icon}</Typography>

        <Typography
          variant="subtitle2"
          color="text.secondary"
        >
          {title}
        </Typography>

        <Typography
          variant="h5"
          fontWeight="bold"
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}