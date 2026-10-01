"use client";

import { useState } from "react";
import styles from "./ShryxaLanding.module.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.nav}>

      <a
        href="/"
        className={styles.brand}
        aria-label="Shryxa Review home"
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


      <nav
        className={`${styles.navLinks} ${
          open ? styles.navOpen : ""
        }`}
      >

        <a
          href="#how-it-works"
          onClick={() => setOpen(false)}
        >
          How it works
        </a>

        <a
          href="#features"
          onClick={() => setOpen(false)}
        >
          Features
        </a>

        <a
          href="#google"
          onClick={() => setOpen(false)}
        >
          Google reviews
        </a>

      </nav>


      <div className={styles.navActions}>

        <a
          href="/login"
          className={styles.loginButton}
        >
          Login
        </a>


        <a
          href="/onboarding"
          className={styles.navCta}
        >
          Get Started
          <span>↗</span>
        </a>

      </div>


      <button
        className={styles.menuButton}
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >

        <span />
        <span />

      </button>

    </header>
  );
}
