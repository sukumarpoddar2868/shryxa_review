"use client";

import Image from "next/image";
import Navbar from "./Navbar";
import ReviewFlow from "./ReviewFlow";
import Footer from "./Footer";
import styles from "./ShryxaLanding.module.css";

const media = {
  customer:
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=85",

  business:
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=85",
};

export default function ShryxaLanding() {
  return (
    <main className={styles.page}>

      {/* =========================
          NAVBAR
      ========================== */}

      <Navbar />


      {/* =========================
          HERO
      ========================== */}

      <section className={styles.hero}>

        {/* Animated background */}

        <div
          className={styles.arcBackground}
          aria-hidden="true"
        >
          <span
            className={`${styles.arc} ${styles.arcOne}`}
          />

          <span
            className={`${styles.arc} ${styles.arcTwo}`}
          />

          <span
            className={`${styles.arc} ${styles.arcThree}`}
          />

          <span className={styles.glow} />

          <span className={styles.grid} />
        </div>


        {/* Hero content */}

        <div className={styles.heroContent}>

          <div className={styles.eyebrow}>
            <span className={styles.liveDot} />

            AI-powered review growth
          </div>


          <h1>
            Turn great
            <span> experiences</span>
            <br />
            into great reviews.
          </h1>


          <p className={styles.heroText}>
            Shryxa helps businesses collect customer experiences,
            transform them into authentic review-ready content,
            and guide customers to Google in a few simple steps.
          </p>


          <div className={styles.heroActions}>

            <a
              className={styles.primaryButton}
              href="/onboarding"
            >
              Get Started

              <span>↗</span>
            </a>


            <a
              className={styles.secondaryButton}
              href="#how-it-works"
            >
              See how it works

              <span>↓</span>
            </a>

          </div>


          <div className={styles.heroProof}>

            <div className={styles.avatarStack}>
              <span>J</span>
              <span>A</span>
              <span>R</span>
              <span>+</span>
            </div>


            <div>

              <strong>
                Built for modern businesses
              </strong>

              <small>
                Simple for customers. Useful for teams.
              </small>

            </div>

          </div>

        </div>


        {/* Hero phone */}

        <div className={styles.heroVisual}>

          <div className={styles.phone}>

            <div className={styles.phoneNotch} />


            <div className={styles.phoneScreen}>

              <div className={styles.phoneHeader}>

                <span className={styles.miniLogo}>
                  S
                </span>

                <span>
                  Shryxa Review
                </span>

              </div>


              <div className={styles.businessMark}>
                C
              </div>


              <p className={styles.phoneLabel}>
                How was your experience?
              </p>


              <h3>
                Your feedback matters.
              </h3>


              <div className={styles.ratingRow}>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>


              <div className={styles.experiencePill}>
                Loved the service
              </div>

              <div className={styles.experiencePill}>
                Friendly staff
              </div>

              <div className={styles.experiencePill}>
                Great experience
              </div>


              <button className={styles.phoneCta}>
                Generate my review →
              </button>

            </div>

          </div>


          {/* Floating card */}

          <div
            className={`${styles.floatingCard} ${styles.scanCard}`}
          >

            <span className={styles.cardIcon}>
              ⌁
            </span>

            <div>

              <strong>
                Scan → Share
              </strong>

              <small>
                One QR code
              </small>

            </div>

          </div>


          <div
            className={`${styles.floatingCard} ${styles.aiCard}`}
          >

            <span className={styles.cardIcon}>
              ✦
            </span>

            <div>

              <strong>
                AI review ready
              </strong>

              <small>
                Personalized to the visit
              </small>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          MARQUEE
      ========================== */}

      <section
        className={styles.marquee}
        aria-label="Shryxa benefits"
      >

        <span>
          QR REVIEW FLOW
        </span>

        <i>✦</i>

        <span>
          AI-ASSISTED WRITING
        </span>

        <i>✦</i>

        <span>
          GOOGLE REVIEW JOURNEY
        </span>

        <i>✦</i>

        <span>
          BUSINESS INSIGHTS
        </span>

      </section>


      {/* =========================
          HOW IT WORKS
      ========================== */}

      <section
        className={styles.section}
        id="how-it-works"
      >

        <div className={styles.sectionHeading}>

          <div>

            <span className={styles.sectionKicker}>
              THE SHRYXA FLOW
            </span>

            <h2>
              A review journey that feels natural.
            </h2>

          </div>


          <p>
            Remove the blank-page problem.
            Customers tell Shryxa what happened,
            Shryxa helps shape their words,
            and the customer remains in control
            of what they post.
          </p>

        </div>


        <ReviewFlow />

      </section>


      {/* =========================
          CUSTOMER SECTION
      ========================== */}

      <section className={styles.storySection}>

        <div className={styles.storyImage}>

          <Image
            src={media.customer}
            alt="Customer using a phone"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
          />


          <div className={styles.imageOverlay}>

            <span>
              01
            </span>

            <strong>
              Make feedback easy.
            </strong>

          </div>

        </div>


        <div className={styles.storyCopy}>

          <span className={styles.sectionKicker}>
            FOR CUSTOMERS
          </span>


          <h2>
            No forms. No friction.
            Just their experience.
          </h2>


          <p>
            A QR code takes customers directly
            into a focused mobile experience.
            They choose what stood out,
            add their own context, and review
            the generated suggestions before
            continuing to Google.
          </p>


          <div className={styles.checkList}>

            <div>
              <span>✓</span>
              No customer account required
            </div>

            <div>
              <span>✓</span>
              Mobile-first review experience
            </div>

            <div>
              <span>✓</span>
              Customer chooses and edits the wording
            </div>

          </div>

        </div>

      </section>


      {/* =========================
          BUSINESS FEATURES
      ========================== */}

      <section
        className={styles.featureSection}
        id="features"
      >

        <div className={styles.featureIntro}>

          <span className={styles.sectionKicker}>
            FOR BUSINESSES
          </span>


          <h2>
            Your review engine,
            without the busywork.
          </h2>


          <p>
            Give your team one place to manage
            the review journey, QR assets,
            customer activity, and performance
            signals.
          </p>

        </div>


        <div className={styles.featureGrid}>

          {/* Feature 1 */}

          <article className={styles.featureCard}>

            <div className={styles.featureVisual}>

              <Image
                src={media.business}
                alt="Business team working together"
                fill
                sizes="(max-width: 900px) 100vw, 33vw"
              />

              <span>
                01
              </span>

            </div>


            <div className={styles.featureBody}>

              <h3>
                One QR. Every touchpoint.
              </h3>

              <p>
                Place your Shryxa QR code at
                the counter, table, packaging,
                receipt, or follow-up message.
              </p>

            </div>

          </article>


          {/* Feature 2 */}

          <article className={styles.featureCard}>

            <div
              className={`${styles.featureVisual} ${styles.darkVisual}`}
            >

              <div className={styles.signalLines}>

                <span />
                <span />
                <span />
                <span />

              </div>


              <div className={styles.signalCore}>
                ✦
              </div>


              <span>
                02
              </span>

            </div>


            <div className={styles.featureBody}>

              <h3>
                AI that keeps the story human.
              </h3>

              <p>
                Turn selected customer experiences
                into natural review drafts without
                taking the final choice away from
                the customer.
              </p>

            </div>

          </article>


          {/* Feature 3 */}

          <article className={styles.featureCard}>

            <div
              className={`${styles.featureVisual} ${styles.dashboardVisual}`}
            >

              <div className={styles.miniDashboard}>

                <span>
                  Reviews
                </span>

                <strong>
                  +28%
                </strong>


                <div className={styles.miniBars}>

                  <i />
                  <i />
                  <i />
                  <i />
                  <i />

                </div>

              </div>


              <span>
                03
              </span>

            </div>


            <div className={styles.featureBody}>

              <h3>
                See what is happening.
              </h3>

              <p>
                Track scans, generated reviews,
                activity, and business-level signals
                from your dashboard.
              </p>

            </div>

          </article>

        </div>

      </section>


      {/* =========================
          GOOGLE FLOW
      ========================== */}

      <section
        className={styles.googleSection}
        id="google"
      >

        <div className={styles.googleCopy}>

          <span className={styles.sectionKicker}>
            GOOGLE REVIEW JOURNEY
          </span>


          <h2>
            From a QR scan to
            the customer's Google review.
          </h2>


          <p>
            Shryxa prepares the experience
            inside your app. The customer then
            continues to the appropriate Google
            review destination to publish their
            review themselves.
          </p>


          <a
            href="/onboarding"
            className={styles.textLink}
          >
            Create your review flow
            <span>→</span>
          </a>

        </div>


        <div className={styles.googlePath}>

          <div className={styles.pathNode}>

            <span>01</span>

            <strong>
              Scan QR
            </strong>

            <small>
              Customer opens the Shryxa page.
            </small>

          </div>


          <div className={styles.pathLine} />


          <div className={styles.pathNode}>

            <span>02</span>

            <strong>
              Choose experience
            </strong>

            <small>
              Rating and memorable moments.
            </small>

          </div>


          <div className={styles.pathLine} />


          <div className={styles.pathNode}>

            <span>03</span>

            <strong>
              Review ready
            </strong>

            <small>
              Customer selects or edits the draft.
            </small>

          </div>


          <div className={styles.pathLine} />


          <div className={styles.pathNode}>

            <span>04</span>

            <strong>
              Google
            </strong>

            <small>
              Customer continues to Google
              and posts.
            </small>

          </div>

        </div>

      </section>


      {/* =========================
          CTA
      ========================== */}

      <section className={styles.ctaSection}>

        <div className={styles.ctaGlow} />


        <span className={styles.sectionKicker}>
          READY WHEN YOU ARE
        </span>


        <h2>
          Make the next great review
          easier to write.
        </h2>


        <p>
          Set up your business, connect your
          review destination, and create your
          first Shryxa QR flow.
        </p>


        <a
          href="/onboarding"
          className={styles.primaryButton}
        >
          Get Started
          <span>↗</span>
        </a>

      </section>


      {/* =========================
          FOOTER
      ========================== */}

      <Footer />

    </main>
  );
}
