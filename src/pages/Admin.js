import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  Fade,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Verified,
  Pending,
  Schedule,
  Person,
  Work,
  PriorityHigh,
  Refresh,
  Visibility,
  CheckCircle
} from "@mui/icons-material";

// TabPanel Component
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
  const [searchQuery, setSearchQuery] = useState("");
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

  // Fixed: Get department head name
  const getDeptHeadName = (assignedToId) => {
    const head = users.find(u => u.id === assignedToId);
    return head ? `${head.name} (${head.department || 'General'})` : "Unknown";
  };

  // Fixed search functionality
  const filteredMemos = memos.filter((memo) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = memo.title?.toLowerCase().includes(query);
    const descMatch = memo.description?.toLowerCase().includes(query);
    const assignedMatch = getDeptHeadName(memo.assignedTo).toLowerCase().includes(query);

    return titleMatch || descMatch || assignedMatch;
  });

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
      await sendNotification(newMemo.assignedTo, `New memo assigned: ${newMemo.title}`);

      setNewMemo({
        title: "",
        description: "",
        skillType: "",
        priority: "",
        deadline: "",
        assignedTo: "",
      });
      setActiveTab(1);
      loadData();
    } catch (error) {
      console.error("Error creating memo:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
        return "success";
      case "In Progress":
        return "warning";
      case "Completed":
        return "info";
      default:
        return "default";
    }
  };

  const pendingVerificationMemos = memos.filter(
    (memo) => memo.status === "Verified" && !memo.adminVerified
  );

  // Fixed: Properly calculate memo progress
  const getMemoProgress = (memo) => {
    let progress = 0;
    
    // Step 1: Dept Head Assigned (15%)
    if (memo.assignedTo) progress += 15;
    
    // Step 2: Dept Head Verified (15%)
    if (memo.status === "Verified") progress += 15;
    
    const totalStaff = memo.staffAssigned ? memo.staffAssigned.length : 0;
    
    if (totalStaff > 0) {
      // Step 3: Staff Assigned (15%)
      progress += 15;
      
      // Step 4: Staff Completed (20%)
      const completedStaff = memo.staffAssigned.filter((s) => s.status === "Completed").length;
      progress += Math.round((completedStaff / totalStaff) * 20);
      
      // Step 5: Proof Submitted (15%)
      const submittedStaff = memo.staffAssigned.filter((s) => 
        s.proof && ((Array.isArray(s.proof) && s.proof.length > 0) || (typeof s.proof === 'object' && Object.keys(s.proof).length > 0))
      ).length;
      progress += Math.round((submittedStaff / totalStaff) * 15);
      
      // Step 6: Staff Evaluated (15%)
      const evaluatedStaff = memo.staffAssigned.filter((s) => 
        s.points > 0 || s.rating > 0 || (s.badges && s.badges.length > 0)
      ).length;
      progress += Math.round((evaluatedStaff / totalStaff) * 15);
    }
    
    // Step 7: Admin Verified (5%)
    if (memo.adminVerified) progress += 5;
    
    return Math.min(progress, 100);
  };

  // Fixed: Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // ensures space between title and button
    flexWrap: "wrap", // allows wrapping on small screens
    mb: 4,
  }}
>
  <Box>
    <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
      Admin Dashboard
    </Typography>
    <Typography variant="h6" color="text.secondary">
      Welcome back, {user?.name}
    </Typography>
  </Box>

  <Button
  variant="contained"
  component={Link}
  to="/notifications"
  sx={{
    position: "relative",
    top: { xs: 40, sm: 40 }, // distance from top for mobile/desktop
    right: 0,                // stick to the right edge
    zIndex: 1200,            // ensure it's above other content
  }}
>
  Notifications
</Button>

</Box>


          </Box>
        </Box>
{/* Stats Overview */}
<Grid container spacing={3} sx={{ mb: 3, justifyContent: "center" }}>
  {[
    { value: memos.length, label: "Total Memos", color: "primary.main", icon: <CheckCircle fontSize="large" color="primary" /> },
    { value: pendingVerificationMemos.length, label: "Pending Verification", color: "warning.main", icon: <Pending fontSize="large" color="warning" /> },
    { value: memos.filter((m) => m.adminVerified).length, label: "Verified Memos", color: "success.main", icon: <Verified fontSize="large" color="success" /> },
    { value: users.length, label: "Department Heads", color: "info.main", icon: <Person fontSize="large" color="info" /> },
  ].map((stat, index) => (
    <Grid
      item
      key={index}
      xs={6}  // 2 cards per row
      sx={{ display: "flex", justifyContent: "center" }}
    >
      <Paper
        elevation={2}
        sx={{
          width: 140,        // fixed width
          height: 160,       // increased height for icon
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          textAlign: "center",
        }}
      >
        {stat.icon}  {/* Icon */}
        <Typography variant="h5" color={stat.color} fontWeight="bold">
          {stat.value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {stat.label}
        </Typography>
      </Paper>
    </Grid>
  ))}
</Grid>
        
        {/* Tabs */}
        <Paper elevation={2} sx={{ width: "100%" }}>
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
            <Card elevation={0} sx={{ border: 1, borderColor: "divider" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <Add sx={{ mr: 1 }} /> Create New Memo
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
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Skill Type"
                      name="skillType"
                      value={newMemo.skillType}
                      onChange={handleInputChange}
                      fullWidth
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
                        <MenuItem value="">
                          <em>Select Priority</em>
                        </MenuItem>
                        <MenuItem value="Low">Low Priority</MenuItem>
                        <MenuItem value="Medium">Medium Priority</MenuItem>
                        <MenuItem valu
                        e="High">High Priority</MenuItem>
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
                        <MenuItem value="">
                          <em>Select Department Head</em>
                        </MenuItem>
                        {users.map((u) => (
                          <MenuItem key={u.id} value={u.id}>
                            {u.name} ({u.department || "General"})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" size="large" onClick={handleCreateMemo} startIcon={<Add />}>
                      Create Memo
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Manage Memos Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <TextField
                size="small"
                placeholder="Search memos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredMemos.length === 0 ? (
              <Alert severity="info">No memos found matching your search.</Alert>
            ) : (
              <Stack spacing={3}>
                {filteredMemos.map((memo) => (
                  <Fade in={true} key={memo.id}>
                    <Card elevation={2}>
                      <CardContent>
                        {/* Header */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="h6">{memo.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Assigned to: {getDeptHeadName(memo.assignedTo)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Deadline: {formatDate(memo.deadline)}
                            </Typography>
                            {memo.createdAt && (
                              <Typography variant="caption" color="text.secondary">
                                Created: {formatDate(memo.createdAt)}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              icon={<PriorityHigh />}
                              label={memo.priority || "Not Set"}
                              color={getPriorityColor(memo.priority)}
                              size="small"
                            />
                            <Chip label={memo.status || "Pending"} color={getStatusColor(memo.status)} size="small" />
                            {memo.adminVerified && (
                              <Chip icon={<Verified />} label="Admin Verified" color="success" size="small" />
                            )}
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {memo.description}
                        </Typography>

                        {/* Enhanced Progress Steps */}
                        <Box sx={{ mt: 3, mb: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                            <Work sx={{ mr: 1 }} /> Progress Tracking
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: 'repeat(4, 1fr)' },
                            gap: 2 
                          }}>
                            {/* Dept Head Assigned */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.assignedTo ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.assignedTo ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Dept Head Assigned
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.assignedTo ? 'success.main' : 'text.secondary'}>
                                {memo.assignedTo ? getDeptHeadName(memo.assignedTo) : 'Pending'}
                              </Typography>
                            </Paper>

                            {/* Dept Head Verified */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.status === "Verified" ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.status === "Verified" ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Dept Head Verified
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.status === "Verified" ? 'success.main' : 'text.secondary'}>
                                {memo.status === "Verified" ? 'Verified' : 'Pending'}
                              </Typography>
                            </Paper>

                            {/* Staff Assigned */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.staffAssigned?.length > 0 ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.staffAssigned?.length > 0 ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Staff Assigned
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.staffAssigned?.length > 0 ? 'success.main' : 'text.secondary'}>
                                {memo.staffAssigned?.length > 0 ? `${memo.staffAssigned.length} staff` : 'No staff'}
                              </Typography>
                            </Paper>

                            {/* Staff Completed */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.staffAssigned?.some(s => s.status === "Completed") ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.staffAssigned?.some(s => s.status === "Completed") ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Staff Completed
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.staffAssigned?.some(s => s.status === "Completed") ? 'success.main' : 'text.secondary'}>
                                {memo.staffAssigned ? 
                                  `${memo.staffAssigned.filter(s => s.status === "Completed").length}/${memo.staffAssigned.length}` 
                                  : '0/0'
                                }
                              </Typography>
                            </Paper>

                            

                            {/* Proof Submitted */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.staffAssigned?.some(s => s.proof && s.proof.length > 0) ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.staffAssigned?.some(s => s.proof && s.proof.length > 0) ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Proof Submitted
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.staffAssigned?.some(s => s.proof && s.proof.length > 0) ? 'success.main' : 'text.secondary'}>
                                {memo.staffAssigned ? 
                                  `${memo.staffAssigned.filter(s => s.proof && s.proof.length > 0).length}/${memo.staffAssigned.length}` 
                                  : '0/0'
                                }
                              </Typography>
                            </Paper>

                            {/* Staff Completed Compact Card */}
<Paper
  elevation={1}
  sx={{
    p: 2, // padding inside
    borderLeft: 4,
    borderColor: memo.staffAssigned?.some(s => s.status === "Completed")
      ? "success.main"
      : "grey.300",
    borderRadius: 1,
    bgcolor: "grey.50",
  }}
>
  {/* Header */}
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    {memo.staffAssigned?.some(s => s.status === "Completed") ? (
      <Verified sx={{ color: "success.main", mr: 1, fontSize: 18 }} />
    ) : (
      <Pending sx={{ color: "grey.400", mr: 1, fontSize: 18 }} />
    )}
    <Typography variant="subtitle2" fontWeight="bold">
      Staff Completed
    </Typography>
  </Box>

  {/* Count */}
  <Typography
    variant="body2"
    color={memo.staffAssigned?.some(s => s.status === "Completed") ? "success.main" : "text.secondary"}
    sx={{ mb: 1 }}
  >
    {memo.staffAssigned
      ? `${memo.staffAssigned.filter(s => s.status === "Completed").length}/${memo.staffAssigned.length}`
      : "0/0"}
  </Typography>

  {/* Proofs & Comments (mobile-first compact) */}
  {memo.staffAssigned
    ?.filter(s => s.status === "Completed")
    .map(staff => (
     <Box key={staff.id} sx={{ mb: 1, pl: 1 }}>
  {/* First Proof */}
  {staff.proof?.[0] && (
    <Typography
      variant="overline"
      color="text.secondary"
      display="block"
      sx={{ fontSize: '0.55rem', lineHeight: 1.2, mb: 0.3 }}
    >
      <Box component="span" fontWeight="bold">Doc:</Box> {staff.proof[0].name}
    </Typography>
  )}

  {/* First Comment */}
  {staff.comments?.[0] && (
    <Typography
      variant="overline"
      color="text.secondary"
      display="block"
      sx={{ fontSize: '0.55rem', lineHeight: 1.2, mb: 0.3 }}
    >
      <Box component="span" fontWeight="bold">Comments:</Box> {staff.comments[0].text}
    </Typography>
  )}
</Box>

    ))}
</Paper>

                            {/* Staff Evaluated */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.staffAssigned?.some(s => s.points > 0 || s.rating > 0 || (s.badges && s.badges.length > 0)) ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.staffAssigned?.some(s => s.points > 0 || s.rating > 0 || (s.badges && s.badges.length > 0)) ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Staff Evaluated
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.staffAssigned?.some(s => s.points > 0 || s.rating > 0 || (s.badges && s.badges.length > 0)) ? 'success.main' : 'text.secondary'}>
                                {memo.staffAssigned ? 
                                  `${memo.staffAssigned.filter(s => s.points > 0 || s.rating > 0 || (s.badges && s.badges.length > 0)).length}/${memo.staffAssigned.length}` 
                                  : '0/0'
                                }
                              </Typography>
                            </Paper>

                            {/* Admin Verified */}
                            <Paper elevation={1} sx={{ p: 2, borderLeft: 4, borderColor: memo.adminVerified ? 'success.main' : 'grey.300' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {memo.adminVerified ? (
                                  <Verified sx={{ color: 'success.main', mr: 1 }} />
                                ) : (
                                  <Pending sx={{ color: 'grey.400', mr: 1 }} />
                                )}
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Admin Verified
                                </Typography>
                              </Box>
                              <Typography variant="body2" color={memo.adminVerified ? 'success.main' : 'text.secondary'}>
                                {memo.adminVerified ? 'Verified' : 'Pending'}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Overall Progress Bar */}
                          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                Overall Progress
                              </Typography>
                              <Typography variant="h6" color="primary.main" fontWeight="bold">
                                {getMemoProgress(memo)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={getMemoProgress(memo)} 
                              color={getMemoProgress(memo) === 100 ? "success" : "primary"}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4
                                }
                              }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Started
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getMemoProgress(memo) === 100 ? 'Completed' : 'In Progress'}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Admin Verify Button */}
                        {!memo.adminVerified && memo.status === "Verified" && (
                          <Box sx={{ mt: 2 }}>
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