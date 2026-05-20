import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { getMediaUrl } from "../utils/media.js";

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => new Set(JSON.parse(localStorage.getItem("dismissedAnnouncements") || "[]")));

  useEffect(() => {
    api.get("/announcements").then((response) => setAnnouncements(response.data.announcements)).catch(() => setAnnouncements([]));
  }, []);

  const announcement = announcements.find((item) => !dismissed.has(item._id));
  if (!announcement) return null;

  const dismiss = () => {
    const next = new Set(dismissed);
    next.add(announcement._id);
    setDismissed(next);
    localStorage.setItem("dismissedAnnouncements", JSON.stringify([...next]));
  };

  return (
    <div className="announcement-banner">
      {getMediaUrl(announcement.image) ? <img src={getMediaUrl(announcement.image)} alt="" /> : null}
      <div><strong>{announcement.title}</strong><p>{announcement.message}</p></div>
      {announcement.buttonLink ? <Link to={announcement.buttonLink}>{announcement.buttonText || "Open"}</Link> : null}
      <button type="button" onClick={dismiss}>Dismiss</button>
    </div>
  );
};

export default AnnouncementBanner;
