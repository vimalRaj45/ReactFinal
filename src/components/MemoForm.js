import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Paper,
  Grid,
  Alert,
  Chip,
  InputAdornment,
  IconButton,
  Fade,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Add,
  CalendarToday,
  PriorityHigh,
  Work,
  Person,
  Description,
  Title as TitleIcon,
  Clear,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function MemoForm({ onCreate, users, loading = false }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skillType: "",
    priority: "Low",
    deadline: "",
    assignedTo: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const skillTypes = [
    "Technical",
    "Creative",
    "Administrative",
    "Research",
    "Communication",
    "Management",
    "Analytical",
    "Customer Service"
  ];

  const priorities = [
    { value: "Low", color: "success", icon: <PriorityHigh /> },
    { value: "Medium", color: "warning", icon: <PriorityHigh /> },
    { value: "High", color: "error", icon: <PriorityHigh /> },
  ];

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "title":
        if (!value.trim()) newErrors.title = "Title is required";
        else if (value.length < 3) newErrors.title = "Title must be at least 3 characters";
        else delete newErrors.title;
        break;
      case "description":
        if (!value.trim()) newErrors.description = "Description is required";
        else if (value.length < 10) newErrors.description = "Description must be at least 10 characters";
        else delete newErrors.description;
        break;
      case "deadline":
        if (value && new Date(value) < new Date()) {
          newErrors.deadline = "Deadline cannot be in the past";
        } else {
          delete newErrors.deadline;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    validateField(name, value);
  };

  const handleDateChange = (date) => {
    const newForm = { ...form, deadline: date ? date.toISOString().split('T')[0] : "" };
    setForm(newForm);
    if (touched.deadline) {
      validateField("deadline", newForm.deadline);
    }
  };

  const clearField = (fieldName) => {
    setForm({ ...form, [fieldName]: "" });
    setErrors({ ...errors, [fieldName]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(form).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate all fields
    const isValid = Object.keys(form).every(key => validateField(key, form[key]));

    if (isValid) {
      onCreate(form);
      setForm({
        title: "",
        description: "",
        skillType: "",
        priority: "Low",
        deadline: "",
        assignedTo: "",
      });
      setTouched({});
      setErrors({});
    }
  };

  const isFormValid = () => {
    return form.title && form.description && !Object.keys(errors).length;
  };

  const departmentHeads = users.filter((u) => u.role === "Head");

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Fade in={true} timeout={600}>
        <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Add sx={{ fontSize: 32, color: "primary.main", mr: 2 }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              Create New Memo
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  label="Memo Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TitleIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: form.title && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => clearField("title")}>
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Enter a clear and concise title"
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  multiline
                  rows={4}
                  required
                  error={!!errors.description}
                  helperText={errors.description || "Provide detailed information about the memo"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Describe the purpose, requirements, and expectations..."
                />
              </Grid>

              {/* Skill Type and Priority */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Skill Type"
                  name="skillType"
                  value={form.skillType}
                  onChange={handleChange}
                  select
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Work color="action" />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="">
                    <em>Select skill type</em>
                  </MenuItem>
                  {skillTypes.map((skill) => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    label="Priority"
                    startAdornment={
                      <InputAdornment position="start">
                        <PriorityHigh color="action" />
                      </InputAdornment>
                    }
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Chip
                          icon={priority.icon}
                          label={priority.value}
                          size="small"
                          color={priority.color}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Deadline and Assignment */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Deadline"
                  value={form.deadline || null}
                  onChange={handleDateChange}
                  slots={{
                    textField: (params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.deadline}
                        helperText={errors.deadline}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Assign to Department Head"
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={handleChange}
                  select
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="">
                    <em>Select Department Head</em>
                  </MenuItem>
                  {departmentHeads.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box>
                        <Typography variant="body1">{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.department || "General Department"}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={!isFormValid() || loading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <Add sx={{ mr: 1 }} />
                  Create Memo
                </>
              )}
            </Button>

            {/* Form Status */}
            {!isFormValid() && Object.keys(touched).length > 0 && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Please fill in all required fields correctly to create the memo.
              </Alert>
            )}
          </Box>
        </Paper>
      </Fade>
    </LocalizationProvider>
  );
}