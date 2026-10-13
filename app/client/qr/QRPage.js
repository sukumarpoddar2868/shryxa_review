"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./qr.module.css";

export default function QRPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [business, setBusiness] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState(null);


  const menuItems = [
    { label: "Dashboard", href: "/client/dashboard", icon: "⌂" },
    { label: "QR Code", href: "/client/qr", icon: "▦", active: true },
    { label: "Recharge", href: "/client/dashboard", icon: "↻" },
    { label: "Profile", href: "/client/dashboard", icon: "◯" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadQRCode() {
      try {
        setLoading(true);
        setError("");

        // Retrieve the logged-in user's businesses.
        const businessResponse = await fetch("/api/business", {
          method: "GET",
          cache: "no-store",
        });

        const businessData = await businessResponse.json();

        if (!businessResponse.ok) {
          throw new Error(
            businessData.error || "Unable to load your business.",
          );
        }

        // Support either an array response or an object containing businesses.
        const businesses = Array.isArray(businessData)
          ? businessData
          : businessData.businesses ||
            (businessData.business ? [businessData.business] : []);

        if (businesses.length === 0) {
          throw new Error(
            "No business was found. Please complete your business setup first.",
          );
        }

        const selectedBusiness = businesses[0];

        // Generate or retrieve the QR for this business.
        const qrResponse = await fetch("/api/qr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId: selectedBusiness.id,
          }),
          cache: "no-store",
        });

        const qrData = await qrResponse.json();

        if (!qrResponse.ok) {
          throw new Error(qrData.error || "Unable to load your QR code.");
        }

        if (!cancelled) {
          setBusiness(qrData.business);
          setQrCode(qrData.qrCode);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQRCode();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleDownload() {
    if (!qrCode?.image) return;

    const link = document.createElement("a");
    link.href = qrCode.image;
    link.download = `shryxa-qr-${qrCode.qrIdentifier}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  async function downloadStandeePDF(format) {
    if (!business?.id) {
      setError("Business information is missing. Please try again.");
      return;
    }

    setDownloadingFormat(format);
    setError("");

    try {
      const response = await fetch("/api/qr/standee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          format,
        }),
      });

      if (!response.ok) {
        let message = "Unable to download the standee template.";

        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // Use the default error message.
        }

        throw new Error(message);
      }

      const pdfBlob = await response.blob();

      if (!pdfBlob.size) {
        throw new Error("The generated PDF is empty.");
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        format === "4x6"
          ? "shryxa-review-standee-4x6-inch.pdf"
          : "shryxa-review-standee-12x12-cm.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Allow the browser to start the download before releasing the URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Standee download error:", err);
      setError(err.message || "Unable to download the standee template.");
    } finally {
      setDownloadingFormat(null);
    }
  }

  return (
    <div className={styles.page}>
      {/* Mobile header */}
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
          onClick={() => setMobileMenu((previous) => !previous)}
          aria-label="Toggle navigation"
        >
          {mobileMenu ? "×" : "☰"}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${mobileMenu ? styles.sidebarOpen : ""}`}
      >
        <Link href="/" className={styles.brand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
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
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <span className={styles.navIcon}>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>QR CODE</p>
            <h1>Your Review QR</h1>
            <p className={styles.businessName}>
              {business?.shopName || "Your Business"}
            </p>
          </div>

          <div className={styles.profileCircle}>S</div>
        </div>

        <section className={styles.qrCard}>
          {loading ? (
            <div className={styles.qrInfo}>
              <h2>Loading your QR code...</h2>
              <p className={styles.description}>
                Please wait while we retrieve your business information.
              </p>
            </div>
          ) : error ? (
            <div className={styles.qrInfo}>
              <h2>Unable to load QR code</h2>
              <p className={styles.description}>{error}</p>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => window.location.reload()}
              >
                Try Again ↻
              </button>
            </div>
          ) : (
            <>
              {/* Real QR preview */}
              <div className={styles.qrPreviewSection}>
                <div className={styles.qrBox}>
                  <img
                    src={qrCode.image}
                    alt={`Review QR code for ${business.shopName}`}
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "280px",
                      height: "auto",
                      background: "#fff",
                    }}
                  />
                </div>

                <div className={styles.activeStatus}>
                  <span className={styles.statusDot} />
                  {qrCode.status === "ACTIVE" ? "Active" : qrCode.status}
                </div>
              </div>

              {/* QR information */}
              <div className={styles.qrInfo}>
                <p className={styles.sectionEyebrow}>BUSINESS QR</p>

                <h2>Let customers scan and review</h2>

                <p className={styles.description}>
                  Customers can scan this QR code to open your Shryxa review
                  experience.
                </p>

                <div className={styles.infoItem}>
                  <span>QR Identifier</span>
                  <strong>{qrCode.qrIdentifier}</strong>
                </div>

                <div className={styles.infoItem}>
                  <span>Destination</span>
                  <div className={styles.urlBox}>{qrCode.destinationUrl}</div>
                </div>

                <div className={styles.actions}>
                  {/* Download the QR image */}
                  <button
                    type="button"
                    className={styles.downloadButton}
                    onClick={handleDownload}
                  >
                    Download QR <span>↓</span>
                  </button>

                  {/* Download portrait standee PDF */}
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => downloadStandeePDF("4x6")}
                    disabled={downloadingFormat !== null}
                  >
                    {downloadingFormat === "4x6"
                      ? "Generating Portrait PDF..."
                      : "Download Portrait Standee"}
                  </button>

                  {/* Download square standee PDF */}
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => downloadStandeePDF("12x12cm")}
                    disabled={downloadingFormat !== null}
                  >
                    {downloadingFormat === "12x12cm"
                      ? "Generating Square PDF..."
                      : "Download Square Standee"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
