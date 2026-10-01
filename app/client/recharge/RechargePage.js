"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./recharge.module.css";

export default function RechargePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(100);

  const businessName = "Your Business";

  // Temporary frontend values.
  // These will come from the backend later.
  const currentBalance = 28;
  const totalPurchased = 100;
  const used = totalPurchased - currentBalance;

  const usagePercentage = (used / totalPurchased) * 100;

  const packages = [
    {
      tokens: 50,
      price: 99,
    },
    {
      tokens: 100,
      price: 179,
      popular: true,
    },
    {
      tokens: 250,
      price: 399,
    },
    {
      tokens: 500,
      price: 699,
    },
  ];

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
      active: true,
    },
    {
      label: "Profile",
      href: "/client/profile",
      icon: "◯",
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
            <p className={styles.eyebrow}>RECHARGE</p>

            <h1>Recharge</h1>

            <p className={styles.businessName}>
              {businessName}
            </p>
          </div>

          <div className={styles.profileCircle}>
            S
          </div>
        </div>

        {/* =========================
            CURRENT BALANCE
        ========================== */}
        <section className={styles.balanceCard}>
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>
              Current recharge
            </span>

            <div className={styles.balanceNumber}>
              {currentBalance}
              <span> reviews</span>
            </div>
          </div>

          <div className={styles.balanceUsage}>
            <div className={styles.usageTop}>
              <span>Monthly usage</span>

              <strong>
                {Math.round(usagePercentage)}%
              </strong>
            </div>

            <div className={styles.usageTrack}>
              <div
                className={styles.usageBar}
                style={{
                  width: `${usagePercentage}%`,
                }}
              />
            </div>

            <div className={styles.usageBottom}>
              <span>{used} used</span>

              <span>{currentBalance} remaining</span>
            </div>
          </div>
        </section>

        {/* =========================
            PACKAGE SECTION
        ========================== */}
        <section className={styles.packageSection}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>
              RECHARGE PLANS
            </p>

            <h2>Choose your recharge</h2>

            <p>
              Select the number of review credits you want
              to add.
            </p>
          </div>

          <div className={styles.packageGrid}>
            {packages.map((pkg) => {
              const selected =
                selectedPackage === pkg.tokens;

              return (
                <button
                  key={pkg.tokens}
                  type="button"
                  className={`${styles.packageCard} ${
                    selected ? styles.packageSelected : ""
                  }`}
                  onClick={() =>
                    setSelectedPackage(pkg.tokens)
                  }
                >
                  {pkg.popular && (
                    <span className={styles.popularBadge}>
                      Popular
                    </span>
                  )}

                  <div className={styles.packageTokens}>
                    {pkg.tokens}
                  </div>

                  <div className={styles.packageLabel}>
                    reviews
                  </div>

                  <div className={styles.packagePrice}>
                    ₹{pkg.price}
                  </div>

                  <div className={styles.packageSelect}>
                    {selected ? "Selected" : "Select"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================
            PAYMENT SUMMARY
        ========================== */}
        <section className={styles.paymentCard}>
          <div>
            <p className={styles.sectionEyebrow}>
              PAYMENT
            </p>

            <h2>Recharge summary</h2>
          </div>

          <div className={styles.summaryRow}>
            <span>Current balance</span>

            <strong>{currentBalance} reviews</strong>
          </div>

          <div className={styles.summaryRow}>
            <span>Selected recharge</span>

            <strong>{selectedPackage} reviews</strong>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.summaryTotal}>
            <span>Total amount</span>

            <strong>
              ₹
              {
                packages.find(
                  (pkg) => pkg.tokens === selectedPackage
                )?.price
              }
            </strong>
          </div>

          <button
            type="button"
            className={styles.payButton}
          >
            Continue to Payment

            <span>→</span>
          </button>
        </section>
      </main>
    </div>
  );
}
