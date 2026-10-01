"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./qr.module.css";

export default function QRPage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  const businessName = "Your Business";

  // Temporary frontend data.
  // Later these values will come from the backend/database.
  const reviewUrl =
    "https://shryxa.com/review/your-business";

  const qrIdentifier = "SHRYXA-QR-001";

  const menuItems = [
    {
      label: "Dashboard",
      href: "/client/dashboard",
      icon: "⌂",
    },
    {
      label: "QR Code",
      href: "/client/qr",
      icon: "▦",
      active: true,
    },
    {
      label: "Recharge",
      href: "/client/dashboard",
      icon: "↻",
    },
    {
      label: "Profile",
      href: "/client/dashboard",
      icon: "◯",
    },
  ];

  const handleDownload = () => {
    // QR download will be connected to the generated QR image later.
    alert("QR download will be available after backend integration.");
  };

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
          MAIN CONTENT
      ========================== */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>QR CODE</p>

            <h1>Your Review QR</h1>

            <p className={styles.businessName}>
              {businessName}
            </p>
          </div>

          <div className={styles.profileCircle}>
            S
          </div>
        </div>

        {/* =========================
            QR CONTENT
        ========================== */}
        <section className={styles.qrCard}>
          {/* QR Preview */}
          <div className={styles.qrPreviewSection}>
            <div className={styles.qrBox}>
              {/* Temporary QR visual */}
              <div className={styles.fakeQr}>
                <div className={styles.qrCornerTopLeft} />
                <div className={styles.qrCornerTopRight} />
                <div className={styles.qrCornerBottomLeft} />

                <div className={styles.qrPattern}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>

            <div className={styles.activeStatus}>
              <span className={styles.statusDot} />
              Active
            </div>
          </div>

          {/* QR Information */}
          <div className={styles.qrInfo}>
            <p className={styles.sectionEyebrow}>
              BUSINESS QR
            </p>

            <h2>
              Let customers scan and review
            </h2>

            <p className={styles.description}>
              Customers can scan this QR code to open
              your Shryxa review experience.
            </p>

            {/* QR ID */}
            <div className={styles.infoItem}>
              <span>QR Identifier</span>

              <strong>{qrIdentifier}</strong>
            </div>

            {/* Destination */}
            <div className={styles.infoItem}>
              <span>Destination</span>

              <div className={styles.urlBox}>
                {reviewUrl}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.downloadButton}
                onClick={handleDownload}
              >
                Download QR
                <span>↓</span>
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
              >
                Regenerate
                <span>↻</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
