import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Link,
  Breadcrumbs,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Divider,
  Fade,
  useScrollTrigger,
  Slide,
  Container,
} from "@mui/material";
import {
  NavigateNext,
  Logout,
  Person,
  Home,
  Notifications,
  Settings,
  Dashboard,
  Menu as MenuIcon,
  ChevronLeft,
  MedicalServices,
} from "@mui/icons-material";
import { useState } from "react";

// Hide on scroll functionality
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
    handleClose();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  // Generate breadcrumbs based on the current path
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Get user's dashboard route based on role
  const getDashboardRoute = () => {
    if (!user) return "/";
    switch (user.role) {
      case "Admin": return "/admin";
      case "Head": return "/head";
      case "Staff": return "/staff";
      default: return "/";
    }
  };

  // Notification count (mock data - replace with real data)
  const notificationCount = 3;

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "error";
      case "Head": return "warning";
      case "Staff": return "success";
      default: return "default";
    }
  };

  const getAvatarColor = (role) => {
    switch (role) {
      case "Admin": return "#f44336";
      case "Head": return "#ff9800";
      case "Staff": return "#4caf50";
      default: return "#9e9e9e";
    }
  };

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="sticky"
          color="primary"
          elevation={4}
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
            mb: 2,
          }}
        >
          <Container maxWidth="xl">
            {/* Main Toolbar */}
            <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
              {/* Logo/Brand */}
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                <MedicalServices sx={{ mr: 1, fontSize: 32 }} />
                <Link
                  component={RouterLink}
                  to="/"
                  underline="none"
                  color="inherit"
                >
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontWeight: "bold",
                      background: "linear-gradient(45deg, #fff 30%, #e3f2fd 90%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    Hospital Memo System
                  </Typography>
                </Link>
              </Box>

              {/* Desktop Navigation */}
              {user && (
                <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
                  {/* Notifications */}
                  <IconButton color="inherit" sx={{ mr: 1 }}>
                    <Badge badgeContent={notificationCount} color="error">
                      <Notifications />
                    </Badge>
                  </IconButton>

                  {/* User Menu */}
                  <Button
                    color="inherit"
                    onClick={handleMenuOpen}
                    startIcon={
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: getAvatarColor(user.role),
                          fontSize: '0.875rem'
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    endIcon={<ChevronLeft sx={{ transform: anchorEl ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
                        {user.name}
                      </Typography>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role)}
                        variant="filled"
                        sx={{ height: 20, fontSize: '0.7rem', mt: 0.5 }}
                      />
                    </Box>
                  </Button>

                  {/* User Menu Dropdown */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    TransitionComponent={Fade}
                    PaperProps={{
                      elevation: 3,
                      sx: {
                        mt: 1.5,
                        minWidth: 200,
                        borderRadius: 2,
                      }
                    }}
                  >
                    <MenuItem onClick={handleClose}>
                      <Person sx={{ mr: 2 }} />
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <Settings sx={{ mr: 2 }} />
                      Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={logout}>
                      <Logout sx={{ mr: 2 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              )}

              {/* Mobile Menu Button */}
              {user && (
                <Box sx={{ display: { xs: "flex", md: "none" } }}>
                  <IconButton color="inherit" onClick={handleMobileMenuOpen}>
                    <MenuIcon />
                  </IconButton>

                  <Menu
                    anchorEl={mobileMenuAnchor}
                    open={Boolean(mobileMenuAnchor)}
                    onClose={handleClose}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 200,
                        borderRadius: 2,
                      }
                    }}
                  >
                    <MenuItem onClick={() => { navigate('/'); handleClose(); }}>
                      <Home sx={{ mr: 2 }} />
                      Home
                    </MenuItem>
                    <MenuItem onClick={() => { navigate(getDashboardRoute()); handleClose(); }}>
                      <Dashboard sx={{ mr: 2 }} />
                      Dashboard
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={logout}>
                      <Logout sx={{ mr: 2 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Toolbar>
             
           {/* Breadcrumbs with Back button */}
{pathnames.length > 0 && (
  <Box
    sx={{
      px: 2,
      py: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}
  >
    {/* Back button */}
    <Button
      onClick={() => window.history.back()}
      startIcon={<ChevronLeft sx={{ color: 'white' }} />}
      sx={{ color: 'white', textTransform: 'none' }}
    >
      Back
    </Button>

    {/* Current page */}
    <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
      {pathnames[pathnames.length - 1].charAt(0).toUpperCase() + pathnames[pathnames.length - 1].slice(1)}
    </Typography>
  </Box>
)}

          </Container>
        </AppBar>
      </HideOnScroll>
    </>
  );
}
