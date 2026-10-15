"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);

  // Dashboard data
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  const [businesses, setBusinesses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");

  // Order modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState("");
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [shippingError, setShippingError] = useState("");
  const [shippingSuccess, setShippingSuccess] = useState("");

  // Standee PDF download state
  const [standeeDownload, setStandeeDownload] = useState(null);
  const [standeeDownloadError, setStandeeDownloadError] = useState("");

  // Dashboard navigation
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

  // Fetch dashboard statistics, businesses, and payments
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load dashboard data.");
      }

      setStats({
        totalBusinesses: Number(data.stats?.totalBusinesses ?? 0),
        activeBusinesses: Number(data.stats?.activeBusinesses ?? 0),
        totalUsers: Number(data.stats?.totalUsers ?? 0),
        totalRevenue: Number(data.stats?.totalRevenue ?? 0),
      });

      setBusinesses(
        Array.isArray(data.recentBusinesses) ? data.recentBusinesses : [],
      );

      setPayments(
        Array.isArray(data.recentPayments) ? data.recentPayments : [],
      );
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch paid orders awaiting shipment
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError("");

      const response = await fetch("/api/admin/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load pending orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("Pending orders loading error:", err);
      setOrdersError(err.message || "Unable to load pending orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchOrders();
  }, [fetchDashboard, fetchOrders]);

  // Fetch complete details when an order row is double-clicked
  async function openOrderDetails(orderId) {
    setSelectedOrder(null);
    setOrderDetailsError("");
    setShippingError("");
    setShippingSuccess("");
    setStandeeDownloadError("");
    setOrderDetailsLoading(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load order details.");
      }

      setSelectedOrder(data.order);
    } catch (err) {
      console.error("Order details error:", err);
      setOrderDetailsError(err.message || "Unable to load order details.");
    } finally {
      setOrderDetailsLoading(false);
    }
  }

  // Mark an order as shipped
  async function markOrderAsShipped(orderId) {
    const confirmed = window.confirm(
      "Are you sure you want to mark this order as shipped?",
    );

    if (!confirmed) return;

    try {
      setShippingOrderId(orderId);
      setShippingError("");
      setShippingSuccess("");

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update shipment status.");
      }

      setShippingSuccess("Order marked as shipped successfully.");

      // Remove the shipped order from the pending orders list
      setOrders((previousOrders) =>
        previousOrders.filter((order) => order.id !== orderId),
      );

      // Update the currently displayed order details
      setSelectedOrder((previousOrder) => {
        if (!previousOrder || previousOrder.id !== orderId) {
          return previousOrder;
        }

        return {
          ...previousOrder,
          fulfilmentStatus: data.order.fulfilmentStatus,
          shippedAt: data.order.shippedAt,
        };
      });

      // Refresh dashboard data
      await fetchDashboard();
    } catch (err) {
      console.error("Shipping update error:", err);
      setShippingError(err.message || "Unable to update shipment status.");
    } finally {
      setShippingOrderId(null);
    }
  }

  // Download the standee PDF associated with a specific order
  async function downloadOrderStandee(orderId, format) {
    setStandeeDownload({ orderId, format });
    setStandeeDownloadError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/standee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        let message = "Unable to download the standee PDF.";

        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // Keep the default error message.
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
          ? `order-${orderId}-standee-4x6-inch.pdf`
          : `order-${orderId}-standee-12x12-cm.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Admin standee download error:", err);

      setStandeeDownloadError(
        err.message || "Unable to download the standee PDF.",
      );
    } finally {
      setStandeeDownload(null);
    }
  }

  // Formatting helpers
  function formatCurrency(amount, currency = "INR") {
    const numericAmount = Number(amount ?? 0);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(numericAmount);
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function displayStatus(status) {
    if (!status) return "Unknown";

    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getStatusClass(status) {
    const normalizedStatus = String(status || "").toUpperCase();

    if (
      ["ACTIVE", "SUCCESS", "PAID", "SHIPPED", "DELIVERED"].includes(
        normalizedStatus,
      )
    ) {
      return styles.statusActive;
    }

    if (
      ["PENDING", "PENDING_PAYMENT", "PROCESSING"].includes(normalizedStatus)
    ) {
      return styles.statusPending;
    }

    return styles.statusInactive;
  }

  // Common table styles for the orders section and modal
  const extraStyles = {
    empty: {
      padding: "28px 16px",
      textAlign: "center",
      color: "#777",
    },
    message: {
      padding: "12px 16px",
      marginBottom: "14px",
      borderRadius: "8px",
      background: "#fff4e5",
      color: "#8a4b08",
      fontSize: "14px",
    },
    orderRow: {
      cursor: "pointer",
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 1000,
      overflowY: "auto",
    },
    modal: {
      background: "#fff",
      width: "100%",
      maxWidth: "650px",
      maxHeight: "90vh",
      overflowY: "auto",
      borderRadius: "14px",
      padding: "24px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    },
    modalHeader: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "16px",
      marginBottom: "22px",
    },
    closeButton: {
      border: "none",
      background: "#f1f5f9",
      borderRadius: "8px",
      width: "36px",
      height: "36px",
      cursor: "pointer",
      fontSize: "22px",
      flexShrink: 0,
    },
    detailsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
    },
    detailItem: {
      padding: "12px",
      background: "#f8fafc",
      borderRadius: "8px",
      overflowWrap: "anywhere",
    },
    detailLabel: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "5px",
    },
    detailValue: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#172033",
      margin: 0,
    },
    primaryButton: {
      border: "none",
      borderRadius: "8px",
      padding: "11px 16px",
      background: "#172033",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer",
    },
    secondaryButton: {
      border: "1px solid #dbe1e8",
      borderRadius: "8px",
      padding: "10px 16px",
      background: "#fff",
      color: "#172033",
      cursor: "pointer",
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      flexWrap: "wrap",
      marginTop: "24px",
    },
  };

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
          onClick={() => setMobileMenu(!mobileMenu)}
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

      {/* Main dashboard */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>ADMIN DASHBOARD</p>
            <h1>Overview</h1>
            <p className={styles.subtitle}>Manage your Shryxa platform.</p>
          </div>
          <div className={styles.profileCircle}>A</div>
        </div>

        {error && (
          <div style={extraStyles.message} role="alert">
            {error}
            <button
              type="button"
              onClick={fetchDashboard}
              style={{
                marginLeft: "12px",
                cursor: "pointer",
                border: "none",
                background: "transparent",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Overview statistics */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Businesses</span>
            <strong className={styles.statValue}>
              {loading ? "…" : stats.totalBusinesses}
            </strong>
            <span className={styles.statDescription}>
              Registered businesses
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Businesses</span>
            <strong className={styles.statValue}>
              {loading ? "…" : stats.activeBusinesses}
            </strong>
            <span className={styles.statDescription}>Currently active</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Users</span>
            <strong className={styles.statValue}>
              {loading ? "…" : stats.totalUsers}
            </strong>
            <span className={styles.statDescription}>
              Registered client users
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Revenue</span>
            <strong className={styles.statValue}>
              {loading ? "…" : formatCurrency(stats.totalRevenue)}
            </strong>
            <span className={styles.statDescription}>Successful payments</span>
          </div>
        </section>

        {/* Businesses / Users */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>BUSINESS / USERS</p>
              <h2>Recent businesses</h2>
            </div>

            <Link href="/admin/businesses" className={styles.viewLink}>
              View all →
            </Link>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Owner</th>
                  <th>Mobile</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={extraStyles.empty}>
                      Loading businesses…
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={extraStyles.empty}>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payments */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>PAYMENTS</p>
              <h2>Recent payments</h2>
            </div>

            <Link href="/admin/payments" className={styles.viewLink}>
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
                {loading ? (
                  <tr>
                    <td colSpan={4} style={extraStyles.empty}>
                      Loading payments…
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={extraStyles.empty}>
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className={styles.businessCell}>
                        {payment.business?.shopName || "—"}
                      </td>
                      <td>
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${getStatusClass(
                            payment.status,
                          )}`}
                        >
                          {displayStatus(payment.status)}
                        </span>
                      </td>
                      <td>{formatDate(payment.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pending standee orders */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.sectionEyebrow}>STANDEE ORDERS</p>
              <h2>Orders awaiting shipment</h2>
              <p className={styles.subtitle}>
                Double-click an order to view its complete details.
              </p>
            </div>

            <button
              type="button"
              style={extraStyles.secondaryButton}
              onClick={fetchOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {ordersError && (
            <div style={extraStyles.message} role="alert">
              {ordersError}
              <button
                type="button"
                onClick={fetchOrders}
                style={{
                  marginLeft: "12px",
                  cursor: "pointer",
                  border: "none",
                  background: "transparent",
                  textDecoration: "underline",
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Recipient</th>
                  <th>Mobile</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Order date</th>
                </tr>
              </thead>

              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={7} style={extraStyles.empty}>
                      Loading pending orders…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={extraStyles.empty}>
                      No paid orders are awaiting shipment.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      style={extraStyles.orderRow}
                      onDoubleClick={() => openOrderDetails(order.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          openOrderDetails(order.id);
                        }
                      }}
                      tabIndex={0}
                      title="Double-click to view complete order details"
                    >
                      <td>#{order.id}</td>
                      <td>{order.product?.name || "Standee"}</td>
                      <td>{order.recipientName}</td>
                      <td>{order.recipientPhone}</td>
                      <td>{order.quantity}</td>
                      <td>
                        {formatCurrency(order.totalAmount, order.currency)}
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Order details modal */}
      {(orderDetailsLoading || selectedOrder || orderDetailsError) && (
        <div
          style={extraStyles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
              setOrderDetailsError("");
            }
          }}
        >
          <div
            style={extraStyles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
          >
            <div style={extraStyles.modalHeader}>
              <div>
                <p className={styles.sectionEyebrow}>STANDEE ORDER</p>
                <h2 id="order-modal-title">
                  {selectedOrder
                    ? `Order #${selectedOrder.id}`
                    : "Order details"}
                </h2>
              </div>

              <button
                type="button"
                style={extraStyles.closeButton}
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderDetailsError("");
                  setShippingError("");
                  setShippingSuccess("");
                  setStandeeDownloadError("");
                }}
                aria-label="Close order details"
              >
                ×
              </button>
            </div>

            {orderDetailsLoading && <p>Loading order details…</p>}

            {orderDetailsError && (
              <div style={extraStyles.message} role="alert">
                {orderDetailsError}
              </div>
            )}

            {selectedOrder && (
              <>
                <h3>Recipient details</h3>

                <div style={extraStyles.detailsGrid}>
                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Recipient name</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.recipientName}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Mobile number</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.recipientPhone}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Address line 1</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.addressLine1}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Address line 2</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.addressLine2 || "—"}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>City</div>
                    <p style={extraStyles.detailValue}>{selectedOrder.city}</p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>State</div>
                    <p style={extraStyles.detailValue}>{selectedOrder.state}</p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>PIN code</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.pinCode}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Country</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.country}
                    </p>
                  </div>
                </div>

                <h3 style={{ marginTop: "24px" }}>Purchase details</h3>

                <div style={extraStyles.detailsGrid}>
                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Product</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.product?.name || "Standee"}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Business</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.business?.shopName || "—"}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Business owner</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.business?.ownerName || "—"}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Business mobile</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.business?.phone || "—"}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Quantity</div>
                    <p style={extraStyles.detailValue}>
                      {selectedOrder.quantity}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Unit price</div>
                    <p style={extraStyles.detailValue}>
                      {formatCurrency(
                        selectedOrder.unitPrice,
                        selectedOrder.currency,
                      )}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Total amount</div>
                    <p style={extraStyles.detailValue}>
                      {formatCurrency(
                        selectedOrder.totalAmount,
                        selectedOrder.currency,
                      )}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Payment status</div>
                    <p style={extraStyles.detailValue}>
                      {displayStatus(selectedOrder.status)}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Fulfilment status</div>
                    <p style={extraStyles.detailValue}>
                      {displayStatus(selectedOrder.fulfilmentStatus)}
                    </p>
                  </div>

                  <div style={extraStyles.detailItem}>
                    <div style={extraStyles.detailLabel}>Order created</div>
                    <p style={extraStyles.detailValue}>
                      {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>

                  {selectedOrder.shippedAt && (
                    <div style={extraStyles.detailItem}>
                      <div style={extraStyles.detailLabel}>Shipped at</div>
                      <p style={extraStyles.detailValue}>
                        {formatDateTime(selectedOrder.shippedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {shippingError && (
                  <div
                    style={{
                      ...extraStyles.message,
                      marginTop: "18px",
                    }}
                    role="alert"
                  >
                    {shippingError}
                  </div>
                )}

                {shippingSuccess && (
                  <div
                    style={{
                      ...extraStyles.message,
                      background: "#ecfdf5",
                      color: "#166534",
                      marginTop: "18px",
                    }}
                    role="status"
                  >
                    {shippingSuccess}
                  </div>
                )}

                {/* Standee PDF downloads */}
                <div style={{ marginTop: "22px" }}>
                  <h3 style={{ marginBottom: "8px" }}>Standee templates</h3>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "12px",
                    }}
                  >
                    Download the print-ready PDF for this order&apos;s business.
                  </p>

                  {standeeDownloadError && (
                    <div
                      style={{
                        ...extraStyles.message,
                        marginBottom: "12px",
                      }}
                      role="alert"
                    >
                      {standeeDownloadError}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        ...extraStyles.secondaryButton,
                        opacity:
                          standeeDownload?.orderId === selectedOrder.id
                            ? 0.65
                            : 1,
                      }}
                      disabled={standeeDownload?.orderId === selectedOrder.id}
                      onClick={() =>
                        downloadOrderStandee(selectedOrder.id, "4x6")
                      }
                    >
                      {standeeDownload?.orderId === selectedOrder.id &&
                      standeeDownload?.format === "4x6"
                        ? "Generating PDF…"
                        : "Download 4×6 PDF"}
                    </button>

                    <button
                      type="button"
                      style={{
                        ...extraStyles.secondaryButton,
                        opacity:
                          standeeDownload?.orderId === selectedOrder.id
                            ? 0.65
                            : 1,
                      }}
                      disabled={standeeDownload?.orderId === selectedOrder.id}
                      onClick={() =>
                        downloadOrderStandee(selectedOrder.id, "12x12cm")
                      }
                    >
                      {standeeDownload?.orderId === selectedOrder.id &&
                      standeeDownload?.format === "12x12cm"
                        ? "Generating PDF…"
                        : "Download 12×12 cm PDF"}
                    </button>
                  </div>
                </div>

                <div style={extraStyles.modalFooter}>
                  <button
                    type="button"
                    style={extraStyles.secondaryButton}
                    onClick={() => {
                      setSelectedOrder(null);
                      setStandeeDownloadError("");
                    }}
                  >
                    Close
                  </button>

                  {selectedOrder.fulfilmentStatus === "PENDING" &&
                    selectedOrder.status === "PAID" && (
                      <button
                        type="button"
                        style={{
                          ...extraStyles.primaryButton,
                          opacity:
                            shippingOrderId === selectedOrder.id ? 0.65 : 1,
                        }}
                        disabled={shippingOrderId === selectedOrder.id}
                        onClick={() => markOrderAsShipped(selectedOrder.id)}
                      >
                        {shippingOrderId === selectedOrder.id
                          ? "Updating…"
                          : "Mark as shipped"}
                      </button>
                    )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
