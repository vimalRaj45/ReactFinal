import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import {
  getMemos,
  getUsers,
  updateMemo,
  updateUser,
  sendNotification,
} from "../services/api";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Snackbar,
  Alert,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Badge,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  Assignment,
  VerifiedUser,
  Assessment,
  Notifications,
  PersonAdd,
  Schedule,
  PriorityHigh,
  Work,
  Star,
  EmojiEvents,
  Refresh,
  CheckCircle,
  PendingActions,
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
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function Head() {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState({});
  const [staffEvaluation, setStaffEvaluation] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const memosRes = await getMemos();
      const deptMemos = memosRes.data.filter((m) => m.assignedTo === user.id);
      setMemos(deptMemos);

      const usersRes = await getUsers();
      const deptStaff = usersRes.data.filter(
        (u) => u.role === "Staff" && u.department === user.department
      );
      setUsers(deptStaff);
    } catch (err) {
      console.error("Error loading data:", err);
      showToast("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const assignStaff = async (memoId) => {
    const staffId = selectedStaff[memoId];
    if (!staffId) return showToast("Please select a staff to assign.", "error");

    const staffObject = users.find((s) => s.id.toString() === staffId.toString());
    if (!staffObject) return showToast("Staff not found.", "error");

    try {
      await updateMemo(memoId, { staffAssigned: [staffObject] });
      const memoTitle = memos.find((m) => m.id === memoId)?.title || "";
      await sendNotification(
        staffObject.id,
        `You have been assigned a new task: "${memoTitle}"`
      );

      showToast(`Task assigned to ${staffObject.name}`);
      setSelectedStaff({ ...selectedStaff, [memoId]: null });
      loadData();
    } catch (error) {
      showToast("Error assigning staff", "error");
    }
  };

  const verifyTask = async (memoId) => {
    try {
      await updateMemo(memoId, { status: "Verified" });
      const memo = memos.find((m) => m.id === memoId);

      if (memo.staffAssigned && memo.staffAssigned.length > 0) {
        await Promise.all(
          memo.staffAssigned.map(async (s) => {
            await sendNotification(
              s.id,
              `Your task "${memo.title}" has been verified by Dept Head`
            );
          })
        );
      }

      showToast("Task verified successfully!");
      loadData();
    } catch (error) {
      showToast("Error verifying task", "error");
    }
  };

  const handleEvaluationChange = (memoId, staffId, field, value) => {
    setStaffEvaluation((prev) => ({
      ...prev,
      [memoId]: {
        ...prev[memoId],
        [staffId]: {
          ...prev[memoId]?.[staffId],
          [field]: value,
        },
      },
    }));
  };

  const submitEvaluation = async (memoId, staffId) => {
    const evaluation = staffEvaluation[memoId]?.[staffId];
    if (!evaluation) return showToast("Please fill evaluation details.", "error");

    try {
      const memo = memos.find((m) => m.id === memoId);

      const updatedStaff = (memo.staffAssigned || []).map((s) =>
        s.id === staffId
          ? {
              ...s,
              points: Number(evaluation.points) || 0,
              rating: Number(evaluation.rating) || 0,
              badges: evaluation.badges
                ? evaluation.badges.split(",").map((b) => b.trim())
                : [],
            }
          : s
      );

      await updateMemo(memoId, { staffAssigned: updatedStaff });

      const userToUpdate = users.find((u) => u.id === staffId);
      if (userToUpdate) {
        const updatedUser = {
          ...userToUpdate,
          points: Number(evaluation.points) || 0,
          rating: Number(evaluation.rating) || 0,
          badges: evaluation.badges
            ? evaluation.badges.split(",").map((b) => b.trim())
            : [],
        };
        await updateUser(staffId, updatedUser);
      }

      await sendNotification(
        staffId,
        `Your task "${memo.title}" has been evaluated. Points: ${evaluation.points}, Rating: ${evaluation.rating}`
      );

      showToast("Evaluation submitted successfully!");
      loadData();
    } catch (error) {
      showToast("Error submitting evaluation", "error");
    }
  };

  const canAssign = (memo) => {
    if (!memo.staffAssigned || memo.staffAssigned.length === 0) return true;
    if (!memo.deadline) return true;
    const deadline = new Date(memo.deadline);
    const today = new Date();
    return today > deadline;
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
      case "In Progress": return "info";
      case "Completed": return "secondary";
      default: return "default";
    }
  };

  const pendingMemos = memos.filter(memo => memo.status !== "Verified");
  const verifiedMemos = memos.filter(memo => memo.status === "Verified");

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Department Head Panel
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {user.department} Department • Welcome, {user.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Badge badgeContent={memos.filter(m => m.status !== "Verified").length} color="error">
              <Button
                variant="contained"
                component={Link}
                to="/notifications"
                startIcon={<Notifications />}
              >
                Notifications
              </Button>
            </Badge>
          </Box>
        </Box>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {memos.length}
                </Typography>
                <Typography color="text.secondary">Total Memos</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <PendingActions sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {pendingMemos.length}
                </Typography>
                <Typography color="text.secondary">Pending Verification</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {verifiedMemos.length}
                </Typography>
                <Typography color="text.secondary">Verified Memos</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <PersonAdd sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {users.length}
                </Typography>
                <Typography color="text.secondary">Staff Members</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card elevation={2}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Assignment />} label="All Memos" />
            <Tab icon={<PendingActions />} label={`Pending (${pendingMemos.length})`} />
            <Tab icon={<VerifiedUser />} label={`Verified (${verifiedMemos.length})`} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <MemoList 
              memos={memos} 
              loading={loading}
              users={users}
              selectedStaff={selectedStaff}
              setSelectedStaff={setSelectedStaff}
              staffEvaluation={staffEvaluation}
              handleEvaluationChange={handleEvaluationChange}
              assignStaff={assignStaff}
              verifyTask={verifyTask}
              submitEvaluation={submitEvaluation}
              canAssign={canAssign}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <MemoList 
              memos={pendingMemos} 
              loading={loading}
              users={users}
              selectedStaff={selectedStaff}
              setSelectedStaff={setSelectedStaff}
              staffEvaluation={staffEvaluation}
              handleEvaluationChange={handleEvaluationChange}
              assignStaff={assignStaff}
              verifyTask={verifyTask}
              submitEvaluation={submitEvaluation}
              canAssign={canAssign}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <MemoList 
              memos={verifiedMemos} 
              loading={loading}
              users={users}
              selectedStaff={selectedStaff}
              setSelectedStaff={setSelectedStaff}
              staffEvaluation={staffEvaluation}
              handleEvaluationChange={handleEvaluationChange}
              assignStaff={assignStaff}
              verifyTask={verifyTask}
              submitEvaluation={submitEvaluation}
              canAssign={canAssign}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
        </Card>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

// Separate component for memo list for better organization
function MemoList({ 
  memos, 
  loading, 
  users, 
  selectedStaff, 
  setSelectedStaff, 
  staffEvaluation, 
  handleEvaluationChange, 
  assignStaff, 
  verifyTask, 
  submitEvaluation, 
  canAssign,
  getPriorityColor,
  getStatusColor 
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (memos.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No memos available in this category.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {memos.map((memo) => (
        <Card key={memo.id} elevation={1} sx={{ '&:hover': { elevation: 4 } }}>
          <CardContent>
            {/* Memo Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {memo.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip 
                    icon={<PriorityHigh />}
                    label={memo.priority || "Not Set"} 
                    size="small"
                    color={getPriorityColor(memo.priority)}
                  />
                  <Chip 
                    icon={memo.status === "Verified" ? <CheckCircle /> : <PendingActions />}
                    label={memo.status || "Pending"} 
                    size="small"
                    color={getStatusColor(memo.status)}
                  />
                  {memo.skillType && (
                    <Chip icon={<Work />} label={memo.skillType} size="small" variant="outlined" />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Memo Details */}
            <Typography variant="body2" color="text.secondary" paragraph>
              {memo.description}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
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
                  <VerifiedUser fontSize="small" color="action" />
                  <Typography variant="body2">
                    <strong>Admin Verified:</strong> {memo.adminVerified ? "Yes" : "No"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Staff Assignment Section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAdd /> Staff Assignment
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }} size="small">
                  <InputLabel>Select Staff Member</InputLabel>
                  <Select
                    value={selectedStaff[memo.id] || ""}
                    onChange={(e) =>
                      setSelectedStaff({ ...selectedStaff, [memo.id]: e.target.value })
                    }
                    disabled={!canAssign(memo)}
                    label="Select Staff Member"
                  >
                    {users.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          {s.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => assignStaff(memo.id)}
                  disabled={!canAssign(memo)}
                  size="small"
                >
                  {canAssign(memo) ? "Assign Staff" : "Already Assigned"}
                </Button>
              </Box>
            </Box>

            {/* Assigned Staff */}
            {(memo.staffAssigned || []).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Assigned Staff:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(memo.staffAssigned || []).map((s) => (
                    <Chip
                      key={s.id}
                      avatar={<Avatar>{s.name?.charAt(0).toUpperCase()}</Avatar>}
                      label={s.name}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Verify Task Button */}
            {memo.status !== "Verified" && (memo.staffAssigned || []).length > 0 && (
              <Button
                variant="contained"
                color="success"
                startIcon={<VerifiedUser />}
                onClick={() => verifyTask(memo.id)}
                sx={{ mb: 2 }}
                size="small"
              >
                Verify Task Completion
              </Button>
            )}

            {/* Evaluation Section */}
            {memo.status === "Verified" && memo.adminVerified && (memo.staffAssigned || []).length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment /> Staff Evaluation
                </Typography>
                <Stack spacing={2}>
                  {(memo.staffAssigned || []).map((s) => (
                    <Paper key={s.id} sx={{ p: 2, backgroundColor: 'grey.50' }} variant="outlined">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle1">{s.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {s.points > 0 && (
                            <Chip icon={<EmojiEvents />} label={`${s.points} pts`} size="small" />
                          )}
                          {s.rating > 0 && (
                            <Chip icon={<Star />} label={`${s.rating}/5`} size="small" color="primary" />
                          )}
                        </Box>
                      </Box>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Points"
                            size="small"
                            type="number"
                            fullWidth
                            value={staffEvaluation[memo.id]?.[s.id]?.points || ""}
                            onChange={(e) =>
                              handleEvaluationChange(memo.id, s.id, "points", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            label="Rating (1-5)"
                            size="small"
                            type="number"
                            fullWidth
                            inputProps={{ min: 1, max: 5 }}
                            value={staffEvaluation[memo.id]?.[s.id]?.rating || ""}
                            onChange={(e) =>
                              handleEvaluationChange(memo.id, s.id, "rating", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Badges (comma separated)"
                            size="small"
                            fullWidth
                            value={staffEvaluation[memo.id]?.[s.id]?.badges || ""}
                            onChange={(e) =>
                              handleEvaluationChange(memo.id, s.id, "badges", e.target.value)
                            }
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Button
                            variant="contained"
                            onClick={() => submitEvaluation(memo.id, s.id)}
                            fullWidth
                            size="small"
                          >
                            Submit
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}