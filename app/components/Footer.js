"use client";

import styles from "./ShryxaLanding.module.css";

export default function Footer() {

  return (
    <footer className={styles.footer}>

      <div className={styles.footerTop}>

        <div>

          <a
            href="/"
            className={styles.brand}
          >

            <span className={styles.logoMark}>

              <img
                src="/shryxa-logo.png"
                alt=""
              />

            </span>


            <span>
              Shryxa <b>Review</b>
            </span>

          </a>


          <p className={styles.footerTagline}>
            Turn customer experiences into
            review-ready moments.
          </p>

        </div>


        <div className={styles.footerLinks}>

          <div>

            <strong>
              Product
            </strong>

            <a href="#how-it-works">
              How it works
            </a>

            <a href="#features">
              Features
            </a>

            <a href="/onboarding">
              Get started
            </a>

          </div>


          <div>

            <strong>
              Account
            </strong>

            <a href="/login">
              Login
            </a>

          </div>


          <div>

            <strong>
              Legal
            </strong>

            <a href="/privacy">
              Privacy
            </a>

            <a href="/terms">
              Terms
            </a>

          </div>

        </div>

      </div>


      <div className={styles.footerBottom}>

        <span>
          © {new Date().getFullYear()} Shryxa Review
        </span>

        <span>
          Built for businesses that value customer feedback.
        </span>

      </div>

    </footer>
  );
}
