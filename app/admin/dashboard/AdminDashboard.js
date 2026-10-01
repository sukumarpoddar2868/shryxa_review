"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);

  // Temporary mock data.
  // Later these values will come from the database.
  const stats = {
    totalBusinesses: 128,
    activeBusinesses: 116,
    totalUsers: 142,
    totalRevenue: 184950,
  };

  const businesses = [
    {
      business: "ABC Restaurant",
      owner: "Rahul Kumar",
      email: "rahul@example.com",
      status: "Active",
    },
    {
      business: "Green Cafe",
      owner: "Amit Sharma",
      email: "amit@example.com",
      status: "Active",
    },
    {
      business: "Urban Salon",
      owner: "Priya Singh",
      email: "priya@example.com",
      status: "Active",
    },
    {
      business: "Fresh Bakery",
      owner: "Ankit Das",
      email: "ankit@example.com",
      status: "Inactive",
    },
  ];

  const payments = [
    {
      business: "ABC Restaurant",
      amount: 999,
      status: "Success",
      date: "30 Sep 2026",
    },
    {
      business: "Green Cafe",
      amount: 499,
      status: "Success",
      date: "29 Sep 2026",
    },
    {
      business: "Urban Salon",
      amount: 1799,
      status: "Success",
      date: "28 Sep 2026",
    },
    {
      business: "Fresh Bakery",
      amount: 499,
      status: "Pending",
      date: "27 Sep 2026",
    },
  ];

  const menuItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: "⌂",
      active: true,
    },
    {
      label: "Business / Users",
      href: "/admin/businesses",
      icon: "◉",
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: "₹",
    },
  ];

  return (
    <div className={styles.page}>
      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand}>
          <span className={styles.logoBox}>
            <img
              src="/shryxa-logo.png"
              alt="Shryxa Review"
            />
          </span>

          <span>Shryxa</span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
        >
          {mobileMenu ? "×" : "☰"}
        </button>
      </header>

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={`${styles.sidebar} ${
          mobileMenu ? styles.sidebarOpen : ""
        }`}
      >
        <Link href="/" className={styles.brand}>
          <span className={styles.logoBox}>
            <img
              src="/shryxa-logo.png"
              alt="Shryxa Review"
            />
          </span>

          <span>Shryxa</span>
        </Link>

        <div className={styles.adminLabel}>
          ADMIN PANEL
        </div>

        <nav className={styles.navigation}>
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.navItem} ${
                item.active ? styles.active : ""
              }`}
              onClick={() => setMobileMenu(false)}
            >
              <span className={styles.navIcon}>
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            type="button"
            className={styles.logoutButton}
          >
            <span className={styles.navIcon}>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN
      ========================== */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>
              ADMIN DASHBOARD
            </p>

            <h1>Overview</h1>

            <p className={styles.subtitle}>
              Manage your Shryxa platform.
            </p>
          </div>

          <div className={styles.profileCircle}>
            A
          </div>
        </div>

        {/* =========================
            OVERVIEW STATS
        ========================== */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Total Businesses
            </span>

            <strong className={styles.statValue}>
              {stats.totalBusinesses}
            </strong>

            <span className={styles.statDescription}>
              Registered businesses
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Active Businesses
            </span>

            <strong className={styles.statValue}>
              {stats.activeBusinesses}
            </strong>

            <span className={styles.statDescription}>
              Currently active
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Total Users
            </span>

            <strong className={styles.statValue}>
              {stats.totalUsers}
            </strong>

            <span className={styles.statDescription}>
              Registered users
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              Total Revenue
            </span>

            <strong className={styles.statValue}>
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </strong>

            <span className={styles.statDescription}>
              Payments received
            </span>
          </div>
        </section>

        {/* =========================
            BUSINESS / USERS
        ========================== */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                BUSINESS / USERS
              </p>

              <h2>Recent businesses</h2>
            </div>

            <Link
              href="/admin/businesses"
              className={styles.viewLink}
            >
              View all →
            </Link>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {businesses.map((business) => (
                  <tr key={business.email}>
                    <td className={styles.businessCell}>
                      {business.business}
                    </td>

                    <td>{business.owner}</td>

                    <td>{business.email}</td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          business.status === "Active"
                            ? styles.statusActive
                            : styles.statusInactive
                        }`}
                      >
                        {business.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================
            PAYMENTS
        ========================== */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                PAYMENTS
              </p>

              <h2>Recent payments</h2>
            </div>

            <Link
              href="/admin/payments"
              className={styles.viewLink}
            >
              View all →
            </Link>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment, index) => (
                  <tr key={`${payment.business}-${index}`}>
                    <td className={styles.businessCell}>
                      {payment.business}
                    </td>

                    <td>
                      ₹
                      {payment.amount.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${
                          payment.status === "Success"
                            ? styles.statusActive
                            : styles.statusPending
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td>{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
