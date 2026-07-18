import { Link, useLocation } from "react-router-dom";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import EngineeringIcon from "@mui/icons-material/Engineering";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
} from "@mui/material";


import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import FolderIcon from "@mui/icons-material/Folder";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalculateIcon from "@mui/icons-material/Calculate";
import InventoryIcon from "@mui/icons-material/Inventory";
import PaymentsIcon from "@mui/icons-material/Payments";
import BarChartIcon from "@mui/icons-material/BarChart";
import ScienceIcon from "@mui/icons-material/Science";


import { useLanguage } from "../context/LanguageContext";


const drawerWidth = 250;



export default function Sidebar() {


  const location = useLocation();


  const { t } = useLanguage();



  const menu = [

    {
      text:t.dashboard,
      icon:<DashboardIcon />,
      path:"/"
    },


    {
      text:t.clients,
      icon:<PeopleIcon />,
      path:"/clients"
    },

{
  text: "Employees",
  icon: <EngineeringIcon />,
  path: "/employees"
},

    {
      text:t.projects,
      icon:<FolderIcon />,
      path:"/projects"
    },


    {
      text:t.invoices,
      icon:<ReceiptIcon />,
      path:"/invoices"
    },


    {
      text:"Calculator",
      icon:<CalculateIcon />,
      path:"/calculator"
    },


    {
      text:t.systems,
      icon:<ScienceIcon />,
      path:"/systems"
    },


    {
      text:t.products,
      icon:<Inventory2Icon />,
      path:"/products"
    },


    {
      text:t.stock,
      icon:<InventoryIcon />,
      path:"/stock"
    },


    {
      text:"Debts",
      icon:<PaymentsIcon />,
      path:"/debts"
    },


    {
      text:"Company Settings",
      icon:<InventoryIcon />,
      path:"/company-settings"
    },


    {
      text:"Reports",
      icon:<BarChartIcon />,
      path:"/reports"
    },


  ];




  return (


    <Drawer


      variant="permanent"


      sx={{

        width:drawerWidth,

        flexShrink:0,


        "& .MuiDrawer-paper":{

          width:drawerWidth,

          boxSizing:"border-box",

        },


      }}


    >



      <Toolbar>


        <div>


          <Typography
            variant="h6"
            fontWeight="bold"
          >

            IDEAIL ERP

          </Typography>



          <Typography variant="body2">

            SARL IDEAIL ROUVETMON

          </Typography>


        </div>


      </Toolbar>



      <Divider />



      <List>


        {
          menu.map((item)=>(


            <ListItemButton

              key={item.path}

              component={Link}

              to={item.path}

              selected={
                location.pathname===item.path
              }

            >


              <ListItemIcon>

                {item.icon}

              </ListItemIcon>



              <ListItemText

                primary={item.text}

              />


            </ListItemButton>


          ))
        }


      </List>



    </Drawer>


  );


}