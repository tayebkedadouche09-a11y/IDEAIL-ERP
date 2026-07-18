import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";

import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LanguageIcon from "@mui/icons-material/Language";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";



export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();


  const {
    language,
    changeLanguage
  } = useLanguage();



  const [langAnchor,setLangAnchor] = useState(null);



  function openLanguage(event){

    setLangAnchor(event.currentTarget);

  }



  function closeLanguage(){

    setLangAnchor(null);

  }



  function selectLanguage(lang){

    changeLanguage(lang);

    closeLanguage();

  }



  return (


    <AppBar

      position="fixed"

      color="inherit"

      elevation={1}

      sx={{

        width:"calc(100% - 250px)",

        ml:"250px",

      }}

    >


      <Toolbar>



        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight:"bold"
            }}
          >
            IDEAIL ERP
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary">
              {user.full_name || user.username} • {user.role}
            </Typography>
          )}
        </Box>





        <Box>



          <IconButton
            onClick={openLanguage}
          >

            <LanguageIcon />

          </IconButton>





          <Menu

            anchorEl={langAnchor}

            open={Boolean(langAnchor)}

            onClose={closeLanguage}

          >


            <MenuItem
              selected={language==="fr"}
              onClick={()=>selectLanguage("fr")}
            >

              🇫🇷 Français

            </MenuItem>



            <MenuItem
              selected={language==="ar"}
              onClick={()=>selectLanguage("ar")}
            >

              🇩🇿 العربية

            </MenuItem>



          </Menu>







          <IconButton>

            <DarkModeIcon />

          </IconButton>





          <IconButton>

            <NotificationsIcon />

          </IconButton>





          <IconButton>

            <AccountCircleIcon />

          </IconButton>

          <Button
            color="inherit"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            sx={{ ml: 1 }}
          >
            Logout
          </Button>

        </Box>



      </Toolbar>



    </AppBar>


  );


}