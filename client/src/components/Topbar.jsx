import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
} from "@mui/material";

import LightModeIcon from "@mui/icons-material/LightMode";
import LanguageIcon from "@mui/icons-material/Language";
import Notifications from "./Notifications";

export default function Topbar() {
  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        background: "#ffffff",
        color: "#222",
        ml: "240px",
        width: "calc(100% - 240px)",
      }}
    >
      <Toolbar>

        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: "bold" }}
        >
          IDEAIL ERP
        </Typography>

        <Box>

          <IconButton color="inherit">
            <LanguageIcon />
          </IconButton>

          <IconButton color="inherit">
            <LightModeIcon />
          </IconButton>

          <Notifications />

          <Avatar
            sx={{
              ml: 2,
              bgcolor: "#1976d2",
              width: 36,
              height: 36,
            }}
          >
            A
          </Avatar>

        </Box>

      </Toolbar>
    </AppBar>
  );
}
