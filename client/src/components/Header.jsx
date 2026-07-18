import { useState } from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
} from "@mui/material";


import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LanguageIcon from "@mui/icons-material/Language";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";


import { useLanguage } from "../context/LanguageContext";



export default function Header() {


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



        <Typography

          variant="h6"

          sx={{
            flexGrow:1,
            fontWeight:"bold"
          }}

        >

          IDEAIL ERP

        </Typography>





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



        </Box>



      </Toolbar>



    </AppBar>


  );


}