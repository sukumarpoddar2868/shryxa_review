"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  // Temporary mock data.
  // Later this data will come from the authenticated user/business.
  const [formData, setFormData] = useState({
    fullName: "Sukumar Poddar",
    email: "sukumar@example.com",
    phone: "+91 98765 43210",

    businessName: "Your Business",
    ownerName: "Sukumar Poddar",
    businessPhone: "+91 98765 43210",
    address: "Business Address",
    pinCode: "700001",
    googleReviewUrl:
      "https://google.com/maps/your-business",
  });

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
    },
    {
      label: "Recharge",
      href: "/client/recharge",
      icon: "↻",
    },
    {
      label: "Profile",
      href: "/client/profile",
      icon: "◯",
      active: true,
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    // Backend/database integration will be added later.
    alert("Profile changes will be saved after backend integration.");
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
            <p className={styles.eyebrow}>PROFILE</p>

            <h1>Profile</h1>

            <p className={styles.businessName}>
              Manage your account and business information
            </p>
          </div>

          <div className={styles.profileCircle}>
            S
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* =========================
              ACCOUNT INFORMATION
          ========================== */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionEyebrow}>
                ACCOUNT
              </p>

              <h2>Personal information</h2>

              <p>
                Your account information used to access
                Shryxa.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="fullName">
                  Full Name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">
                  Phone
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* =========================
              BUSINESS INFORMATION
          ========================== */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionEyebrow}>
                BUSINESS
              </p>

              <h2>Business information</h2>

              <p>
                Information about the business connected
                to your Shryxa account.
              </p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="businessName">
                  Business Name
                </label>

                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="ownerName">
                  Owner Name
                </label>

                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  value={formData.ownerName}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="businessPhone">
                  Business Phone
                </label>

                <input
                  id="businessPhone"
                  name="businessPhone"
                  type="tel"
                  value={formData.businessPhone}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="pinCode">
                  PIN Code
                </label>

                <input
                  id="pinCode"
                  name="pinCode"
                  type="text"
                  value={formData.pinCode}
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.fullWidth}`}
              >
                <label htmlFor="address">
                  Business Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div
                className={`${styles.field} ${styles.fullWidth}`}
              >
                <label htmlFor="googleReviewUrl">
                  Google Review URL
                </label>

                <input
                  id="googleReviewUrl"
                  name="googleReviewUrl"
                  type="url"
                  value={formData.googleReviewUrl}
                  onChange={handleChange}
                />

                <span className={styles.helperText}>
                  Customers will be redirected to this
                  Google review page after the Shryxa flow.
                </span>
              </div>
            </div>
          </section>

          {/* =========================
              SECURITY
          ========================== */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionEyebrow}>
                SECURITY
              </p>

              <h2>Account security</h2>

              <p>
                Manage your account password and access.
              </p>
            </div>

            <div className={styles.securityRow}>
              <div>
                <strong>Password</strong>

                <p>
                  Change your password to keep your
                  account secure.
                </p>
              </div>

              <button
                type="button"
                className={styles.secondaryButton}
              >
                Change Password
              </button>
            </div>
          </section>

          {/* =========================
              SAVE
          ========================== */}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
            >
              Save Changes
              <span>✓</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
