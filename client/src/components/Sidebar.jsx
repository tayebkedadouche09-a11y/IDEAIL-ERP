import { useState } from "react";
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
  Box,
  IconButton,
  useMediaQuery,
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
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BackupIcon from "@mui/icons-material/Backup";
import SearchIcon from "@mui/icons-material/Search";

import { useLanguage } from "../context/LanguageContext";
import { sizes, borderRadius, transitions, shadows } from "../theme/designTokens";

// Menu organized into sections - using translation keys
const menuSections = [
  {
    titleKey: "MAIN",
    items: [
      {
        textKey: "dashboard",
        icon: <DashboardIcon />,
        path: "/",
      },
    ],
  },
  {
    titleKey: "BUSINESS",
    items: [
      {
        textKey: "clients",
        icon: <PeopleIcon />,
        path: "/clients",
      },
      {
        textKey: "employees",
        icon: <EngineeringIcon />,
        path: "/employees",
      },
      {
        textKey: "projects",
        icon: <FolderIcon />,
        path: "/projects",
      },
    ],
  },
  {
    titleKey: "HR",
    items: [
      {
        textKey: "attendance",
        icon: <AccessTimeIcon />,
        path: "/attendance",
      },
      {
        textKey: "leave",
        icon: <BeachAccessIcon />,
        path: "/leave",
      },
      {
        textKey: "payroll",
        icon: <MonetizationOnIcon />,
        path: "/payroll",
      },
    ],
  },
  {
    titleKey: "SALES",
    items: [
      {
        textKey: "devis",
        icon: <RequestQuoteIcon />,
        path: "/devis",
      },
      {
        textKey: "invoices",
        icon: <ReceiptIcon />,
        path: "/invoices",
      },
    ],
  },
  {
    titleKey: "FINANCE",
    items: [
      {
        textKey: "payments",
        icon: <AttachMoneyIcon />,
        path: "/payments",
      },
      {
        textKey: "expenses",
        icon: <MoneyOffIcon />,
        path: "/expenses",
      },
      {
        textKey: "cashFlow",
        icon: <AccountBalanceWalletIcon />,
        path: "/cash-flow",
      },
      {
        textKey: "debts",
        icon: <PaymentsIcon />,
        path: "/debts",
      },
    ],
  },
  {
    titleKey: "INVENTORY",
    items: [
      {
        textKey: "products",
        icon: <Inventory2Icon />,
        path: "/products",
      },
      {
        textKey: "stock",
        icon: <InventoryIcon />,
        path: "/stock",
      },
      {
        textKey: "systems",
        icon: <ScienceIcon />,
        path: "/systems",
      },
    ],
  },
{
    titleKey: "OPERATIONS",
    items: [
      {
        textKey: "vehicles",
        icon: <DirectionsCarIcon />,
        path: "/vehicles",
      },
      {
        textKey: "suppliers",
        icon: <LocalShippingIcon />,
        path: "/suppliers",
      },
      {
        textKey: "documents",
        icon: <DescriptionIcon />,
        path: "/documents",
      },
      {
        textKey: "calendar",
        icon: <CalendarMonthIcon />,
        path: "/calendar",
      },
    ],
  },
{
    titleKey: "TOOLS",
    items: [
      {
        textKey: "search",
        icon: <SearchIcon />,
        path: "/search",
      },
      {
        textKey: "calculator",
        icon: <CalculateIcon />,
        path: "/calculator",
      },
      {
        textKey: "reports",
        icon: <BarChartIcon />,
        path: "/reports",
      },
    ],
  },
{
    titleKey: "AI & AUTOMATION",
    items: [
      {
        textKey: "assistant",
        icon: <SmartToyIcon />,
        path: "/assistant",
      },
      {
        textKey: "automation",
        icon: <AutoAwesomeIcon />,
        path: "/automation",
      },
      {
        textKey: "settings",
        icon: <SettingsIcon />,
        path: "/company-settings",
      },
    ],
  },
  {
    titleKey: "SYSTEM",
    items: [
      {
        textKey: "backup",
        icon: <BackupIcon />,
        path: "/backup",
      },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuItemClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <>
      {/* Branding */}
      <Toolbar
        sx={{
          minHeight: `${sizes.headerHeight}px !important`,
          px: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          IDEAIL ERP
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("enterpriseManagementSystem")}
        </Typography>
      </Toolbar>

      <Divider />

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <Box key={section.titleKey} sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 0.5,
              color: "text.secondary",
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            {t(section.titleKey)}
          </Typography>
          <List sx={{ px: 1 }}>
            {section.items.map((item) => (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={handleMenuItemClick}
                sx={{
                  borderRadius: borderRadius.lg,
                  mb: 0.5,
                  mx: 1,
                  pl: 2,
                  transition: transitions.fast,
                  position: "relative",
                  "&.Mui-selected": {
                    pl: 2,
                    bgcolor: "primary.light",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.light",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      bgcolor: "primary.main",
                      borderRadius: borderRadius.full,
                    },
                  },
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateX(4px)",
                    boxShadow: shadows.elevated,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path
                        ? "primary.main"
                        : "text.secondary",
                    transition: transitions.fast,
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={t(item.textKey)}
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    fontSize: 14,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile menu button - shown on small screens */}
      <IconButton
        onClick={handleDrawerToggle}
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1000,
          display: { xs: "flex", md: "none" },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: sizes.sidebarWidth,
          flexShrink: 0,
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: sizes.sidebarWidth,
            boxSizing: "border-box",
            borderRight: 1,
            borderColor: "divider",
            transition: transitions.normal,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: sizes.sidebarWidth,
            boxSizing: "border-box",
            borderRight: 1,
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}