import React from "react";
import { Outlet } from "react-router-dom";
import AnnouncementBanner from "../components/AnnouncementBanner.jsx";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import ScrollRestoration from "../components/ScrollRestoration.jsx";

const MainLayout = () => (
  <div className="app-shell">
    <ScrollRestoration />
    <AnnouncementBanner />
    <header className="site-header">
      <Navbar />
    </header>
    <main className="site-main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;