import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
  Fade,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  useTheme,
  alpha
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Login,
  Security,
  AdminPanelSettings,
  ManageAccounts,
  Badge,
  ContentCopy,
  CheckCircle
} from "@mui/icons-material";

const fallbackUsers = [
  { id: 1, name: "Admin User", email: "admin@test.com", password: "admin123", role: "Admin", department: "All" },
  { id: 2, name: "Head Cardiology", email: "head1@test.com", password: "head123", role: "Head", department: "Cardiology" },
  { id: 3, name: "Staff Alice", email: "staff1@test.com", password: "staff123", role: "Staff", department: "Cardiology", points: 5, rating: 4, badges: ["Efficient"] },
  { id: 4, name: "Staff Bob", email: "staff2@test.com", password: "staff123", role: "Staff", department: "Cardiology", points: 3, rating: 5, badges: [] }
];

const getRoleIcon = (role) => {
  switch (role) {
    case "Admin": return <AdminPanelSettings color="primary" />;
    case "Head": return <ManageAccounts color="secondary" />;
    case "Staff": return <Badge color="success" />;
    default: return <Security />;
  }
};

const getRoleColor = (role) => {
  switch (role) {
    case "Admin": return "primary";
    case "Head": return "secondary";
    case "Staff": return "success";
    default: return "default";
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [demoOpen, setDemoOpen] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);

  const theme = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      showSnackbar("Please fill in all fields", "error");
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showSnackbar("Please enter a valid email address", "error");
      setLoading(false);
      return;
    }

    try {
      let user = null;
      try {
        user = await loginUser(email, password);
      } catch {
        user = fallbackUsers.find(u => u.email === email && u.password === password);
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        showSnackbar(`Welcome back, ${user.name}!`, "success");

        setTimeout(() => {
          if (user.role === "Admin") navigate("/admin");
          else if (user.role === "Head") navigate("/head");
          else if (user.role === "Staff") navigate("/staff");
          else navigate("/");
        }, 1000);
      } else {
        showSnackbar("Invalid email or password", "error");
      }
    } catch (error) {
      showSnackbar("An unexpected error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const copyCredentials = (email, password, id) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setCopiedItem(id);
    showSnackbar("Credentials copied to clipboard!", "info");
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const quickLogin = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setDemoOpen(false);
    showSnackbar(`Credentials for ${user.role} role loaded`, "info");
  };

  return (
    <Box sx={{ 
      position: "relative", 
      width: "100%", 
      minHeight: "100vh", 
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {/* Enhanced Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          top: 0,
          left: 0,
          zIndex: -2,
          filter: "brightness(0.7)"
        }}
        src="https://ntachzleqbmwkc0i.public.blob.vercel-storage.com/9574129-uhd_4096_2160_25fps.mp4"
      />

      {/* Gradient Overlay */}
      <Box sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `transparent`,
        zIndex: -1
      }} />

      <Container maxWidth="sm">
        <Fade in timeout={1000}>
          <Paper
            elevation={24}
            sx={{
              position: "relative",
              mx: "auto",
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              backdropFilter: "blur(20px)",
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `skyblue`,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4
              }
            }}
          >
            {/* Header Section */}
            <Box textAlign="center" sx={{ mb: 2 }}>
              <Box sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: `skyblue`,
                mb: 2
              }}>
                <Login sx={{ fontSize: 40, color: "white" }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Sign in to access your dashboard
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "rgba(255,255,255,0.8)" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main }
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
                  "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main }
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "rgba(255,255,255,0.8)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={togglePasswordVisibility} 
                        sx={{ color: "rgba(255,255,255,0.8)" }}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#fff",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main }
                  },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.8)" },
                  "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.primary.main }
                }}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                type="submit"
                disabled={loading}
                sx={{
                  height: 48,
                  fontSize: "1.1rem",
                  background: `skyblue`,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: theme.shadows[8]
                  },
                  transition: "all 0.2s"
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
              </Button>
            </Box>

            {/* Demo Access Section */}
            <Box textAlign="center">
              <Button 
                variant="outlined" 
                sx={{ 
                  color: "#fff", 
                  borderColor: "rgba(255,255,255,0.5)",
                  "&:hover": {
                    borderColor: "#fff",
                    backgroundColor: "rgba(255,255,255,0.1)"
                  }
                }} 
                onClick={() => setDemoOpen(true)}
                startIcon={<Security />}
              >
                Demo Access
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Container>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ 
            width: "100%",
            boxShadow: theme.shadows[8]
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Enhanced Demo Dialog */}
      <Dialog 
        open={demoOpen} 
        onClose={() => setDemoOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `transparent`,
          color: "white",
          textAlign: "center"
        }}>
          <Security sx={{ mr: 1, verticalAlign: "middle" }} />
          Demo Credentials
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <List dense>
            {fallbackUsers.map((user, index) => (
              <Box key={user.id}>
                <ListItem sx={{ py: 2, px: 3 }}>
                  <ListItemIcon>
                    {getRoleIcon(user.role)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Chip 
                          label={user.role} 
                          size="small" 
                          color={getRoleColor(user.role)}
                          variant="outlined"
                        />
                        {user.department && (
                          <Chip 
                            label={user.department} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Email: {user.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Password: {user.password}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => copyCredentials(user.email, user.password, user.id)}
                      startIcon={copiedItem === user.id ? <CheckCircle /> : <ContentCopy />}
                    >
                      {copiedItem === user.id ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => quickLogin(user)}
                    >
                      Use
                    </Button>
                  </Box>
                </ListItem>
                {index < fallbackUsers.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDemoOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}