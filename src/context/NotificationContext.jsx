import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async (type = "") => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return [];
    }
    const response = await api.get("/notifications", { params: type ? { type } : {} });
    setNotifications(response.data.notifications);
    setUnreadCount(response.data.unreadCount);
    return response.data.notifications;
  }, [isAuthenticated]);

  useEffect(() => {
    loadNotifications().catch(() => {});
  }, [loadNotifications]);

  const markRead = useCallback(async (id) => {
    await api.put(`/notifications/${id}/read`);
    await loadNotifications();
  }, [loadNotifications]);

  const markAllRead = useCallback(async () => {
    await api.put("/notifications/read-all");
    await loadNotifications();
  }, [loadNotifications]);

  const value = useMemo(() => ({ notifications, unreadCount, loadNotifications, markRead, markAllRead }), [loadNotifications, markAllRead, markRead, notifications, unreadCount]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider.");
  return context;
};
