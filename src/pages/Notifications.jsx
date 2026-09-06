import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";
import "./Notifications.css";

const types = ["", "ORDER", "PAYMENT", "SHIPPING", "REVIEW", "REWARD", "OFFER", "SYSTEM"];
const timestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : {
    iso: date.toISOString(),
    label: date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
  };
};

const Notifications = () => {
  const { notifications, loadNotifications, markRead, markAllRead } = useNotifications();
  const [type, setType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pending, setPending] = useState("");
  const actionLock = useRef(false);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    setLoadError("");
    setActionError("");
    try {
      await loadNotifications(type);
    } catch (error) {
      if (version === requestVersion.current) setLoadError(error.response?.data?.message || "Unable to load notifications. Please try again.");
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, [loadNotifications, type]);

  useEffect(() => {
    load();
    return () => { requestVersion.current += 1; };
  }, [load]);

  const updateRead = async (id) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setPending(id || "all");
    setActionError("");
    try {
      if (id) await markRead(id);
      else await markAllRead();
    } catch (error) {
      setActionError(error.response?.data?.message || "We couldn’t confirm the read status. Please try again.");
    } finally {
      actionLock.current = false;
      setPending("");
    }
  };

  // Read actions refresh the context's unfiltered list; keep the chosen category visible.
  const visibleNotifications = type ? notifications.filter((notification) => notification.type === type) : notifications;
  const unread = visibleNotifications.filter((notification) => !notification.isRead).length;

  return (
    <section className="cantley-notifications" aria-labelledby="notifications-title">
      <header className="cantley-notifications-heading">
        <div><p className="cantley-notifications-eyebrow">Your Cantley updates</p><h1 id="notifications-title">Notifications</h1></div>
        <button className="cantley-notifications-button" type="button" onClick={() => updateRead()} disabled={isLoading || Boolean(loadError) || Boolean(pending)}>{pending === "all" ? "Marking all as read..." : "Mark all as read"}</button>
      </header>
      <div className="cantley-notifications-toolbar">
        <div className="cantley-notifications-filter">
          <label htmlFor="notification-type">Filter by type</label>
          <select id="notification-type" value={type} disabled={isLoading || Boolean(pending)} onChange={(event) => setType(event.target.value)}>
            {types.map((item) => <option key={item || "ALL"} value={item}>{item ? item.charAt(0) + item.slice(1).toLowerCase() : "All types"}</option>)}
          </select>
        </div>
        {!isLoading && !loadError ? <p className="cantley-notifications-count" aria-live="polite" aria-atomic="true">{visibleNotifications.length} {visibleNotifications.length === 1 ? "notification" : "notifications"}{type ? " in this category" : ""} · {unread} unread</p> : null}
      </div>
      {actionError ? <p className="cantley-notifications-error" role="alert">{actionError}</p> : null}
      {isLoading ? (
        <div className="cantley-notifications-state" role="status"><span className="cantley-notifications-loader" aria-hidden="true" /><h2>Loading your notifications</h2><p>Gathering your latest updates.</p></div>
      ) : loadError ? (
        <div className="cantley-notifications-state" role="alert"><h2>We couldn’t load your notifications</h2><p>{loadError}</p><button className="cantley-notifications-button" type="button" onClick={load}>Retry</button></div>
      ) : !visibleNotifications.length ? (
        <div className="cantley-notifications-state"><h2>{type ? "No notifications in this category" : "No notifications yet"}</h2><p>We’ll show your order and account updates here when available.</p></div>
      ) : (
        <ul className="cantley-notifications-list">
          {visibleNotifications.map((notification) => {
            const date = timestamp(notification.createdAt);
            return (
              <li className={`cantley-notification ${notification.isRead ? "" : "cantley-notification-unread"}`} key={notification._id}>
                <article aria-labelledby={`notification-${notification._id}`}>
                  <div className="cantley-notification-copy">
                    <div className="cantley-notification-meta">
                      <span className="cantley-notification-read-state">{notification.isRead ? "Read" : "Unread"}</span>
                      {notification.type ? <span>{notification.type}</span> : null}
                      {date ? <time dateTime={date.iso}>{date.label}</time> : null}
                    </div>
                    <h2 id={`notification-${notification._id}`}>{notification.title}</h2>
                    {notification.message ? <p>{notification.message}</p> : null}
                  </div>
                  <div className="cantley-notification-actions">
                    {notification.link ? <Link to={notification.link} aria-label={`Open ${notification.title || "notification"}`}>Open <span aria-hidden="true">↗</span></Link> : null}
                    {!notification.isRead ? <button className="cantley-notifications-button" type="button" onClick={() => updateRead(notification._id)} disabled={Boolean(pending)} aria-label={`Mark ${notification.title || "notification"} as read`}>{pending === notification._id ? "Marking as read..." : "Mark as read"}</button> : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default Notifications;
