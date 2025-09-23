import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  getMemos,
  getUsers,
  updateMemo,
  sendNotification,
  createMemo,
} from "../services/api";
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Stack,
  Grid,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  Add,
  Verified,
  Pending,
  Schedule,
  Person,
  Work,
  PriorityHigh,
  Notifications,
  Refresh,
  Edit,
  Visibility,
} from "@mui/icons-material";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Admin() {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newMemo, setNewMemo] = useState({
    title: "",
    description: "",
    skillType: "",
    priority: "",
    deadline: "",
    assignedTo: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const memosRes = await getMemos();
      setMemos(memosRes.data);

      const usersRes = await getUsers();
      const heads = usersRes.data.filter((u) => u.role === "Head");
      setUsers(heads);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const adminVerify = async (memoId) => {
    try {
      await updateMemo(memoId, { adminVerified: true });
      const memo = memos.find((m) => m.id === memoId);
      
      // Send notifications to assigned staff
      if (memo.staffAssigned && memo.staffAssigned.length > 0) {
        await Promise.all(
          memo.staffAssigned.map(async (staff) => {
            await sendNotification(staff.id, `Admin has verified task "${memo.title}"`);
          })
        );
      }
      
      loadData();
    } catch (error) {
      console.error("Error verifying memo:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMemo({ ...newMemo, [name]: value });
  };

  const handleCreateMemo = async () => {
    if (!newMemo.title || !newMemo.description || !newMemo.assignedTo) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const memoToCreate = {
        ...newMemo,
        status: "Pending",
        staffAssigned: [],
        adminVerified: false,
        createdAt: new Date().toISOString(),
      };

      await createMemo(memoToCreate);
      
      // Send notification to assigned department head
      await sendNotification(
        newMemo.assignedTo,
        `New memo assigned: ${newMemo.title}`
      );

      // Reset form
      setNewMemo({
        title: "",
        description: "",
        skillType: "",
        priority: "",
        deadline: "",
        assignedTo: "",
      });

      setActiveTab(1); // Switch to memos tab
      loadData();
    } catch (error) {
      console.error("Error creating memo:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "error";
      case "Medium": return "warning";
      case "Low": return "success";
      default: return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified": return "success";
      case "In Progress": return "warning";
      case "Completed": return "info";
      default: return "default";
    }
  };

  const pendingVerificationMemos = memos.filter(memo => 
    memo.status === "Verified" && !memo.adminVerified
  );

  const allMemos = memos;

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Admin Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Welcome back, {user?.name}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {memos.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Memos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {pendingVerificationMemos.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Verification
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {memos.filter(m => m.adminVerified).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verified Memos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department Heads
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper elevation={2} sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Add />} label="Create Memo" />
            <Tab 
              icon={
                <Badge badgeContent={pendingVerificationMemos.length} color="error">
                  <Visibility />
                </Badge>
              } 
              label="Manage Memos" 
            />
          </Tabs>

          {/* Create Memo Tab */}
          <TabPanel value={activeTab} index={0}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Add sx={{ mr: 1 }} />
                  Create New Memo
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Memo Title"
                      name="title"
                      value={newMemo.title}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      placeholder="Enter a clear and descriptive title"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      name="description"
                      value={newMemo.description}
                      onChange={handleInputChange}
                      multiline
                      rows={4}
                      fullWidth
                      required
                      placeholder="Provide detailed information about the memo requirements"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Skill Type"
                      name="skillType"
                      value={newMemo.skillType}
                      onChange={handleInputChange}
                      fullWidth
                      placeholder="e.g., Technical, Medical, Administrative"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority Level</InputLabel>
                      <Select
                        name="priority"
                        value={newMemo.priority}
                        onChange={handleInputChange}
                        label="Priority Level"
                      >
                        <MenuItem value=""><em>Select Priority</em></MenuItem>
                        <MenuItem value="Low">Low Priority</MenuItem>
                        <MenuItem value="Medium">Medium Priority</MenuItem>
                        <MenuItem value="High">High Priority</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="date"
                      name="deadline"
                      value={newMemo.deadline}
                      onChange={handleInputChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      label="Deadline"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Assign to Department Head</InputLabel>
                      <Select
                        name="assignedTo"
                        value={newMemo.assignedTo}
                        onChange={handleInputChange}
                        label="Assign to Department Head"
                      >
                        <MenuItem value=""><em>Select Department Head</em></MenuItem>
                        {users.map((u) => (
                          <MenuItem key={u.id} value={u.id}>
                            <Box>
                              <Typography>{u.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {u.department || 'General Department'}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={handleCreateMemo}
                      startIcon={<Add />}
                      sx={{ minWidth: 200 }}
                    >
                      Create Memo
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Manage Memos Tab */}
          <TabPanel value={activeTab} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : allMemos.length === 0 ? (
              <Alert severity="info">No memos available. Create your first memo to get started.</Alert>
            ) : (
              <Stack spacing={3}>
                {allMemos.map((memo) => (
                  <Fade in={true} key={memo.id}>
                    <Card elevation={2}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {memo.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              icon={<PriorityHigh />}
                              label={memo.priority || "Not Set"} 
                              size="small"
                              color={getPriorityColor(memo.priority)}
                            />
                            <Chip 
                              label={memo.status || "Pending"} 
                              size="small"
                              color={getStatusColor(memo.status)}
                            />
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" paragraph>
                          {memo.description}
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Work fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>Skill:</strong> {memo.skillType || "Not specified"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Schedule fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>Deadline:</strong> {memo.deadline ? new Date(memo.deadline).toLocaleDateString() : "Not set"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>Dept Verified:</strong> {memo.status === "Verified" ? "Yes" : "No"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Verified fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>Admin Verified:</strong> {memo.adminVerified ? "Yes" : "No"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        {!memo.adminVerified && memo.status === "Verified" && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="success.main">
                              Ready for admin verification
                            </Typography>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<Verified />}
                              onClick={() => adminVerify(memo.id)}
                            >
                              Verify Memo
                            </Button>
                          </Box>
                        )}

                        {(memo.status !== "Verified" || !memo.adminVerified) && (
                          <Alert severity="info" icon={<Pending />}>
                            Evaluation visible only after Department Head & Admin verification
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </Stack>
            )}
          </TabPanel>
        </Paper>
      </Container>
    </>
  );
}