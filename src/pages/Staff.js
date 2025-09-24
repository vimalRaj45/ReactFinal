import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMemos, updateMemo, sendNotification, getUsers } from "../services/api";
import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Grid,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Task,
  Notifications,
  Assessment,
  EmojiEvents,
  Star,
  UploadFile,
  Comment,
  Schedule,
  PriorityHigh,
  Person,
  CheckCircle,
  Pending,
  Download,
  Delete,
  Add,
  Refresh,
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

export default function Staff() {
  const [memos, setMemos] = useState([]);
  const [users, setUsers] = useState([]);
  const [comment, setComment] = useState("");
  const [proofFiles, setProofFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState({});
  const timestamp = new Date().toLocaleString();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [memosRes, usersRes] = await Promise.all([getMemos(), getUsers()]);
      
      const staffMemos = memosRes.data.filter((memo) =>
        memo.staffAssigned?.some((s) => s.id === user.id)
      );

      setMemos(staffMemos);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (memo) => {
    const taskComment = comments[memo.id] || "";
    const file = proofFiles[memo.id];

    try {
      const updatedStaff = memo.staffAssigned.map((s) => {
        if (s.id === user.id) {
          return {
            ...s,
            status: "Completed",
            proof: file ? [...(s.proof || []), { name: file.name, date: new Date().toISOString() }] : s.proof || [],
            comments: taskComment ? [...(s.comments || []), { text: taskComment, date: new Date().toISOString() }] : s.comments || [],
            completedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      await updateMemo(memo.id, {
        staffAssigned: updatedStaff,
        status: "Completed",
      });

    await sendNotification(
  "1",
  `Action: Task Completed
Sender: Staff ${user.name} (ID: ${user.id})
Task: "${memo.title}" (ID: ${memo.id})
Dept Head: ${users.find(u => u.id === memo.assignedTo)?.name || memo.assignedTo}
Department: ${user.department}
Date & Time: ${timestamp}`
);

      // Clear inputs for this memo
      setComments(prev => ({ ...prev, [memo.id]: "" }));
      setProofFiles(prev => ({ ...prev, [memo.id]: null }));
      
      loadData();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleFileUpload = (memoId, event) => {
    const file = event.target.files[0];
    if (file) {
      setProofFiles(prev => ({ ...prev, [memoId]: file }));
    }
  };

  const removeFile = (memoId) => {
    setProofFiles(prev => ({ ...prev, [memoId]: null }));
  };

  const calculateOverallEvaluation = () => {
    let totalPoints = 0,
      totalRating = 0,
      badgeList = [];
    let taskCount = 0;
    let completedTasks = 0;

    memos.forEach((memo) => {
      const myTask = memo.staffAssigned?.find((s) => s.id === user.id);
      if (myTask) {
        if (myTask.points) totalPoints += Number(myTask.points);
        if (myTask.rating) totalRating += Number(myTask.rating);
        if (myTask.badges) badgeList = [...badgeList, ...myTask.badges];
        taskCount++;
        if (myTask.status === "Completed") completedTasks++;
      }
    });

    return {
      avgPoints: taskCount ? (totalPoints / taskCount).toFixed(1) : 0,
      avgRating: taskCount ? (totalRating / taskCount).toFixed(1) : 0,
      badges: [...new Set(badgeList)],
      completedTasks,
      totalTasks: taskCount,
      completionRate: taskCount ? Math.round((completedTasks / taskCount) * 100) : 0,
    };
  };

  const overall = calculateOverallEvaluation();

  const getUserNameById = (id) => {
    const u = users.find((usr) => usr.id.toString() === id.toString());
    return u ? u.name : "Unknown";
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
      case "Completed": return "success";
      case "In Progress": return "info";
      default: return "default";
    }
  };

  const pendingTasks = memos.filter(memo => {
    const myTask = memo.staffAssigned?.find((s) => s.id === user.id);
    return myTask?.status !== "Completed";
  });

  const completedTasks = memos.filter(memo => {
    const myTask = memo.staffAssigned?.find((s) => s.id === user.id);
    return myTask?.status === "Completed";
  });

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Staff Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {user.department} Department • Welcome, {user.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Badge badgeContent={pendingTasks.length} color="error">
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

        {/* Performance Overview */}
<Grid container spacing={2} sx={{ mb: 4, justifyContent: "center" }}>
  {[
    { icon: <Task sx={{ fontSize: 32, color: "primary.main" }} />, value: overall.totalTasks, label: "Total Tasks" },
    { icon: <CheckCircle sx={{ fontSize: 32, color: "success.main" }} />, value: overall.completedTasks, label: "Completed", color: "success.main" },
    { icon: <EmojiEvents sx={{ fontSize: 32, color: "warning.main" }} />, value: overall.avgPoints, label: "Avg Points", color: "warning.main" },
    { icon: <Star sx={{ fontSize: 32, color: "info.main" }} />, value: `${overall.avgRating}/5`, label: "Avg Rating", color: "info.main" },
    { icon: <Assessment sx={{ fontSize: 32, color: "secondary.main" }} />, value: `${overall.completionRate}%`, label: "Completion Rate", color: "secondary.main" },
    { icon: <EmojiEvents sx={{ fontSize: 32, color: "success.main" }} />, value: overall.badges.length, label: "Badges Earned", color: "success.main" },
  ].map((item, i) => (
    <Grid item xs={6} sm={4} md={2} key={i}>
      <Card
        elevation={2}
        sx={{
          width: 130,   // smaller width
          height: 130,  // smaller height
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",   // keep center aligned
        }}
      >
        {item.icon}
        <Typography variant="h6" fontWeight="bold" color={item.color || "text.primary"}>
          {item.value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.label}
        </Typography>
      </Card>
    </Grid>
  ))}
</Grid>

        {/* Badges Display */}
        {overall.badges.length > 0 && (
          <Card sx={{ mb: 4, p: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents /> Earned Badges
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {overall.badges.map((badge, index) => (
                <Chip
                  key={index}
                  label={badge}
                  color="primary"
                  variant="outlined"
                  icon={<EmojiEvents />}
                />
              ))}
            </Box>
          </Card>
        )}

        {/* Tabs */}
        <Card elevation={2}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Task />} label={`All Tasks (${memos.length})`} />
            <Tab icon={<Pending />} label={`Pending (${pendingTasks.length})`} />
            <Tab icon={<CheckCircle />} label={`Completed (${completedTasks.length})`} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <TaskList 
              memos={memos} 
              loading={loading}
              user={user}
              users={users}
              comments={comments}
              setComments={setComments}
              proofFiles={proofFiles}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
              handleUpdateTask={handleUpdateTask}
              getUserNameById={getUserNameById}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <TaskList 
              memos={pendingTasks} 
              loading={loading}
              user={user}
              users={users}
              comments={comments}
              setComments={setComments}
              proofFiles={proofFiles}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
              handleUpdateTask={handleUpdateTask}
              getUserNameById={getUserNameById}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <TaskList 
              memos={completedTasks} 
              loading={loading}
              user={user}
              users={users}
              comments={comments}
              setComments={setComments}
              proofFiles={proofFiles}
              handleFileUpload={handleFileUpload}
              removeFile={removeFile}
              handleUpdateTask={handleUpdateTask}
              getUserNameById={getUserNameById}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </TabPanel>
        </Card>
      </Container>
    </>
  );
}

function TaskList({ 
  memos, 
  loading, 
  user, 
  users, 
  comments, 
  setComments, 
  proofFiles, 
  handleFileUpload, 
  removeFile, 
  handleUpdateTask, 
  getUserNameById,
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
        No tasks found in this category.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {memos.map((memo) => {
        const myTask = memo.staffAssigned?.find((s) => s.id === user.id);
        const isCompleted = myTask?.status === "Completed";
        
        return (
          <Card key={memo.id} elevation={1} sx={{ '&:hover': { boxShadow: 4 } }}>
            <CardContent>
              {/* Task Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
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
                      icon={isCompleted ? <CheckCircle /> : <Pending />}
                      label={myTask?.status || "Pending"} 
                      size="small"
                      color={getStatusColor(myTask?.status)}
                    />
                    {memo.skillType && (
                      <Chip label={memo.skillType} size="small" variant="outlined" />
                    )}
                  </Box>
                </Box>
                {isCompleted && myTask?.completedAt && (
                  <Chip 
                    label={`Completed: ${new Date(myTask.completedAt).toLocaleDateString()}`}
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>

              {/* Task Description */}
              <Typography variant="body2" color="text.secondary" paragraph>
                {memo.description}
              </Typography>

              {/* Task Details */}
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
                    <Person fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Assigned by:</strong> {getUserNameById(memo.assignedTo)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Dept Verified:</strong> {memo.status === "Verified" ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle fontSize="small" color="action" />
                    <Typography variant="body2">
                      <strong>Admin Verified:</strong> {memo.adminVerified ? "Yes" : "No"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Update Section for Pending Tasks */}
              {!isCompleted && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Add /> Update Task Progress
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Add Comment"
                        value={comments[memo.id] || ""}
                        onChange={(e) => setComments(prev => ({ ...prev, [memo.id]: e.target.value }))}
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Describe your progress or any issues..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadFile />}
                          size="small"
                        >
                          Upload Proof
                          <input
                            type="file"
                            hidden
                            onChange={(e) => handleFileUpload(memo.id, e)}
                          />
                        </Button>
                        {proofFiles[memo.id] && (
                          <Chip
                            label={proofFiles[memo.id].name}
                            onDelete={() => removeFile(memo.id)}
                            deleteIcon={<Delete />}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<CheckCircle />}
                        onClick={() => handleUpdateTask(memo)}
                        disabled={!comments[memo.id] && !proofFiles[memo.id]}
                      >
                        Mark as Completed
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Task History */}
              {(myTask?.comments?.length > 0 || myTask?.proof?.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Comment /> Task History
                  </Typography>
                  <List dense>
                    {myTask.comments?.map((comment, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Comment color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={comment.text} 
                          secondary={comment.date ? new Date(comment.date).toLocaleString() : ''}
                        />
                      </ListItem>
                    ))}
                    {myTask.proof?.map((proof, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <UploadFile color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={proof.name} 
                          secondary={proof.date ? new Date(proof.date).toLocaleString() : ''}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Evaluation Section */}
              {isCompleted && (myTask?.points > 0 || myTask?.rating > 0 || myTask?.badges?.length > 0) && (
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'success.50' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment /> Evaluation Results
                  </Typography>
                  <Grid container spacing={2}>
                    {myTask.points > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="warning.main">
                            {myTask.points}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Points Earned
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {myTask.rating > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main">
                            {myTask.rating}/5
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Performance Rating
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {myTask.badges?.length > 0 && (
                      <Grid item xs={12} sm={4}>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            <strong>Badges:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {myTask.badges.map((badge, index) => (
                              <Chip key={index} label={badge} size="small" />
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}