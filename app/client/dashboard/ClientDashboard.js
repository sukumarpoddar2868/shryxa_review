"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

export default function ClientDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Temporary mock data.
  // Later these values will come from the backend/database.
  const businessName = "Your Business";

  const totalRecharge = 100;
  const reviewsUsed = 72;
  const reviewsRemaining = totalRecharge - reviewsUsed;

  // Overall monthly usage
  const usageProgress = (reviewsUsed / totalRecharge) * 100;

  // Remaining recharge percentage
  const remainingProgress = (reviewsRemaining / totalRecharge) * 100;

  // Color of remaining recharge bar
  const getRemainingBarClass = () => {
    if (remainingProgress <= 20) {
      return styles.barRed;
    }

    if (remainingProgress <= 50) {
      return styles.barOrange;
    }

    if (remainingProgress <= 80) {
      return styles.barLightBlue;
    }

    return styles.barBlue;
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "qr",
      label: "QR Code",
      icon: "▦",
    },
    {
      id: "recharge",
      label: "Recharge",
      icon: "↻",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "◯",
    },
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setMobileMenu(false);
  };

  return (
    <div className={styles.dashboard}>
      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
          </span>

          <span>Shryxa</span>
        </Link>

        <button
          className={styles.menuButton}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation menu"
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
        {/* Brand */}
        <Link href="/" className={styles.brand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
          </span>

          <span className={styles.brandText}>Shryxa</span>
        </Link>

        {/* Navigation */}
        <nav className={styles.navigation}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${
                activeMenu === item.id ? styles.active : ""
              }`}
              onClick={() => handleMenuClick(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className={styles.sidebarBottom}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => {
              // Logout functionality will be connected later.
            }}
          >
            <span className={styles.navIcon}>↪</span>

            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>CLIENT DASHBOARD</p>

            <h1>Welcome back</h1>

            <p className={styles.businessName}>{businessName}</p>
          </div>

          <div className={styles.profileCircle}>S</div>
        </div>

        {/* =========================
            RECHARGE SECTION
        ========================== */}
        <section className={styles.rechargeSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>RECHARGE</p>

              <h2>Your review growth</h2>

              <p>
                Track your monthly review usage and remaining recharge.
              </p>
            </div>
          </div>

          <div className={styles.rechargeCard}>
            {/* Monthly usage */}
            <div className={styles.progressHeader}>
              <div className={styles.progressInfo}>
                <span className={styles.label}>
                  Reviews this month
                </span>

                <strong>
                  {reviewsUsed} / {totalRecharge}
                </strong>
              </div>

              <span className={styles.percentage}>
                {Math.round(usageProgress)}%
              </span>
            </div>

            {/* Usage progress */}
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{
                  width: `${usageProgress}%`,
                }}
              />
            </div>

            <div className={styles.progressFooter}>
              <span>{reviewsUsed} reviews used</span>

              <span>{reviewsRemaining} remaining</span>
            </div>

            {/* =========================
                REMAINING RECHARGE
            ========================== */}
            <div className={styles.rechargeBottom}>
              <div className={styles.remainingContainer}>
                <span className={styles.remainingLabel}>
                  Recharge remaining
                </span>

                <div className={styles.remainingNumber}>
                  {reviewsRemaining}

                  <span> reviews</span>
                </div>

                {/* Remaining recharge color bar */}
                <div className={styles.remainingProgressTrack}>
                  <div
                    className={`${styles.remainingProgressBar} ${getRemainingBarClass()}`}
                    style={{
                      width: `${remainingProgress}%`,
                    }}
                  />
                </div>
              </div>

              {/* Recharge button */}
              <button
                type="button"
                className={styles.rechargeButton}
              >
                Recharge Now

                <span>↗</span>
              </button>
            </div>
          </div>
        </section>

        {/* =========================
            QR SECTION
        ========================== */}
        <section className={styles.qrSection}>
          <div>
            <p className={styles.sectionEyebrow}>QR CODE</p>

            <h2>Your review QR is active</h2>

            <p>
              Customers can scan your QR code to start the Shryxa
              review flow.
            </p>
          </div>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => handleMenuClick("qr")}
          >
            View QR

            <span>→</span>
          </button>
        </section>
      </main>
    </div>
  );
}
