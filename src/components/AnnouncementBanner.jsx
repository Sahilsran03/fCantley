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

  const label = announcement.buttonText || "Learn more";
  const link = /^\/(?!\/)/.test(announcement.buttonLink || "")
    ? <Link to={announcement.buttonLink}>{label}</Link>
    : /^(https?:\/\/|mailto:|tel:)/i.test(announcement.buttonLink || "")
      ? <a href={announcement.buttonLink}>{label}</a>
      : null;

  return (
    <aside className="announcement-banner" aria-label="Store announcement">
      <div className="announcement-inner">
        {getMediaUrl(announcement.image) ? <img src={getMediaUrl(announcement.image)} alt="" /> : null}
        <div className="announcement-copy"><strong>{announcement.title}</strong><span>{announcement.message}</span></div>
        {link}
        <button type="button" className="announcement-dismiss" onClick={dismiss} aria-label="Dismiss announcement">Dismiss</button>
      </div>
    </aside>
  );
};

export default AnnouncementBanner;