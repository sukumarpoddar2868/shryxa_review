"use client";

import { signIn } from "next-auth/react";
import GetGoogleReviewLink from "@/app/components/GetGoogleReviewLink";
import { createBusiness } from "@/lib/services/businessService";
import { createAccount } from "@/lib/services/accountService";
import { useState } from "react";
import Link from "next/link";
import styles from "./onboarding.module.css";

const initialForm = {
  // User
  fullName: "",
  email: "",
  phone: "",
  password: "",

  // Business
  shopName: "",
  ownerName: "",
  businessPhone: "",
  address: "",
  pinCode: "",
  googleReviewUrl: "",
};

export default function OnboardingClient() {
  const [phase, setPhase] = useState(1);
  const [form, setForm] = useState(initialForm);

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  // Account state
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountId, setAccountId] = useState(null);

  // Business state
  const [businessCreated, setBusinessCreated] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================================================
  // PHASE 1A → ACCOUNT
  // ============================================================

  async function goToBusiness() {
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      alert("Please complete all account fields.");
      return;
    }

    // Account already exists.
    // Don't create another account.
    if (accountCreated) {
      setPhase(1.5);
      return;
    }

    const accountData = {
      fullName: form.fullName,
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      password: form.password,
    };

    try {
      const data = await createAccount(accountData);

      console.log("Account created:", data);

      setAccountCreated(true);
      setAccountId(data.user.id);

      setPhase(1.5);
    } catch (error) {
      console.error("Account API error:", error);
      alert(error.message);
    }
  }

  //function for sign in automatically when account created
  async function authenticateRegisteredUser() {
    const result = await signIn("credentials", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });

    if (!result || result.error) {
      throw new Error(
        "Account and business are saved, but automatic login failed. Please log in manually.",
      );
    }
  }

  // ============================================================
  // PHASE 1B → BUSINESS
  // ============================================================

  async function goToPayment() {
    if (
      !form.shopName ||
      !form.ownerName ||
      !form.businessPhone ||
      !form.address ||
      !form.pinCode ||
      !form.googleReviewUrl
    ) {
      alert("Please complete all business fields.");
      return;
    }

    try {
      // If the business already exists, retry authentication
      // instead of creating another business.

      if (businessCreated) {
        await authenticateRegisteredUser();
        setPhase(2);
        return;
      }

      const businessData = {
        ownerId: accountId,
        shopName: form.shopName,
        ownerName: form.ownerName,
        phone: form.businessPhone,
        address: form.address,
        pinCode: form.pinCode,
        googleReviewUrl: form.googleReviewUrl,
      };

      // 1. Save the business in PostgreSQL.

      const data = await createBusiness(businessData);

      console.log("Business created:", data);

      setBusinessCreated(true);
      setBusinessId(data.business.id);

      // 2. Establish the authenticated session.

      await authenticateRegisteredUser();

      // 3. Continue to the payment phase.

      setPhase(2);
    } catch (error) {
      console.error("Business creation or authentication failed:", error);
      alert(error.message);
    }
  }
  // ============================================================
  // PHASE 2 → PAYMENT
  // ============================================================

  function processPayment() {
    setPaymentProcessing(true);

    // Temporary frontend simulation.
    // Payment gateway will be connected later.
    setTimeout(() => {
      setPaymentProcessing(false);
      setPhase(3);
      setQrGenerated(true);
    }, 1800);
  }

  // ============================================================
  // BACK BUTTON
  // ============================================================

  function goBack() {
    if (phase === 1.5) {
      setPhase(1);
    }

    if (phase === 2) {
      setPhase(1.5);
    }
  }

  return (
    <main className={styles.page}>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logoBox}>
            <img src="/shryxa-logo.png" alt="Shryxa Review" />
          </span>

          <span>Shryxa</span>
        </Link>

        <Link href="/login" className={styles.loginLink}>
          Already have an account? <strong>Login</strong>
        </Link>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <section className={styles.container}>
        {/* ======================================================
            PROGRESS
        ====================================================== */}

        <div className={styles.progressWrapper}>
          {/* STEP 1 */}

          <div className={styles.progressStep}>
            <span
              className={`${styles.stepNumber} ${
                phase >= 1 ? styles.active : ""
              }`}
            >
              1
            </span>

            <span>Account & Business</span>
          </div>

          <div className={styles.progressLine}></div>

          {/* STEP 2 */}

          <div className={styles.progressStep}>
            <span
              className={`${styles.stepNumber} ${
                phase >= 2 ? styles.active : ""
              }`}
            >
              2
            </span>

            <span>Payment</span>
          </div>

          <div className={styles.progressLine}></div>

          {/* STEP 3 */}

          <div className={styles.progressStep}>
            <span
              className={`${styles.stepNumber} ${
                phase >= 3 ? styles.active : ""
              }`}
            >
              3
            </span>

            <span>QR Code</span>
          </div>
        </div>

        {/* ======================================================
            CARD
        ====================================================== */}

        <div className={styles.card}>
          {/* ====================================================
              PHASE 1A — ACCOUNT
          ==================================================== */}

          {phase === 1 && (
            <div className={styles.content}>
              <div className={styles.heading}>
                <span className={styles.phaseLabel}>PHASE 1 / 3</span>

                <h1>Create your account</h1>

                <p>Start your Shryxa journey by creating your account.</p>
              </div>

              <div className={styles.formGrid}>
                {/* FULL NAME */}

                <div className={styles.field}>
                  <label htmlFor="fullName">Full Name</label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>

                {/* EMAIL */}

                <div className={styles.field}>
                  <label htmlFor="email">Email Address</label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                {/* PHONE */}

                <div className={styles.field}>
                  <label htmlFor="phone">Phone Number</label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* PASSWORD */}

                <div className={styles.field}>
                  <label htmlFor="password">Password</label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* INFO */}

              <div className={styles.infoBox}>
                <span>🔐</span>

                <p>
                  Your account will automatically be created with the
                  <strong> CLIENT </strong>
                  role.
                </p>
              </div>

              {/* ACTIONS */}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={goToBusiness}
                >
                  Continue
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              PHASE 1B — BUSINESS
          ==================================================== */}

          {phase === 1.5 && (
            <div className={styles.content}>
              <div className={styles.heading}>
                <span className={styles.phaseLabel}>PHASE 1 / 3</span>

                <h1>Tell us about your business</h1>

                <p>
                  Add the business that will use Shryxa to collect customer
                  reviews.
                </p>
              </div>

              <div className={styles.formGrid}>
                {/* BUSINESS NAME */}

                <div className={styles.field}>
                  <label htmlFor="shopName">Business Name</label>

                  <input
                    id="shopName"
                    name="shopName"
                    type="text"
                    placeholder="ABC Restaurant"
                    value={form.shopName}
                    onChange={handleChange}
                  />
                </div>

                {/* OWNER NAME */}

                <div className={styles.field}>
                  <label htmlFor="ownerName">Owner Name</label>

                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    placeholder="Business owner name"
                    value={form.ownerName}
                    onChange={handleChange}
                  />
                </div>

                {/* BUSINESS PHONE */}

                <div className={styles.field}>
                  <label htmlFor="businessPhone">Business Phone</label>

                  <input
                    id="businessPhone"
                    name="businessPhone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.businessPhone}
                    onChange={handleChange}
                  />
                </div>

                {/* PIN CODE */}

                <div className={styles.field}>
                  <label htmlFor="pinCode">PIN Code</label>

                  <input
                    id="pinCode"
                    name="pinCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="833201"
                    value={form.pinCode}
                    onChange={handleChange}
                  />
                </div>

                {/* ADDRESS */}

                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="address">Business Address</label>

                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="Enter complete business address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>

                {/* GOOGLE REVIEW URL */}

                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <div className={styles.reviewUrlHeader}>
                    <label htmlFor="googleReviewUrl">
                      Google Review Page URL
                    </label>

                    <GetGoogleReviewLink
                      shopName={form.shopName}
                      address={form.address}
                      onUrlFound={(url) =>
                        setForm((previous) => ({
                          ...previous,
                          googleReviewUrl: url,
                        }))
                      }
                    />
                  </div>

                  <input
                    id="googleReviewUrl"
                    name="googleReviewUrl"
                    type="url"
                    value={form.googleReviewUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                  />

                  <small>
                    This is the Google page where your customers will eventually
                    post their review.
                  </small>
                </div>
              </div>

              {/* ACTIONS */}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={goBack}
                >
                  ← Back
                </button>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={goToPayment}
                >
                  Continue to Payment
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* ====================================================
              PHASE 2 — PAYMENT
          ==================================================== */}

          {phase === 2 && (
            <div className={styles.content}>
              <div className={styles.heading}>
                <span className={styles.phaseLabel}>PHASE 2 / 3</span>

                <h1>Complete your setup</h1>

                <p>
                  Activate Shryxa for your business by completing your
                  subscription payment.
                </p>
              </div>

              {/* PAYMENT CARD */}

              <div className={styles.paymentCard}>
                <div>
                  <span className={styles.paymentLabel}>Business</span>

                  <h2>{form.shopName}</h2>
                </div>

                <div className={styles.paymentDivider}></div>

                <div className={styles.paymentRow}>
                  <span>Shryxa Review</span>
                  <strong>₹999</strong>
                </div>

                <div className={styles.paymentRow}>
                  <span>Billing</span>
                  <span>One-time setup</span>
                </div>

                <div className={styles.paymentTotal}>
                  <span>Total</span>
                  <strong>₹999</strong>
                </div>
              </div>

              {/* PAYMENT INFO */}

              <div className={styles.infoBox}>
                <span>💳</span>

                <p>
                  Payment details such as transaction ID, status and payment
                  time will be automatically received from the payment gateway.
                </p>
              </div>

              {/* ACTIONS */}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={goBack}
                  disabled={paymentProcessing}
                >
                  ← Back
                </button>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={processPayment}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? "Processing..." : "Proceed to Payment"}

                  {!paymentProcessing && <span>→</span>}
                </button>
              </div>

              <p className={styles.demoNote}>
                Demo mode: payment gateway will be connected later.
              </p>
            </div>
          )}

          {/* ====================================================
              PHASE 3 — QR
          ==================================================== */}

          {phase === 3 && qrGenerated && (
            <div className={styles.content}>
              <div className={styles.successIcon}>✓</div>

              <div className={styles.heading}>
                <span className={styles.phaseLabel}>PHASE 3 / 3</span>

                <h1>Your QR code is ready</h1>

                <p>
                  Your business has been successfully prepared for review
                  collection.
                </p>
              </div>

              {/* BUSINESS SUMMARY */}

              <div className={styles.businessSummary}>
                <span>Business</span>

                <strong>{form.shopName}</strong>

                <small>{form.address}</small>
              </div>

              {/* QR SECTION */}

              <div className={styles.qrSection}>
                <div className={styles.qrPlaceholder}>
                  <div className={styles.qrPattern}>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>

                <h3>Scan to review</h3>

                <p>
                  Customers can scan this QR code to start their Shryxa review
                  experience.
                </p>
              </div>

              {/* QR INFO */}

              <div className={styles.infoBox}>
                <span>✓</span>

                <p>
                  Your QR identifier and destination URL will be generated
                  automatically by Shryxa.
                </p>
              </div>

              {/* ACTIONS */}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => alert("QR download will be connected later.")}
                >
                  Download QR
                </button>

                <Link href="/client/dashboard" className={styles.primaryButton}>
                  Go to Dashboard
                  <span>→</span>
                </Link>
              </div>

              <p className={styles.demoNote}>
                Demo QR: actual QR generation will be connected to your backend
                later.
              </p>
            </div>
          )}
        </div>

        {/* ======================================================
            SECURITY NOTE
        ====================================================== */}

        <p className={styles.footerNote}>
          Your information is securely used to set up your Shryxa business
          account.
        </p>
      </section>
    </main>
  );
}
