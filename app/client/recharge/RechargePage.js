"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./recharge.module.css";
import { createSubscriptionRequest } from "@/lib/services/subscriptionClient";

const MENU_ITEMS = [
  { label: "Dashboard", href: "/client/dashboard", icon: "⌂" },
  { label: "QR Code", href: "/client/qr", icon: "▦" },
  { label: "Subscription", href: "/client/recharge", icon: "↻" },
  { label: "Profile", href: "/client/profile", icon: "◯" },
];

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount, currency = "INR") {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusClass(status) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
    case "SUCCESS":
      return "success";
    case "PENDING":
    case "CREATED":
    case "AUTHENTICATED":
      return "pending";
    case "FAILED":
    case "HALTED":
    case "CANCELLED":
    case "EXPIRED":
      return "failed";
    default:
      return "neutral";
  }
}

export default function RechargePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const scriptUrl = "https://checkout.razorpay.com/v1/checkout.js";
    let script = document.querySelector(`script[src="${scriptUrl}"]`);

    function handleLoad() {
      script.dataset.loaded = "true";
      setRazorpayLoaded(true);
    }

    function handleError() {
      setRazorpayLoaded(false);
      setError("Unable to load the payment gateway. Please refresh the page.");
    }

    if (script?.dataset.loaded === "true") {
      setRazorpayLoaded(true);
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);

  const loadSubscription = useCallback(async (businessId) => {
    const response = await fetch(
      `/api/payments/subscription?businessId=${encodeURIComponent(businessId)}`,
      { cache: "no-store" },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load subscription details.");
    }

    setBusiness((current) => ({
      ...(current || {}),
      ...(data.business || {}),
    }));

    setSubscription(data.subscription || null);
    setPayments(Array.isArray(data.payments) ? data.payments : []);
  }, []);

  const loadBusiness = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/business", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load your business.");
      }

      const businesses = Array.isArray(data)
        ? data
        : data.businesses || data.data || [];

      if (businesses.length === 0) {
        setBusiness(null);
        setSubscription(null);
        setPayments([]);
        return;
      }

      const selectedBusiness = businesses[0];
      setBusiness(selectedBusiness);

      await loadSubscription(selectedBusiness.id);
    } catch (err) {
      setError(err.message || "Unable to load subscription details.");
    } finally {
      setLoading(false);
    }
  }, [loadSubscription]);

  useEffect(() => {
    loadBusiness();
  }, [loadBusiness]);

  async function startSubscription() {
    if (!business?.id) {
      setError("No business was found for your account.");
      return;
    }

    if (subscription?.status === "ACTIVE") {
      setError("Your business already has an active subscription.");
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      setError("The payment gateway is still loading. Please try again.");
      return;
    }

    setPaymentProcessing(true);
    setError("");
    setNotice("");

    try {
      const checkout = await createSubscriptionRequest(business.id);

      if (!checkout.keyId || !checkout.subscriptionId) {
        throw new Error("The server did not return valid checkout details.");
      }

      const options = {
        key: checkout.keyId,
        subscription_id: checkout.subscriptionId,
        name: "Shryxa Review",
        description: "Monthly subscription — ₹199",
        handler: async (response) => {
          try {
            const verificationResponse = await fetch(
              "/api/payments/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(response),
              },
            );

            const verification = await verificationResponse.json();

            if (!verificationResponse.ok || !verification.verified) {
              setError(
                verification.message ||
                  "Payment verification failed. Please contact support before retrying.",
              );
              return;
            }

            if (!verification.active) {
              setNotice(
                "Your payment details were received, but the subscription is not active yet. Please refresh later.",
              );
              await loadSubscription(business.id);
              return;
            }

            setNotice("Payment verified and subscription activated.");
            await loadSubscription(business.id);
          } catch (err) {
            setError(
              err.message ||
                "We could not verify your payment. Please contact support before retrying.",
            );
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setPaymentProcessing(false),
        },
        theme: {
          color: "#1f6334",
        },
      };

      const checkoutWindow = new window.Razorpay(options);

      checkoutWindow.on("payment.failed", (event) => {
        setError(
          event.error?.description ||
            "Payment failed. You can try again when ready.",
        );
        setPaymentProcessing(false);
      });

      checkoutWindow.open();
    } catch (err) {
      setError(err.message || "Unable to start checkout.");
      setPaymentProcessing(false);
    }
  }

  const activeSubscription = subscription?.status === "ACTIVE";

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
          onClick={() => setMobileMenu((value) => !value)}
          aria-label="Toggle navigation"
        >
          {mobileMenu ? "×" : "☰"}
        </button>
      </header>

      <aside
        className={`${styles.sidebar} ${
          mobileMenu ? styles.sidebarOpen : ""
        }`}
      >
        <Link href="/" className={styles.brand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
          </span>
          <span>Shryxa</span>
        </Link>

        <nav className={styles.navigation}>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.navItem} ${
                item.href === "/client/recharge" ? styles.active : ""
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
            <p className={styles.eyebrow}>ACCOUNT BILLING</p>
            <h1>Subscription & Payments</h1>
            <p className={styles.businessName}>
              {business?.shopName || "Your business"}
            </p>
          </div>

          <div className={styles.profileCircle}>
            {(business?.shopName || "S").charAt(0).toUpperCase()}
          </div>
        </div>

        {error && (
          <div role="alert" className={styles.messageError}>
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className={styles.messageSuccess}>
            {notice}
          </div>
        )}

        {loading ? (
          <section className={styles.paymentCard}>
            <p>Loading subscription details…</p>
          </section>
        ) : !business ? (
          <section className={styles.paymentCard}>
            <h2>No business found</h2>
            <p>Create a business before managing its subscription.</p>
            <Link href="/onboarding">Set up your business</Link>
          </section>
        ) : (
          <>
            <section className={styles.balanceCard}>
              <div className={styles.balanceInfo}>
                <span className={styles.balanceLabel}>
                  Subscription status
                </span>
                <div className={styles.balanceNumber}>
                  {subscription?.status || "NOT SUBSCRIBED"}
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    styles[getStatusClass(subscription?.status)]
                  }`}
                >
                  {subscription?.status || "No subscription"}
                </span>
              </div>

              <div className={styles.balanceUsage}>
                <p className={styles.sectionEyebrow}>MONTHLY PLAN</p>
                <div className={styles.balanceNumber}>
                  ₹{Number(subscription?.amount ?? 199).toLocaleString("en-IN")}
                  <span> / month</span>
                </div>
                <p>
                  {subscription?.planName || "MONTHLY"} ·{" "}
                  {subscription?.interval || "MONTHLY"}
                </p>
                <p>
                  Next billing: {formatDate(subscription?.nextBillingAt)}
                </p>
              </div>
            </section>

            <section className={styles.paymentCard}>
              <p className={styles.sectionEyebrow}>SUBSCRIPTION DETAILS</p>
              <h2>Your plan</h2>

              <div className={styles.summaryRow}>
                <span>Business</span>
                <strong>{business.shopName}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Subscription started</span>
                <strong>{formatDate(subscription?.startDate)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Current billing period ends</span>
                <strong>{formatDate(subscription?.currentPeriodEnd)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Cancellation at period end</span>
                <strong>
                  {subscription
                    ? subscription.cancelAtPeriodEnd
                      ? "Yes"
                      : "No"
                    : "—"}
                </strong>
              </div>

              {activeSubscription ? (
                <p>
                  Your subscription is active. You can continue using your
                  Shryxa Review subscription.
                </p>
              ) : (
                <button
                  type="button"
                  className={styles.payButton}
                  onClick={startSubscription}
                  disabled={paymentProcessing || !razorpayLoaded}
                >
                  {paymentProcessing
                    ? "Processing…"
                    : !razorpayLoaded
                      ? "Loading payment gateway…"
                      : subscription
                        ? "Retry Subscription Payment"
                        : "Subscribe Now — ₹199/month"}
                  <span>→</span>
                </button>
              )}
            </section>

            <section className={styles.paymentCard}>
              <p className={styles.sectionEyebrow}>TRANSACTION RECORDS</p>
              <h2>Payment history</h2>

              {payments.length === 0 ? (
                <p>No payment records are available yet.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.paymentTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>
                          <td>
                            {formatAmount(payment.amount, payment.currency)}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                styles[getStatusClass(payment.status)]
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
