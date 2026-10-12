"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./profile.module.css";

const emptyForm = {
  shopName: "",
  ownerName: "",
  phone: "",
  address: "",
  pinCode: "",
  googleReviewUrl: "",
};

export default function ProfilePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [business, setBusiness] = useState(null);
  const [account, setAccount] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/business", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load your profile.");
        }

        const selectedBusiness = data.businesses?.[0];

        if (!selectedBusiness) {
          throw new Error("No business is linked to your account yet.");
        }

        if (cancelled) return;

        setBusiness(selectedBusiness);

        setAccount({
          name: selectedBusiness.owner?.name || "",
          email: selectedBusiness.owner?.email || "",
          phone: selectedBusiness.owner?.phone || "",
        });

        setFormData({
          shopName: selectedBusiness.shopName || "",
          ownerName: selectedBusiness.ownerName || "",
          phone: selectedBusiness.phone || "",
          address: selectedBusiness.address || "",
          pinCode: selectedBusiness.pinCode || "",
          googleReviewUrl: selectedBusiness.googleReviewUrl || "",
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!business?.id) {
      setError("Business details are unavailable.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save profile changes.");
      }

      setBusiness((previous) => ({
        ...previous,
        ...data.business,
      }));

      setFormData({
        shopName: data.business.shopName,
        ownerName: data.business.ownerName,
        phone: data.business.phone,
        address: data.business.address,
        pinCode: data.business.pinCode,
        googleReviewUrl: data.business.googleReviewUrl,
      });

      setMessage("Business details saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const menuItems = [
    { label: "Dashboard", href: "/client/dashboard", icon: "⌂" },
    { label: "QR Code", href: "/client/qr", icon: "▦" },
    { label: "Subscription", href: "/client/recharge", icon: "↻" },
    {
      label: "Profile",
      href: "/client/profile",
      icon: "◯",
      active: true,
    },
  ];

  if (loading) {
    return <main className={styles.main}>Loading your profile...</main>;
  }

  return (
    <div className={styles.page}>
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
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? "×" : "☰"}
        </button>
      </header>

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

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>PROFILE & SETTINGS</p>
            <h1>Business profile</h1>
            <p className={styles.businessName}>
              Manage your account and business information.
            </p>
          </div>

          <div className={styles.profileCircle}>
            {(formData.ownerName || "S").charAt(0).toUpperCase()}
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        <form onSubmit={handleSave}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionEyebrow}>ACCOUNT</p>
              <h2>Account information</h2>
              <p>Your registered account details.</p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="accountName">Account name</label>
                <input id="accountName" value={account.name} readOnly />
              </div>

              <div className={styles.field}>
                <label htmlFor="accountEmail">Email</label>
                <input
                  id="accountEmail"
                  type="email"
                  value={account.email}
                  readOnly
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="accountPhone">Account phone</label>
                <input id="accountPhone" value={account.phone} readOnly />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionEyebrow}>BUSINESS</p>
              <h2>Business information</h2>
              <p>Changes are saved to your business record.</p>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="shopName">Business name</label>
                <input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="ownerName">Business owner</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">Business phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="(\+91)?[6-9][0-9]{9}"
                  title="Enter a valid Indian mobile number."
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="pinCode">PIN code</label>
                <input
                  id="pinCode"
                  name="pinCode"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={formData.pinCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="address">Business address</label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor="googleReviewUrl">Google Review URL</label>

                <input
                  id="googleReviewUrl"
                  name="googleReviewUrl"
                  type="url"
                  placeholder="https://www.google.com/maps/..."
                  value={formData.googleReviewUrl}
                  onChange={handleChange}
                  required
                />

                <span className={styles.helperText}>
                  Enter the Google Maps review link for this business. Your
                  existing Shryxa QR identifier is retained.
                </span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <p className={styles.sectionEyebrow}>SUBSCRIPTION</p>
              <h2>Subscription overview</h2>
              <p>
                {business?.subscriptions?.[0]
                  ? `Current status: ${business.subscriptions[0].status}`
                  : "No subscription record was found for this business."}
              </p>
            </div>

            <Link href="/client/recharge" className={styles.secondaryButton}>
              View subscription
            </Link>
          </section>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
              {!saving && <span>✓</span>}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
