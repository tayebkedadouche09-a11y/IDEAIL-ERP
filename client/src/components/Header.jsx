import { useState, useMemo } from "react";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  InputBase,
  Breadcrumbs,
  Link,
  Badge,
  Avatar,
  useMediaQuery,
} from "@mui/material";

import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LanguageIcon from "@mui/icons-material/Language";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import BusinessIcon from "@mui/icons-material/Business";
import MenuIcon from "@mui/icons-material/Menu";

import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { sizes, borderRadius, transitions, spacing } from "../theme/designTokens";

// Route to page title mapping - using translation keys
const routeTitles = {
  "/": "dashboard",
  "/clients": "clients",
  "/employees": "employees",
  "/projects": "projects",
  "/invoices": "invoices",
  "/devis": "devis",
  "/expenses": "expenses",
  "/payments": "payments",
  "/cash-flow": "cashFlow",
  "/debts": "debts",
  "/products": "products",
  "/stock": "stock",
  "/systems": "systems",
  "/calculator": "calculator",
  "/reports": "reports",
  "/company-settings": "settings",
};

// Route to breadcrumb mapping - using translation keys
const routeBreadcrumbs = {
  "/": [],
  "/clients": [{ labelKey: "clients", href: "/clients" }],
  "/employees": [{ labelKey: "employees", href: "/employees" }],
  "/projects": [{ labelKey: "projects", href: "/projects" }],
  "/invoices": [{ labelKey: "invoices", href: "/invoices" }],
  "/devis": [{ labelKey: "devis", href: "/devis" }],
  "/expenses": [{ labelKey: "expenses", href: "/expenses" }],
  "/payments": [{ labelKey: "payments", href: "/payments" }],
  "/cash-flow": [{ labelKey: "cashFlow", href: "/cash-flow" }],
  "/debts": [{ labelKey: "debts", href: "/debts" }],
  "/products": [{ labelKey: "products", href: "/products" }],
  "/stock": [{ labelKey: "stock", href: "/stock" }],
  "/systems": [{ labelKey: "systems", href: "/systems" }],
  "/calculator": [{ labelKey: "calculator", href: "/calculator" }],
  "/reports": [{ labelKey: "reports", href: "/reports" }],
  "/company-settings": [{ labelKey: "settings", href: "/company-settings" }],
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [langAnchor, setLangAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  // Generate breadcrumbs from current route
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    const crumbs = routeBreadcrumbs[path] || [];
    return crumbs;
  }, [location.pathname]);

  // Get current page title
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    return t(routeTitles[path] || "dashboard");
  }, [location.pathname, t]);

  function openLanguage(event) {
    setLangAnchor(event.currentTarget);
  }

  function closeLanguage() {
    setLangAnchor(null);
  }

  function selectLanguage(lang) {
    changeLanguage(lang);
    closeLanguage();
  }

  function openUserMenu(event) {
    setUserAnchor(event.currentTarget);
  }

  function closeUserMenu() {
    setUserAnchor(null);
  }

  function openNotifications(event) {
    setNotifAnchor(event.currentTarget);
  }

  function closeNotifications() {
    setNotifAnchor(null);
  }

  function handleLogout() {
    closeUserMenu();
    logout();
    navigate("/login");
  }

  function handleChangePassword() {
    closeUserMenu();
    // TODO: Implement change password dialog
    alert(t("changePasswordFeatureComingSoon"));
  }

  function handleProfile() {
    closeUserMenu();
    // TODO: Implement profile page
    alert(t("profileFeatureComingSoon"));
  }

  function handleSettings() {
    closeUserMenu();
    navigate("/company-settings");
  }

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { xs: "100%", md: `calc(100% - ${sizes.sidebarWidth}px)` },
        ml: { xs: 0, md: `${sizes.sidebarWidth}px` },
        height: sizes.headerHeight,
        borderBottom: 1,
        borderColor: "divider",
        transition: transitions.normal,
        zIndex: (theme) => theme.zIndex.drawer,
      }}
    >
      <Toolbar sx={{ minHeight: `${sizes.headerHeight}px !important`, px: 2 }}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            onClick={() => {}}
            sx={{ mr: 1, display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Breadcrumbs and Page Title */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {breadcrumbs.length > 0 && (
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{
                display: { xs: "none", md: "block" },
                mb: 0.5,
              }}
            >
              <Link underline="hover" color="inherit" href="/">
                {t("dashboard")}
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <Typography key={index} color="text.primary" fontWeight="medium">
                  {t(crumb.labelKey)}
                </Typography>
              ))}
            </Breadcrumbs>
          )}
          <Typography
            variant="h5"
            fontWeight={600}
            color="text.primary"
            sx={{
              fontSize: { xs: 18, md: 22 },
            }}
          >
            {pageTitle}
          </Typography>
        </Box>

        {/* Global Search - Desktop only */}
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "action.hover",
              borderRadius: borderRadius.full,
              px: 2,
              py: 0.5,
              mr: 2,
            }}
          >
            <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder={t("search")}
              sx={{
                fontSize: 14,
                width: 200,
                "& input": {
                  py: 0.5,
                },
              }}
            />
          </Box>
        )}

        {/* Mobile Search */}
        {isMobile && (
          <IconButton sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>
        )}

        {/* Company Selector (UI only) */}
        <IconButton
          sx={{
            mr: 1,
            display: { xs: "none", sm: "flex" },
          }}
        >
          <BusinessIcon />
        </IconButton>

        {/* Notifications */}
        <IconButton onClick={openNotifications} sx={{ mr: 1 }}>
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={closeNotifications}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {t("notifications")}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={closeNotifications}>
            <Typography variant="body2">{t("noNewNotifications")}</Typography>
          </MenuItem>
        </Menu>

        {/* Theme Toggle */}
        <IconButton onClick={toggleTheme} sx={{ mr: 1 }} aria-label="Toggle theme">
          {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        {/* Language Switcher */}
        <IconButton onClick={openLanguage} sx={{ mr: 1 }}>
          <LanguageIcon />
        </IconButton>

        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={closeLanguage}
        >
          <MenuItem
            selected={language === "fr"}
            onClick={() => selectLanguage("fr")}
          >
            🇫🇷 {t("french")}
          </MenuItem>

          <MenuItem
            selected={language === "en"}
            onClick={() => selectLanguage("en")}
          >
            🇬🇧 {t("english")}
          </MenuItem>

          <MenuItem
            selected={language === "ar"}
            onClick={() => selectLanguage("ar")}
          >
            🇩🇿 {t("arabic")}
          </MenuItem>
        </Menu>

        {/* User Menu */}
        <IconButton onClick={openUserMenu}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {user?.full_name?.[0] || user?.username?.[0] || <AccountCircleIcon />}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={userAnchor}
          open={Boolean(userAnchor)}
          onClose={closeUserMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {user?.full_name || user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email} • {isAdmin ? t("admin") : t("user")}
            </Typography>
          </Box>

          <Divider />

          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("profile")}</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("settings")}</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleChangePassword}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("changePassword")}</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: "error.main" }}>{t("logout")}</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}