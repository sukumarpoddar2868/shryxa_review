"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./dashboard.module.css";

export default function ClientDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [business, setBusiness] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [businessError, setBusinessError] = useState("");

  const [qrCode, setQrCode] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrError, setQrError] = useState("");

  // Temporary recharge values.
  // We will connect these after verifying the usage-tracking design.




  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
      href: "/client/dashboard",
    },
    { id: "qr", label: "QR Code", icon: "▦", href: "/client/qr" },
    { id: "recharge", label: "Recharge", icon: "↻", href: "/client/recharge" },
    { id: "profile", label: "Profile", icon: "◯", href: "/client/profile" },
  ];

  // Fetch the authenticated user's businesses.
  useEffect(() => {
    let cancelled = false;

    async function fetchBusiness() {
      try {
        setLoadingBusiness(true);
        setBusinessError("");

        const response = await fetch("/api/business", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Unable to load business details.",
          );
        }

        if (!cancelled) {
          const businesses = data.businesses || [];

          if (businesses.length === 0) {
            setBusiness(null);
            setBusinessError(
              "No business found. Please complete your business setup.",
            );
          } else {
            // Use the most recently created business.
            setBusiness(businesses[0]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setBusinessError(
            error.message || "Unable to load your business details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingBusiness(false);
        }
      }
    }

    fetchBusiness();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch or generate the QR for the selected business.
  async function fetchQR() {
    if (!business?.id) {
      setQrError("Your business details are not available.");
      return;
    }

    try {
      setLoadingQR(true);
      setQrError("");
      setQrCode(null);

      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to retrieve your QR code.",
        );
      }

      setQrCode(data.qrCode);
    } catch (error) {
      setQrError(error.message || "Unable to retrieve your QR code.");
    } finally {
      setLoadingQR(false);
    }
  }


  function handleMenuClick(menuId) {
    setActiveMenu(menuId);
    setMobileMenu(false);

    if (menuId === "qr") {
      fetchQR();
    }
  }

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
    });
  };

  return (
    <div className={styles.dashboard}>
      {/* MOBILE HEADER */}
      <header className={styles.mobileHeader}>
        <Link href="/" className={styles.mobileBrand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
          </span>

          <span>Shryxa</span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? "×" : "☰"}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${mobileMenu ? styles.sidebarOpen : ""}`}
      >
        <Link href="/" className={styles.brand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
          </span>

          <span className={styles.brandText}>Shryxa</span>
        </Link>

        <nav className={styles.navigation}>
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => handleMenuClick(item.id)}
              className={`${styles.navItem} ${
                item.id === activeMenu ? styles.active : ""
              }`}
              aria-current={item.id === activeMenu ? "page" : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout belongs inside the sidebar */}
        <div className={styles.sidebarBottom}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <span className={styles.navIcon}>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {/* MAIN CONTENT */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>CLIENT DASHBOARD</p>

            <h1>
              {activeMenu === "dashboard"
                ? "Welcome back"
                : menuItems.find((item) => item.id === activeMenu)?.label}
            </h1>

            <p className={styles.businessName}>
              {loadingBusiness
                ? "Loading business..."
                : business?.shopName || "Your Business"}
            </p>
          </div>

          <div className={styles.profileCircle}>
            {(business?.ownerName || business?.shopName || "S")
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>

        {/* BUSINESS LOADING AND ERROR MESSAGES */}
        {loadingBusiness && (
          <p role="status">Loading your business details...</p>
        )}

        {!loadingBusiness && businessError && (
          <p role="alert">{businessError}</p>
        )}

        {/* DASHBOARD VIEW */}
        {activeMenu === "dashboard" && (
          <>
            <section className={styles.rechargeSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>SUBSCRIPTION</p>
                  <h2>Your Shryxa subscription</h2>
                  <p>Manage your subscription and view your payment history.</p>
                </div>
              </div>

              <div className={styles.rechargeCard}>
                <div className={styles.rechargeBottom}>
                  <div className={styles.remainingContainer}>
                    <span className={styles.remainingLabel}>
                      Monthly subscription
                    </span>

                    <div className={styles.remainingNumber}>
                      ₹199
                      <span>/ month</span>
                    </div>

                    <p>
                      Review usage statistics will appear here when usage
                      tracking is implemented.
                    </p>
                  </div>

                  <Link
                    href="/client/recharge"
                    className={styles.rechargeButton}
                  >
                    View Subscription <span>↗</span>
                  </Link>
                </div>
              </div>
            </section>

            <section className={styles.qrSection}>
              <div>
                <p className={styles.sectionEyebrow}>QR CODE</p>
                <h2>Your review QR code</h2>

                <p>
                  Customers can scan your QR code to open your Shryxa review
                  page.
                </p>
              </div>

              <Link href="/client/qr" className={styles.secondaryButton}>
                View QR <span>→</span>
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

