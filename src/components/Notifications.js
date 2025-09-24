import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../services/api";
import Navbar from "../components/Navbar";
import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Snackbar,
  Alert,
  Badge,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  NotificationsOff,
  MarkEmailRead,
  Refresh,
  Circle,
  Assignment,
  Warning,
  Info,
  CheckCircle,
  Campaign,
} from "@mui/icons-material";

// TabPanel
function TabPanel({ children, value, index }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ p: 1 }}>{children}</Box>}</div>;
}

// Notification List
function NotificationList({ notifications, loading, onMarkRead, getIcon, getColor, getTimeAgo }) {
  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (!notifications.length)
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <NotificationsOff sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography variant="h6" color="text.secondary">
          No notifications
        </Typography>
      </Box>
    );

  return (
    <List sx={{ p: 0 }}>
      {notifications.map((n, i) => (
        <Box key={n.id}>
          <ListItem
            sx={{
              flexDirection: "column",
              alignItems: "flex-start",
              backgroundColor: getColor(n.read),
              mb: 1,
              borderRadius: 2,
              p: 2,
            }}
          >
            <Box sx={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", flex: 1 }}>
                {!n.read && <Circle sx={{ fontSize: 8, color: "primary.main" }} />}
                <ListItemIcon sx={{ minWidth: 36 }}>{getIcon(n.message)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: n.read ? "normal" : "bold", wordBreak: "break-word" }}>
                      {n.message}
                    </Typography>
                  }
                  secondary={
                    <Chip
                      label={getTimeAgo(n.timestamp)}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5, fontSize: "0.75rem" }}
                    />
                  }
                />
              </Box>
              {!n.read && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onMarkRead(n.id)}
                  sx={{ ml: 1, flexShrink: 0 }}
                  startIcon={<MarkEmailRead />}
                >
                  Mark Read
                </Button>
              )}
            </Box>
          </ListItem>
        </Box>
      ))}
    </List>
  );
}

// Main Component
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id;

  useEffect(() => {
    loadNotifications();
  }, []);

  const showToast = (msg, sev = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(sev);
    setSnackbarOpen(true);
  };

  const loadNotifications = async () => {
    if (!userId) return showToast("User not found", "error");
    setLoading(true);
    try {
      const res = await getNotifications();
      const userNotifications = res.data.filter((n) => n.userId === userId);
      setNotifications(userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch {
      showToast("Error loading notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      showToast("Marked as read");
      loadNotifications();
    } catch {
      showToast("Error marking read", "error");
    }
  };

  const getIcon = (msg = "") => {
    msg = msg.toLowerCase();
    if (msg.includes("assigned") || msg.includes("task")) return <Assignment color="primary" />;
    if (msg.includes("verified") || msg.includes("completed")) return <CheckCircle color="success" />;
    if (msg.includes("error") || msg.includes("warning")) return <Warning color="warning" />;
    return <Info color="info" />;
  };

  const getColor = (read) => (read ? "background.paper" : "action.selected");

  const getTimeAgo = (ts) => {
    const diff = Math.floor((new Date() - new Date(ts)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const tabs = [
    { label: "All", count: notifications.length },
    { label: "Unread", count: unread.length },
    { label: "Read", count: read.length },
  ];

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: { xs: 2, sm: 0 } }}>
            <Badge badgeContent={unread.length} color="error">
              <NotificationsIcon sx={{ fontSize: 36, color: "primary.main" }} />
            </Badge>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stay updated with your tasks
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" onClick={loadNotifications} disabled={loading}>
              Refresh
            </Button>
            {unread.length > 0 && (
              <Button variant="contained" onClick={() => unread.forEach(n => handleMarkRead(n.id))}>
                Mark All Read
              </Button>
            )}
          </Box>
        </Box>

        {/* Tabs */}
        <Card elevation={2}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="fullWidth" textColor="primary" indicatorColor="primary">
            {tabs.map((t, i) => (
              <Tab key={i} label={<Badge badgeContent={t.count} color="primary">{t.label}</Badge>} />
            ))}
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <NotificationList notifications={notifications} loading={loading} onMarkRead={handleMarkRead} getIcon={getIcon} getColor={getColor} getTimeAgo={getTimeAgo} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <NotificationList notifications={unread} loading={loading} onMarkRead={handleMarkRead} getIcon={getIcon} getColor={getColor} getTimeAgo={getTimeAgo} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <NotificationList notifications={read} loading={loading} onMarkRead={handleMarkRead} getIcon={getIcon} getColor={getColor} getTimeAgo={getTimeAgo} />
          </TabPanel>
        </Card>

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <Card sx={{ textAlign: "center", p: 4, mt: 2 }}>
            <NotificationsOff sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              No Notifications
            </Typography>
          </Card>
        )}
      </Container>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
