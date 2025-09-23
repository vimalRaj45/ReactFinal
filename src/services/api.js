import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000" });

// -------------------- Auth --------------------
export const loginUser = async (email, password) => {
  const res = await API.get(`/users?email=${email}&password=${password}`);
  return res.data[0] || null;
};

// -------------------- Users --------------------
export const getUsers = () => API.get("/users");
export const updateUser = (id, data) => API.patch(`/users/${id}`, data);

// -------------------- Memos / Tasks --------------------
export const getMemos = () => API.get("/memos");
export const createMemo = (data) => API.post("/memos", data);
export const updateMemo = (id, data) => API.patch(`/memos/${id}`, data);

// -------------------- Notifications --------------------
export const sendNotification = (userId, message) => 
  API.post("/notifications", { userId, message, timestamp: new Date(), read: false });

export const getNotifications = () => API.get("/notifications");

// Mark notification as read
export const markNotificationRead = (id) => 
  API.patch(`/notifications/${id}`, { read: true });
