"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "../dashboard/admin.module.css";

export default function BusinessesPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [businesses, setBusinesses] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Fetch businesses from the paginated API.
  const fetchBusinesses = useCallback(async (page, limit) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/businesses?page=${page}&limit=${limit}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch businesses.");
      }

      setBusinesses(Array.isArray(data.businesses) ? data.businesses : []);

      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Businesses loading error:", err);

      setError(err.message || "Unable to load businesses.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark the component as mounted only after hydration.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data only after the component has mounted.
  // This keeps the initial server and client HTML consistent.
  useEffect(() => {
    if (!mounted) return;

    fetchBusinesses(1, 10);
  }, [mounted, fetchBusinesses]);

  function changePage(newPage) {
    if (!mounted || loading || newPage < 1) return;

    if (pagination.totalPages > 0 && newPage > pagination.totalPages) {
      return;
    }

    fetchBusinesses(newPage, pagination.limit);
  }

  function changePageSize(event) {
    if (!mounted || loading) return;

    const newLimit = Number(event.target.value);

    if (![10, 20, 50].includes(newLimit)) return;

    fetchBusinesses(1, newLimit);
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    // Use a fixed timezone to avoid server/client date differences.
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  function displayStatus(status) {
    if (!status) return "Unknown";

    return String(status)
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getStatusClass(status) {
    const normalizedStatus = String(status || "").toUpperCase();

    if (normalizedStatus === "ACTIVE") {
      return styles.statusActive;
    }

    if (
      normalizedStatus === "PENDING" ||
      normalizedStatus === "PENDING_PAYMENT" ||
      normalizedStatus === "TRIALING"
    ) {
      return styles.statusPending;
    }

    return styles.statusInactive;
  }

  const menuItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: "⌂",
    },
    {
      label: "Business / Users",
      href: "/admin/businesses",
      icon: "◉",
      active: true,
    },
    {
      label: "Payments",
      href: "/admin/payments",
      icon: "₹",
    },
  ];

  const firstRecord =
    pagination.totalRecords === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const lastRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.totalRecords,
  );

  // Use explicit booleans for every disabled attribute.
  const controlsDisabled = !mounted || loading;
  const previousDisabled = !mounted || loading || !pagination.hasPreviousPage;
  const nextDisabled = !mounted || loading || !pagination.hasNextPage;

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

        <div className={styles.adminLabel}>ADMIN PANEL</div>

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
            <p className={styles.eyebrow}>ADMIN PANEL</p>

            <h1>Business / Users</h1>

            <p className={styles.subtitle}>
              Manage registered businesses and their contact details.
            </p>
          </div>

          <Link href="/admin/dashboard" className={styles.viewLink}>
            ← Dashboard
          </Link>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>BUSINESS MANAGEMENT</p>

              <h2>All businesses</h2>
            </div>

            <span>{mounted ? pagination.totalRecords : 0} total</span>
          </div>

          {/* Error message */}
          {mounted && error && (
            <div
              role="alert"
              style={{
                margin: "16px",
                padding: "12px",
                background: "#fff1f2",
                color: "#b91c1c",
                borderRadius: "8px",
              }}
            >
              {error}

              <button
                type="button"
                disabled={Boolean(loading)}
                onClick={() =>
                  fetchBusinesses(pagination.page, pagination.limit)
                }
                style={{
                  marginLeft: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Businesses table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {!mounted || loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "30px",
                        textAlign: "center",
                      }}
                    >
                      Loading businesses…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "30px",
                        textAlign: "center",
                      }}
                    >
                      Unable to load businesses.
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "30px",
                        textAlign: "center",
                      }}
                    >
                      No businesses found.
                    </td>
                  </tr>
                ) : (
                  businesses.map((business) => (
                    <tr key={business.id}>
                      <td className={styles.businessCell}>
                        {business.shopName}
                      </td>

                      <td>{business.ownerName}</td>

                      <td>{business.phone || "—"}</td>

                      <td>
                        <span
                          className={`${styles.status} ${getStatusClass(
                            business.subscriptionStatus,
                          )}`}
                        >
                          {displayStatus(business.subscriptionStatus)}
                        </span>
                      </td>

                      <td>{formatDate(business.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              padding: "18px 20px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            {/* Rows per page */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <span>Rows per page:</span>

              <select
                value={pagination.limit}
                onChange={changePageSize}
                disabled={Boolean(controlsDisabled)}
                style={{
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#fff",
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <span>
                {mounted
                  ? `${firstRecord}–${lastRecord} of ${pagination.totalRecords}`
                  : "0–0 of 0"}
              </span>
            </div>

            {/* Previous / Next */}
            <div
              style={{
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => changePage(pagination.page - 1)}
                disabled={Boolean(previousDisabled)}
                style={{
                  padding: "8px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: previousDisabled ? "not-allowed" : "pointer",
                  opacity: previousDisabled ? 0.5 : 1,
                }}
              >
                ← Previous
              </button>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 8px",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                Page {mounted ? pagination.page : 1} of{" "}
                {mounted ? Math.max(pagination.totalPages, 1) : 1}
              </span>

              <button
                type="button"
                onClick={() => changePage(pagination.page + 1)}
                disabled={Boolean(nextDisabled)}
                style={{
                  padding: "8px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "#fff",
                  cursor: nextDisabled ? "not-allowed" : "pointer",
                  opacity: nextDisabled ? 0.5 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
