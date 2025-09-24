import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000" });

// -------------------- Hardcoded Fallback Data --------------------
const fallbackUsers = [
  { id: 1, name: "Admin User", email: "admin@test.com", password: "admin123", role: "Admin", department: "All" },
  { id: 2, name: "Head Cardiology", email: "head1@test.com", password: "head123", role: "Head", department: "Cardiology" },
  { id: 3, name: "Staff Alice", email: "staff1@test.com", password: "staff123", role: "Staff", department: "Cardiology", points: 5, rating: 4, badges: ["Efficient"] },
  { id: 4, name: "Staff Bob", email: "staff2@test.com", password: "staff123", role: "Staff", department: "Cardiology", points: 3, rating: 5, badges: [] }
];

const fallbackMemos = [
  {
    id: 1,
    title: "Check Patient Records",
    description: "Review latest patient records and update charts.",
    skillType: "Documentation",
    priority: "High",
    deadline: "2025-09-30",
    assignedTo: 2,
    staffAssigned: [{ id: 3, name: "Staff Alice", status: "Pending", points: 0, rating: 0, badges: [] }],
    status: "Pending",
    adminVerified: false
  },
  {
    id: 2,
    title: "Prepare Weekly Report",
    description: "Compile weekly report for the Cardiology department.",
    skillType: "Reporting",
    priority: "Medium",
    deadline: "2025-09-28",
    assignedTo: 2,
    staffAssigned: [{ id: 4, name: "Staff Bob", status: "In Progress", points: 0, rating: 0, badges: [] }],
    status: "In Progress",
    adminVerified: false
  }
];

const fallbackNotifications = [
  { id: 1, userId: 3, message: "You have been assigned a new task", timestamp: new Date(), read: false },
  { id: 2, userId: 4, message: "Task deadline approaching", timestamp: new Date(), read: false }
];


// -------------------- Notifications Replies --------------------
export const addReply = async (notificationId, reply) => {
  try {
    // If your real API supports replies:
    const res = await API.post(`/notifications/${notificationId}/replies`, reply);
    return res;
  } catch {
    // Fallback: store reply locally
    const notif = fallbackNotifications.find(n => n.id === notificationId);
    if (notif) {
      if (!notif.replies) notif.replies = [];
      notif.replies.push(reply);
      return { data: notif };
    }
    throw new Error("Notification not found");
  }
};


// -------------------- Auth --------------------
export const loginUser = async (email, password) => {
  try {
    const res = await API.get(`/users?email=${email}&password=${password}`);
    return res.data[0] || null;
  } catch {
    return fallbackUsers.find(u => u.email === email && u.password === password) || null;
  }
};

// -------------------- Users --------------------
export const getUsers = async () => {
  try {
    const res = await API.get("/users");
    return res;
  } catch {
    return { data: fallbackUsers };
  }
};

export const updateUser = async (id, data) => {
  try {
    const res = await API.patch(`/users/${id}`, data);
    return res;
  } catch {
    const idx = fallbackUsers.findIndex(u => u.id === id);
    if (idx !== -1) fallbackUsers[idx] = { ...fallbackUsers[idx], ...data };
    return { data: fallbackUsers[idx] };
  }
};

// -------------------- Memos / Tasks --------------------
export const getMemos = async () => {
  try {
    const res = await API.get("/memos");
    return res;
  } catch {
    return { data: fallbackMemos };
  }
};

export const createMemo = async (data) => {
  try {
    const res = await API.post("/memos", data);
    return res;
  } catch {
    const newId = fallbackMemos.length + 1;
    const newMemo = { ...data, id: newId };
    fallbackMemos.push(newMemo);
    return { data: newMemo };
  }
};

export const updateMemo = async (id, data) => {
  try {
    const res = await API.patch(`/memos/${id}`, data);
    return res;
  } catch {
    const idx = fallbackMemos.findIndex(m => m.id === id);
    if (idx !== -1) fallbackMemos[idx] = { ...fallbackMemos[idx], ...data };
    return { data: fallbackMemos[idx] };
  }
};

// -------------------- Notifications --------------------
export const sendNotification = async (userId, message) => {
  try {
    const res = await API.post("/notifications", { userId, message, timestamp: new Date(), read: false });
    return res;
  } catch {
    const newId = fallbackNotifications.length + 1;
    const notif = { id: newId, userId, message, timestamp: new Date(), read: false };
    fallbackNotifications.push(notif);
    return { data: notif };
  }
};

export const getNotifications = async () => {
  try {
    const res = await API.get("/notifications");
    return res;
  } catch {
    return { data: fallbackNotifications };
  }
};

export const markNotificationRead = async (id) => {
  try {
    const res = await API.patch(`/notifications/${id}`, { read: true });
    return res;
  } catch {
    const idx = fallbackNotifications.findIndex(n => n.id === id);
    if (idx !== -1) fallbackNotifications[idx].read = true;
    return { data: fallbackNotifications[idx] };
  }
};
