import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")); // logged-in user

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const res = await getNotifications();
    // filter notifications for this user only
    const userNotifications = res.data.filter(n => n.userId === user.id);
    setNotifications(userNotifications);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications(); // refresh list
  };

  return (
    <div className="container mt-4">
      <h3>Notifications</h3>
      {notifications.length === 0 && <p>No notifications.</p>}

      <ul className="list-group">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`list-group-item d-flex justify-content-between align-items-center ${
              n.read ? "list-group-item-light" : "list-group-item-warning"
            }`}
          >
            <div>
              <strong>{n.read ? "" : "New: "}</strong>
              {n.message}
              <br />
              <small>{new Date(n.timestamp).toLocaleString()}</small>
            </div>
            {!n.read && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleMarkRead(n.id)}
              >
                Mark as Read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
