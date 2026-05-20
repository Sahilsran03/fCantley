import React, { useEffect, useState } from "react";
import AdminNav from "../components/AdminNav.jsx";
import api from "../services/api.js";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/admin/notifications").then((response) => setNotifications(response.data.notifications));
  }, []);

  return (
    <section className="admin-page">
      <AdminNav />
      <div className="page-heading"><p className="eyebrow">Admin</p><h1>Notification Monitor</h1></div>
      <div className="notification-list">
        {notifications.map((notification) => (
          <article className={`notification-item ${notification.isRead ? "" : "unread"}`} key={notification._id}>
            <div>
              <strong>{notification.title}</strong>
              <span>{notification.user?.email} - {notification.type}</span>
              <p>{notification.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdminNotifications;
