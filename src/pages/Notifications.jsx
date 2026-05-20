import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";

const types = ["", "ORDER", "PAYMENT", "SHIPPING", "REVIEW", "REWARD", "OFFER", "SYSTEM"];

const Notifications = () => {
  const { notifications, loadNotifications, markRead, markAllRead } = useNotifications();
  const [type, setType] = useState("");

  useEffect(() => {
    loadNotifications(type);
  }, [loadNotifications, type]);

  return (
    <section className="catalog-page">
      <div className="page-heading row-heading">
        <div><p className="eyebrow">Account</p><h1>Notifications</h1></div>
        <button className="secondary-button" type="button" onClick={markAllRead}>Mark all read</button>
      </div>
      <select className="notification-filter" value={type} onChange={(event) => setType(event.target.value)}>
        {types.map((item) => <option key={item || "ALL"} value={item}>{item || "All types"}</option>)}
      </select>
      {!notifications.length ? <div className="empty-state"><h2>No notifications</h2><p>Cantley updates will appear here.</p></div> : null}
      <div className="notification-list">
        {notifications.map((notification) => (
          <article className={`notification-item ${notification.isRead ? "" : "unread"}`} key={notification._id}>
            <div>
              <strong>{notification.title}</strong>
              <span>{notification.type} - {new Date(notification.createdAt).toLocaleString()}</span>
              <p>{notification.message}</p>
            </div>
            {notification.link ? <Link to={notification.link}>Open</Link> : null}
            {!notification.isRead ? <button type="button" onClick={() => markRead(notification._id)}>Read</button> : null}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Notifications;
