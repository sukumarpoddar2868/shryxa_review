"use client";

import { useState } from "react";
import styles from "./ShryxaLanding.module.css";

const steps = [
  {
    number: "01",
    label: "Scan the QR",
    title: "The customer starts with one simple scan.",
    text: "Your QR code opens a business-specific Shryxa review page without requiring a customer account.",
  },

  {
    number: "02",
    label: "Share the experience",
    title: "A few choices replace a blank text box.",
    text: "The customer selects a rating and the moments that best describe their visit.",
  },

  {
    number: "03",
    label: "Generate review",
    title: "AI turns those signals into review drafts.",
    text: "Shryxa creates natural review options based on the customer-provided experience.",
  },

  {
    number: "04",
    label: "Continue to Google",
    title: "The customer stays in control.",
    text: "They select or edit their preferred wording, then continue to the business's Google review destination.",
  },
];

export default function ReviewFlow() {

  const [active, setActive] = useState(0);

  return (
    <div className={styles.flow}>

      {/* Steps */}

      <div className={styles.flowRail}>

        {steps.map((step, index) => (

          <button
            key={step.number}
            type="button"
            className={`${styles.flowStep} ${
              active === index
                ? styles.flowStepActive
                : ""
            }`}
            onClick={() => setActive(index)}
          >

            <span>
              {step.number}
            </span>

            <strong>
              {step.label}
            </strong>

          </button>

        ))}

      </div>


      {/* Content */}

      <div className={styles.flowPanel}>

        <div className={styles.flowPanelText}>

          <span className={styles.panelNumber}>
            {steps[active].number}
          </span>


          <h3>
            {steps[active].title}
          </h3>


          <p>
            {steps[active].text}
          </p>

        </div>


        {/* Mockup */}

        <div className={styles.flowMockup}>

          <div className={styles.mockHeader}>

            <span className={styles.miniLogo}>
              S
            </span>

            <span>
              Shryxa
            </span>

            <span className={styles.secure}>
              ● secure
            </span>

          </div>


          {/* QR */}

          {active === 0 && (

            <div className={styles.qrMock}>

              <div className={styles.qrCode}>

                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />

              </div>


              <strong>
                Scan to share your experience
              </strong>


              <small>
                No app. No login.
              </small>

            </div>

          )}


          {/* Experience */}

          {active === 1 && (

            <div className={styles.experienceMock}>

              <small>
                How was your visit?
              </small>


              <div className={styles.bigStars}>
                ★★★★★
              </div>


              <div className={styles.mockPills}>

                <span>
                  Friendly staff
                </span>

                <span>
                  Fast service
                </span>

                <span>
                  Great quality
                </span>

                <span>
                  Clean place
                </span>

              </div>

            </div>

          )}


          {/* AI */}

          {active === 2 && (

            <div className={styles.aiMock}>

              <span className={styles.aiSpark}>
                ✦
              </span>


              <small>
                AI review suggestions
              </small>


              <p>
                “Really enjoyed the experience.
                The team was friendly, the service
                was quick, and everything felt
                thoughtfully handled.”
              </p>


              <div className={styles.aiBadge}>
                Personalized draft
              </div>

            </div>

          )}


          {/* Google */}

          {active === 3 && (

            <div className={styles.googleMock}>

              <div className={styles.googleLogo}>
                <b>G</b> Google
              </div>


              <strong>
                Your review is ready.
              </strong>


              <p>
                Choose your wording, make any
                changes, then continue.
              </p>


              <button type="button">
                Continue to Google ↗
              </button>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}
