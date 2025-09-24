import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Link,
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
  alpha,
} from "@mui/material";
import {
  NavigateBefore,
  Logout,
  Person,
  Home,
  Notifications,
  Settings,
  Dashboard,
  Menu as MenuIcon,
  KeyboardArrowDown,
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
          elevation={2}
          sx={{
            background: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            height: { xs: 60, md: 68 }
          }}
        >
          <Container maxWidth="xl" sx={{ height: '100%' }}>
            {/* Main Toolbar */}
            <Toolbar 
              sx={{ 
                minHeight: '100% !important',
                height: '100%',
                px: { xs: 1, sm: 2 }
              }}
              disableGutters
            >
              {/* Logo/Brand */}
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                <MedicalServices sx={{ 
                  mr: 1.5, 
                  fontSize: { xs: 26, sm: 28 },
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                }} />
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
                      fontWeight: 700,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      background: "linear-gradient(45deg, #fff 30%, #e3f2fd 90%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      letterSpacing: "-0.5px",
                      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    Hospital Memo
                  </Typography>
                </Link>
              </Box>

              {/* Desktop Navigation */}
              {user && (
                <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5 }}>
                  {/* Quick Actions */}
                  <Button
                    color="inherit"
                    onClick={() => navigate(getDashboardRoute())}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)'
                      }
                    }}
                  >
                    <Dashboard sx={{ fontSize: 20, mr: 1 }} />
                    Dashboard
                  </Button>

                  {/* Notifications */}
                  <IconButton 
                    color="inherit" 
                    sx={{ 
                      mx: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={notificationCount} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 16,
                          minWidth: 16,
                        }
                      }}
                    >
                      <Notifications sx={{ fontSize: 22 }} />
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
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          border: '2px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    endIcon={
                      <KeyboardArrowDown 
                        sx={{ 
                          fontSize: 18,
                          transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)', 
                          transition: 'transform 0.2s ease-in-out' 
                        }} 
                      />
                    }
                    sx={{
                      borderRadius: 3,
                      px: 1.5,
                      py: 0.75,
                      ml: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)'
                      },
                      '& .MuiButton-startIcon': {
                        mr: 1
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <Typography variant="subtitle2" sx={{ lineHeight: 1, fontSize: '0.85rem' }}>
                        {user.name}
                      </Typography>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role)}
                        variant="filled"
                        sx={{ 
                          height: 18, 
                          fontSize: '0.65rem', 
                          mt: 0.25,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Button>

                  {/* User Menu Dropdown */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    TransitionComponent={Fade}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      elevation: 4,
                      sx: {
                        mt: 1,
                        minWidth: 180,
                        borderRadius: 2,
                        overflow: 'visible',
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 14,
                          width: 10,
                          height: 10,
                          bgcolor: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                        }
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={handleClose}
                      sx={{ py: 1, fontSize: '0.9rem' }}
                    >
                      <Person sx={{ mr: 1.5, fontSize: 20 }} />
                      Profile
                    </MenuItem>
                    <MenuItem 
                      onClick={handleClose}
                      sx={{ py: 1, fontSize: '0.9rem' }}
                    >
                      <Settings sx={{ mr: 1.5, fontSize: 20 }} />
                      Settings
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem 
                      onClick={logout}
                      sx={{ py: 1, fontSize: '0.9rem' }}
                    >
                      <Logout sx={{ mr: 1.5, fontSize: 20 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              )}

              {/* Mobile Menu Button */}
              {user && (
                <Box sx={{ display: { xs: "flex", md: "none" } }}>
                  <IconButton 
                    color="inherit" 
                    onClick={handleMobileMenuOpen}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <MenuIcon />
                  </IconButton>

                  <Menu
                    anchorEl={mobileMenuAnchor}
                    open={Boolean(mobileMenuAnchor)}
                    onClose={handleClose}
                    PaperProps={{
                      sx: {
                        mt: 0.5,
                        minWidth: 200,
                        borderRadius: 2,
                      }
                    }}
                  >
                    <MenuItem 
        onClick={() => { navigate("/notifications"); handleClose(); }}
        sx={{ py: 1 }}
      >
        <Notifications sx={{ mr: 2, fontSize: 20 }} />
        Notifications
        <Badge badgeContent={notificationCount} color="error" sx={{ ml: 'auto' }} />
      </MenuItem>
                    <Divider />
                    <MenuItem 
                      onClick={logout}
                      sx={{ py: 1 }}
                    >
                      <Logout sx={{ mr: 2, fontSize: 20 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Toolbar>
          </Container>

          {/* Breadcrumbs Section */}
          {pathnames.length > 0 && (
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 1,
                backgroundColor: '#62c5ecff',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: 40
              }}
            >
              {/* Back button */}
              <Button
                onClick={() => window.history.back()}
                startIcon={<NavigateBefore sx={{ color: 'white' }} />}
                sx={{ 
                  color: 'white', 
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  px: 1.5,
                  py: 0.5,
                  minWidth: 'auto',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Back
              </Button>

              <Divider orientation="vertical" flexItem sx={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />

              {/* Current page */}
              <Typography 
                sx={{ 
                  color: 'white', 
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  textTransform: 'capitalize'
                }}
              >
                {pathnames[pathnames.length - 1].replace(/-/g, ' ')}
              </Typography>
            </Box>
          )}
        </AppBar>
      </HideOnScroll>
    </>
  );
}
