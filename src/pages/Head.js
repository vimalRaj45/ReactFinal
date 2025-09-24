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
  useTheme,
  useMediaQuery,
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
  Menu,
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
      {value === index && <Box sx={{ p: { xs: 1, sm: 2 } }}>{children}</Box>}
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
  const timestamp = new Date().toLocaleString();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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

      await sendNotification(
        "1",
        `Action: Task Assignment
Sender: Dept Head ${user.name} (ID: ${user.id})
Assigned To: ${staffObject.name} (ID: ${staffObject.id})
Task: "${memoTitle}" (ID: ${memoId})
Department: ${user.department}
Date & Time: ${timestamp}`
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
            await sendNotification(
              "1",
              `Action: Task Verified
Sender: Dept Head ${user.name} (ID: ${user.id})
Task: "${memo.title}" (ID: ${memoId})
Verified Staff: ${memo.staffAssigned.map(s => s.name).join(", ")}
Department: ${user.department}
Date & Time: ${timestamp}`
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
      await sendNotification(
        "1",
        `Action: Task Evaluated
Sender: Dept Head ${user.name} (ID: ${user.id})
Task: "${memo.title}" (ID: ${memoId})
Evaluated Staff: ${users.find(u => u.id === staffId)?.name || staffId}
Points: ${evaluation.points}
Rating: ${evaluation.rating}
Badges: ${evaluation.badges || "None"}
Department: ${user.department}
Date & Time: ${timestamp}`
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
      <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
       {/* Header */}
<Box
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: { xs: 'flex-start', sm: 'center' },
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: 2, sm: 0 },
    mb: 4,
  }}
>
  {/* Title & Department */}
  <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
    <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom fontWeight="bold">
      Department Head Panel
    </Typography>
    <Typography variant={isMobile ? "body2" : "h6"} color="text.secondary">
      {user.department} Department • Welcome, {user.name}
    </Typography>
  </Box>

  {/* Buttons */}
  <Box
    sx={{
      display: 'flex',
      gap: 1,
      width: { xs: '100%', sm: 'auto' },
      justifyContent: { xs: 'center', sm: 'flex-end' },
      flexWrap: 'wrap'
    }}
  >
    <Button
      variant="outlined"
      onClick={loadData}
      disabled={loading}
      size={isMobile ? "small" : "medium"}
      sx={{
        flex: { xs: 1, sm: 'unset' },
        fontSize: isMobile ? "0.75rem" : "0.875rem"
      }}
    >
      {isMobile ? "Refresh" : "Refresh"}
    </Button>

    <Badge
      badgeContent={memos.filter(m => m.status !== "Verified").length}
      color="error"
      sx={{ flex: { xs: 1, sm: 'unset' } }}
    >
      <Button
        variant="contained"
        component={Link}
        to="/notifications"
        size={isMobile ? "small" : "medium"}
        sx={{
          width: { xs: '100%', sm: 'auto' },
          fontSize: isMobile ? "0.75rem" : "0.875rem"
        }}
      >
        {isMobile ? "Notifications" : "Notifications"}
      </Button>
    </Badge>
  </Box>
</Box>

        {/* Stats Overview */}
<Grid container spacing={2} sx={{ mb: 4, justifyContent: "center" }}>
  {[
    { value: memos.length, label: "Total Memos", color: "primary.main", icon: <Assignment sx={{ fontSize: 32, mb: 1 }} /> },
    { value: pendingMemos.length, label: "Pending", color: "warning.main", icon: <PendingActions sx={{ fontSize: 32, mb: 1 }} /> },
    { value: verifiedMemos.length, label: "Verified", color: "success.main", icon: <CheckCircle sx={{ fontSize: 32, mb: 1 }} /> },
    { value: users.length, label: "Staff", color: "info.main", icon: <PersonAdd sx={{ fontSize: 32, mb: 1 }} /> }
  ].map((stat, index) => (
    <Grid item key={index}>
      <Card
        elevation={2}
        sx={{
          width: 180,        // fixed width
          height: 160,       // fixed height to accommodate icon
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {stat.icon}
        <Typography variant={isMobile ? "h6" : "h4"} fontWeight="bold" color={stat.color}>
          {stat.value}
        </Typography>
        <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
          {stat.label}
        </Typography>
      </Card>
    </Grid>
  ))}
</Grid>

        {/* Tabs */}
        <Card elevation={2}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab icon={isMobile ? <Assignment /> : null} label={isMobile ? "All" : "All Memos"} />
            <Tab icon={isMobile ? <PendingActions /> : null} label={isMobile ? `Pending` : `Pending (${pendingMemos.length})`} />
            <Tab icon={isMobile ? <VerifiedUser /> : null} label={isMobile ? `Verified` : `Verified (${verifiedMemos.length})`} />
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
              isMobile={isMobile}
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
              isMobile={isMobile}
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
              isMobile={isMobile}
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
  getStatusColor,
  isMobile
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
    <Stack spacing={2}>
      {memos.map((memo) => (
        <Card key={memo.id} elevation={1} sx={{ '&:hover': { elevation: 4 } }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            {/* Memo Header */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1
            }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                  {memo.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                  <Chip 
                    icon={<PriorityHigh />}
                    label={memo.priority || "Not Set"} 
                    size="small"
                    color={getPriorityColor(memo.priority)}
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
                  />
                  <Chip 
                    icon={memo.status === "Verified" ? <CheckCircle /> : <PendingActions />}
                    label={memo.status || "Pending"} 
                    size="small"
                    color={getStatusColor(memo.status)}
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
                  />
                  {memo.skillType && (
                    <Chip 
                      icon={<Work />} 
                      label={memo.skillType} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Memo Details */}
            <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              {memo.description}
            </Typography>

            <Grid container spacing={1} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    <strong>Deadline:</strong> {memo.deadline ? new Date(memo.deadline).toLocaleDateString() : "Not set"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <VerifiedUser fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                    <strong>Admin Verified:</strong> {memo.adminVerified ? "Yes" : "No"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* Staff Assignment Section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }}>
                <PersonAdd fontSize="small" /> Staff Assignment
              </Typography>
              <Box sx={{ 
                display: "flex", 
                gap: 1, 
                alignItems: "center", 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
                '& > *': { width: { xs: '100%', sm: 'auto' } }
              }}>
                <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }} size="small">
                  <InputLabel>Select Staff</InputLabel>
                  <Select
                    value={selectedStaff[memo.id] || ""}
                    onChange={(e) =>
                      setSelectedStaff({ ...selectedStaff, [memo.id]: e.target.value })
                    }
                    disabled={!canAssign(memo)}
                    label="Select Staff"
                  >
                    {users.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem' }}>
                            {s.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                            {s.name}
                          </Typography>
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
                  fullWidth={isMobile}
                >
                  {canAssign(memo) ? "Assign Staff" : "Already Assigned"}
                </Button>
              </Box>
            </Box>

            {/* Assigned Staff */}
            {(memo.staffAssigned || []).length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Assigned Staff:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flexDirection: "column" }}>
                  {(memo.staffAssigned || []).map((s) => (
                    <Box key={s.id} sx={{ mb: 1, pl: 1, borderLeft: "3px solid #1976d2" }}>
                      <Chip
                        avatar={<Avatar sx={{ width: 24, height: 24 }}>{s.name?.charAt(0).toUpperCase()}</Avatar>}
                        label={s.name}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 1 }}
                      />

                      {/* Staff Proof & Comments */}
                      {s.proof && s.proof.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>Proof Documents:</Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {s.proof.map((p, idx) => (
                              <Button
                                key={idx}
                                variant="outlined"
                                size="small"
                                href={`/path/to/proof/${p.name}`}
                                target="_blank"
                                fullWidth={isMobile}
                                sx={{ 
                                  justifyContent: 'flex-start',
                                  fontSize: isMobile ? '0.7rem' : '0.8rem'
                                }}
                              >
                                {p.name} ({new Date(p.date).toLocaleString()})
                              </Button>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {s.comments && s.comments.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>Staff Comments:</Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {s.comments.map((c, idx) => (
                              <Paper key={idx} sx={{ p: 1 }} variant="outlined">
                                <Typography variant="body2" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>{c.text}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                                  {new Date(c.date).toLocaleString()}
                                </Typography>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
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
                fullWidth={isMobile}
              >
                Verify Task Completion
              </Button>
            )}

            {/* Evaluation Section */}
{memo.status === "Verified" && memo.adminVerified && (memo.staffAssigned || []).length > 0 && (
  <Box>
    <Typography
      variant="subtitle2"
      gutterBottom
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: isMobile ? '0.8rem' : '0.875rem',
        mb: 1
      }}
    >
      <Assessment fontSize="small" /> Staff Evaluation
    </Typography>

    <Stack spacing={1}>
      {(memo.staffAssigned || []).map((s) => (
        <Paper
          key={s.id}
          sx={{ p: 1, backgroundColor: 'grey.50' }}
          variant="outlined"
        >
          {/* Header: Avatar + Name + Chips */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: 1,
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {s.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                {s.name}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: { xs: 1, sm: 0 } }}>
              {s.points > 0 && (
                <Chip
                  icon={<EmojiEvents />}
                  label={`${s.points} pts`}
                  size="small"
                />
              )}
              {s.rating > 0 && (
                <Chip
                  icon={<Star />}
                  label={`${s.rating}/5`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          </Box>

          {/* Evaluation Inputs */}
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Points"
                size="small"
                type="number"
                fullWidth
                value={staffEvaluation[memo.id]?.[s.id]?.points || ""}
                onChange={(e) =>
                  handleEvaluationChange(memo.id, s.id, "points", e.target.value)
                }
                sx={{ '& .MuiInputBase-input': { fontSize: isMobile ? '0.8rem' : '0.875rem' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Rating (1-5)"
                size="small"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                fullWidth
                value={staffEvaluation[memo.id]?.[s.id]?.rating || ""}
                onChange={(e) =>
                  handleEvaluationChange(memo.id, s.id, "rating", e.target.value)
                }
                sx={{ '& .MuiInputBase-input': { fontSize: isMobile ? '0.8rem' : '0.875rem' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Badges"
                size="small"
                fullWidth
                placeholder="comma separated"
                value={staffEvaluation[memo.id]?.[s.id]?.badges || ""}
                onChange={(e) =>
                  handleEvaluationChange(memo.id, s.id, "badges", e.target.value)
                }
                sx={{ '& .MuiInputBase-input': { fontSize: isMobile ? '0.8rem' : '0.875rem' } }}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="contained"
                onClick={() => submitEvaluation(memo.id, s.id)}
                fullWidth
                size="small"
                sx={{ minWidth: 'auto' }}
              >
                {isMobile ? "✓" : "Submit"}
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