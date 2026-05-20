import React from "react";
import { Link, Outlet } from "react-router-dom";
import AnnouncementBanner from "../components/AnnouncementBanner.jsx";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import ScrollRestoration from "../components/ScrollRestoration.jsx";

const MainLayout = () => (
  <div className="app-shell">
    <ScrollRestoration />
    <header className="site-header">
      <Link className="brand logo-brand" to="/" aria-label="Cantley home">
        <img src="/cantley-logo.jpeg" alt="" />
        <span>Cantley</span>
      </Link>
      <Navbar />
    </header>

    <main className="site-main">
      <AnnouncementBanner />
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default MainLayout;
