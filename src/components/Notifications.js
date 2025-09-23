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

// TabPanel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

// Notification List Component
function NotificationList({ notifications, loading, onMarkRead, getNotificationIcon, getNotificationColor, getTimeAgo }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!notifications.length) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <NotificationsOff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">No notifications found</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 0 }}>
      {notifications.map((notification, index) => (
        <Box key={notification.id}>
          <ListItem
            sx={{
              backgroundColor: getNotificationColor(notification.read),
              borderLeft: notification.read ? '4px solid transparent' : '4px solid',
              borderLeftColor: notification.read ? 'transparent' : 'primary.main',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            <ListItemIcon>{getNotificationIcon(notification.message)}</ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {!notification.read && <Circle sx={{ fontSize: 8, color: 'primary.main' }} />}
                  <Typography
                    variant="body1"
                    component="span"
                    sx={{ fontWeight: notification.read ? 'normal' : 'bold', color: 'text.primary' }}
                  >
                    {notification.message}
                  </Typography>
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={getTimeAgo(notification.timestamp)} size="small" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">{new Date(notification.timestamp).toLocaleString()}</Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              {!notification.read && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={() => onMarkRead(notification.id)}
                  sx={{ padding: '2px 6px' }}
                >
                  Mark Read
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>
          {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
        </Box>
      ))}
    </List>
  );
}

// Main Notifications Component
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

  const loadNotifications = async () => {
    if (!userId) {
      showToast("User not found", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await getNotifications();
      const userNotifications = res.data.filter((n) => n.userId === userId);
      const sortedNotifications = userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      showToast("Error loading notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      showToast("Notification marked as read");
      loadNotifications();
    } catch {
      showToast("Error marking notification as read", "error");
    }
  };

  const getNotificationIcon = (message = "") => {
    message = message.toLowerCase();
    if (message.includes("assigned") || message.includes("task")) return <Assignment color="primary" />;
    if (message.includes("verified") || message.includes("completed")) return <CheckCircle color="success" />;
    if (message.includes("error") || message.includes("warning")) return <Warning color="warning" />;
    return <Info color="info" />;
  };

  const getNotificationColor = (read) => (read ? 'background.paper' : 'action.selected');

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notificationTime.toLocaleDateString();
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const notificationTabs = [
    { label: "All", count: notifications.length, icon: <NotificationsIcon /> },
    { label: "Unread", count: unreadNotifications.length, icon: <NotificationsActive /> },
    { label: "Read", count: readNotifications.length, icon: <NotificationsOff /> },
  ];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={unreadNotifications.length} color="error" overlap="circular">
              <NotificationsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Badge>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">Notifications</Typography>
              <Typography variant="h6" color="text.secondary">Stay updated with your task activities</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={loadNotifications} disabled={loading}>Refresh</Button>
            {unreadNotifications.length > 0 && (
              <Button variant="contained" startIcon={<MarkEmailRead />} onClick={() => {}} disabled={loading}>
                Mark All Read
              </Button>
            )}
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <NotificationsActive sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">{notifications.length}</Typography>
                <Typography color="text.secondary">Total Notifications</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Campaign sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="warning.main">{unreadNotifications.length}</Typography>
                <Typography color="text.secondary">Unread Notifications</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="success.main">{readNotifications.length}</Typography>
                <Typography color="text.secondary">Read Notifications</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card elevation={2}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="fullWidth">
            {notificationTabs.map((tab, index) => (
              <Tab key={index} label={<Badge badgeContent={tab.count} color={index === 1 ? "error" : "primary"} max={99}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{tab.icon} {tab.label}</Box></Badge>} />
            ))}
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <NotificationList
              notifications={notifications}
              loading={loading}
              onMarkRead={handleMarkRead}
              getNotificationIcon={getNotificationIcon}
              getNotificationColor={getNotificationColor}
              getTimeAgo={getTimeAgo}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <NotificationList
              notifications={unreadNotifications}
              loading={loading}
              onMarkRead={handleMarkRead}
              getNotificationIcon={getNotificationIcon}
              getNotificationColor={getNotificationColor}
              getTimeAgo={getTimeAgo}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <NotificationList
              notifications={readNotifications}
              loading={loading}
              onMarkRead={handleMarkRead}
              getNotificationIcon={getNotificationIcon}
              getNotificationColor={getNotificationColor}
              getTimeAgo={getTimeAgo}
            />
          </TabPanel>
        </Card>

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <Card elevation={2} sx={{ textAlign: 'center', p: 6 }}>
            <NotificationsOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>No Notifications</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>You're all caught up! New notifications will appear here.</Typography>
            <Button variant="contained" onClick={loadNotifications}>Check Again</Button>
          </Card>
        )}
      </Container>

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>{snackbarMessage}</Alert>
      </Snackbar>
    </>
  );
}
