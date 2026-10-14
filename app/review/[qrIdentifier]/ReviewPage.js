"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./review.module.css";

/*
 * TEMPORARY DEMO DATA
 *
 * Later, retrieve the business-specific Google review URL
 * from your backend using qrIdentifier.
 */
const DEMO_BUSINESS = {
  googleReviewUrl: "https://www.google.com/maps",
};

const MAX_EXPERIENCE_LENGTH = 500;
const MAX_REVIEW_LENGTH = 1000;

/*
 * TEMPORARY REVIEW GENERATOR
 *
 * This is only for testing the UI.
 *
 * Later, replace this function with a request to your
 * review-generation API, which will call GroqCloud.
 *
 * Input:
 *   experience
 *   rating
 *
 * Expected output:
 *   Four review suggestions
 */
function generateDemoReviews(experience, rating) {
  const detail = experience.trim();

  const detailSentence = detail ? ` ${detail}` : "";

  const reviewsByRating = {
    1: [
      `My experience was disappointing.${detailSentence}`,
      `I was not satisfied with my experience.${detailSentence}`,
      `There is room for improvement based on my experience.${detailSentence}`,
      `Overall, my experience did not meet my expectations.${detailSentence}`,
    ],

    2: [
      `My experience could have been better.${detailSentence}`,
      `I had a few concerns about my experience.${detailSentence}`,
      `Some parts of my experience were below expectations.${detailSentence}`,
      `I hope the experience improves in the future.${detailSentence}`,
    ],

    3: [
      `My experience was okay overall.${detailSentence}`,
      `My experience had both positives and areas to improve.${detailSentence}`,
      `Overall, the experience was average for me.${detailSentence}`,
      `There is some room to make the experience better.${detailSentence}`,
    ],

    4: [
      `I had a good experience overall.${detailSentence}`,
      `Overall, I was pleased with my experience.${detailSentence}`,
      `My experience was positive, with a little room for improvement.${detailSentence}`,
      `I had a satisfying experience overall.${detailSentence}`,
    ],

    5: [
      `I had a great experience.${detailSentence}`,
      `I was very happy with my experience.${detailSentence}`,
      `Overall, my experience was excellent.${detailSentence}`,
      `I had a very positive experience overall.${detailSentence}`,
    ],
  };

  return reviewsByRating[rating] || [];
}

export default function ReviewPage({ qrIdentifier }) {
  // Customer's original experience.
  const [experience, setExperience] = useState("");

  // Selected star rating.
  const [rating, setRating] = useState(0);

  // Four generated review suggestions.
  const [reviews, setReviews] = useState([]);

  // Currently active carousel card.
  const [activeIndex, setActiveIndex] = useState(0);

  // Loading state.
  const [generating, setGenerating] = useState(false);

  // Toast notification.
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const sliderRef = useRef(null);
  const cardRefs = useRef([]);

  const generationTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const redirectTimerRef = useRef(null);

  const generationIdRef = useRef(0);

  /*
   * Display a temporary notification.
   */
  const showMessage = useCallback(
    (text, type = "info", duration = 2400) => {
      setMessage(text);
      setMessageType(type);

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setMessage("");
      }, duration);
    },
    []
  );

  /*
   * Clean up timers when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (generationTimerRef.current) {
        window.clearTimeout(generationTimerRef.current);
      }

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  /*
   * Generate suggestions when the customer selects a rating.
   *
   * Currently simulated.
   * Later, this will call the backend API.
   */
  function handleRating(star) {
    setRating(star);
    setMessage("");
    setGenerating(true);
    setReviews([]);
    setActiveIndex(0);

    if (generationTimerRef.current) {
      window.clearTimeout(generationTimerRef.current);
    }

    const generationId = ++generationIdRef.current;

    generationTimerRef.current = window.setTimeout(() => {
      // Ignore an outdated generation.
      if (generationId !== generationIdRef.current) {
        return;
      }

      const generatedReviews = generateDemoReviews(
        experience,
        star
      );

      setReviews(generatedReviews);
      setGenerating(false);

      requestAnimationFrame(() => {
        if (sliderRef.current) {
          sliderRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        }
      });
    }, 450);
  }

  /*
   * Update the customer's original experience.
   */
  function handleExperienceChange(event) {
    setExperience(event.target.value);
  }

  /*
   * Edit a review directly inside its carousel card.
   */
  function handleReviewChange(index, value) {
    setReviews((currentReviews) =>
      currentReviews.map((review, reviewIndex) =>
        reviewIndex === index ? value : review
      )
    );
  }

  /*
   * Find the card closest to the center of the screen.
   *
   * The active card is the review copied when the customer
   * presses "Post on Google".
   */
  function updateActiveCard() {
    const slider = sliderRef.current;

    if (!slider || cardRefs.current.length === 0) {
      return;
    }

    const sliderRect = slider.getBoundingClientRect();

    const sliderCenter =
      sliderRect.left + sliderRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }

      const cardRect = card.getBoundingClientRect();

      const cardCenter =
        cardRect.left + cardRect.width / 2;

      const distance = Math.abs(
        sliderCenter - cardCenter
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex((currentIndex) =>
      currentIndex === closestIndex
        ? currentIndex
        : closestIndex
    );
  }

  /*
   * Center a particular review card.
   */
  function centerCard(index) {
    const card = cardRefs.current[index];

    if (!card) {
      return;
    }

    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveIndex(index);
  }

  /*
   * Copy review text to the clipboard.
   *
   * Includes a fallback for browsers where the Clipboard API
   * is unavailable.
   */
  async function copyReviewText(text) {
  const reviewText = text?.trim();

  if (!reviewText) {
    throw new Error("Review text is empty.");
  }

  // Modern clipboard API: preferred on Android Chrome and iOS browsers.
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(reviewText);
      return true;
    } catch (error) {
      console.error("Clipboard API failed:", error);
    }
  }

  // Fallback for browsers that do not support clipboard.writeText().
  const textarea = document.createElement("textarea");

  textarea.value = reviewText;
  textarea.setAttribute("readonly", "");

  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "2px",
    height: "2px",
    padding: "0",
    border: "none",
    opacity: "0.01",
    fontSize: "16px",
    zIndex: "-1",
  });

  document.body.appendChild(textarea);

  let copied = false;

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, reviewText.length);

    copied = document.execCommand("copy");
  } catch (error) {
    console.error("Fallback clipboard copy failed:", error);
  } finally {
    textarea.remove();
  }

  if (!copied) {
    throw new Error("Unable to copy review text.");
  }

  return true;
}
  /*
   * Get the Google review URL.
   *
   * Currently a placeholder.
   *
   * Later, use the URL retrieved by your backend for
   * the supplied qrIdentifier.
   */
  function getGoogleReviewUrl() {
    const url = new URL(
      DEMO_BUSINESS.googleReviewUrl
    );

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      throw new Error(
        "Invalid Google review URL."
      );
    }

    return url.toString();
  }

  /*
   * Main action:
   *
   * 1. Validate the selected review.
   * 2. Open a temporary tab to reduce popup-blocker issues.
   * 3. Copy the active review.
   * 4. Show a confirmation message.
   * 5. Redirect the new tab to Google.
   */
  async function handlePostOnGoogle() {
    const reviewText = (reviews[activeIndex] || "").trim();

    // Validate the selected rating.
    if (!rating) {
      showMessage("Choose a star rating first.", "info");
      return;
    }

    // Prevent actions while suggestions are generating.
    if (generating) {
      showMessage("Please wait for your review options.", "info");
      return;
    }

    // Validate the active review.
    if (!reviewText) {
      showMessage("Write your review in the card before continuing.", "info");
      return;
    }

    // Get the Google Maps URL.
    let googleUrl;

    try {
      googleUrl = getGoogleReviewUrl();
    } catch (error) {
      console.error("Google URL error:", error);

      showMessage("The Google review link is unavailable right now.", "error");

      return;
    }

    /*
     * IMPORTANT:
     * Start the clipboard operation directly from the click handler.
     * Do not open about:blank before attempting to copy.
     */
    let copyPromise;

    try {
      copyPromise = copyReviewText(reviewText);
    } catch (error) {
      console.error("Could not start clipboard operation:", error);
      copyPromise = Promise.reject(error);
    }

    try {
      await copyPromise;

      showMessage("Review copied! Paste it on Google.", "success", 2500);

      /*
       * Navigate only after the copy operation succeeds.
       * This prevents a failed copy from being mistaken for success.
       */
      window.location.assign(googleUrl);
    } catch (error) {
      console.error("Review clipboard error:", error);

      showMessage(
        "Automatic copying failed. Please copy your review manually.",
        "error",
        4000,
      );

      /*
       * Stay on the review page if copying fails.
       * This gives the customer a chance to copy manually.
       */
    }
  }
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <div className={styles.reviewContainer}>

        {/* EXPERIENCE INPUT */}

        <header className={styles.intro}>
          <h1>Write your experience</h1>

          <p>
            Get an AI-assisted review suggestion.
          </p>
        </header>

        <section
          className={styles.experienceSection}
          aria-labelledby="experience-heading"
        >
          <label
            id="experience-heading"
            className={styles.fieldHeading}
            htmlFor="experience-input"
          >
            Write your experience
          </label>

          <textarea
            id="experience-input"
            className={styles.experienceInput}
            value={experience}
            onChange={handleExperienceChange}
            placeholder="What was your experience like?"
            maxLength={MAX_EXPERIENCE_LENGTH}
            rows={3}
            autoCapitalize="sentences"
            spellCheck="true"
          />

          <div className={styles.inputFooter}>
            <span>
              Your own words help shape the suggestion.
            </span>

            <span>
              {experience.length}/
              {MAX_EXPERIENCE_LENGTH}
            </span>
          </div>
        </section>

        {/* STAR RATING */}

        <section
          className={styles.ratingSection}
          aria-labelledby="rating-heading"
        >
          <h2
            id="rating-heading"
            className={styles.fieldHeading}
          >
            Choose your rating
          </h2>

          <div
            className={styles.stars}
            role="radiogroup"
            aria-label="Choose a star rating"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.starButton} ${
                  star <= rating
                    ? styles.starSelected
                    : ""
                }`}
                onClick={() => handleRating(star)}
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} ${
                  star === 1 ? "star" : "stars"
                }`}
              >
                {star <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>

          <p
            className={styles.ratingHint}
            aria-live="polite"
          >
            {rating === 0 && "Tap a star to continue"}

            {rating === 1 && "1 star"}
            {rating === 2 && "2 stars"}
            {rating === 3 && "3 stars"}
            {rating === 4 && "4 stars"}
            {rating === 5 && "5 stars"}
          </p>
        </section>

        {/* REVIEW SUGGESTIONS */}

        <section
          className={styles.optionsSection}
          aria-labelledby="options-heading"
        >
          <div className={styles.optionsHeader}>
            <h2
              id="options-heading"
              className={styles.fieldHeading}
            >
              Review suggestions
            </h2>

            {reviews.length > 0 && (
              <span className={styles.optionCount}>
                {activeIndex + 1} of {reviews.length}
              </span>
            )}
          </div>

          {!rating && (
            <div className={styles.emptyState}>
              Your suggestions will appear here
              after you choose a rating.
            </div>
          )}

          {generating && (
            <div
              className={styles.loadingCard}
              role="status"
              aria-live="polite"
            >
              <span
                className={styles.loader}
                aria-hidden="true"
              />

              <span>
                Preparing your suggestions…
              </span>
            </div>
          )}

          {!generating && reviews.length > 0 && (
            <>
              <div
                className={styles.reviewSlider}
                ref={sliderRef}
                onScroll={updateActiveCard}
                aria-label="Swipe horizontally to browse and edit review suggestions"
              >
                {reviews.map((review, index) => (
                  <article
                    key={`${rating}-${index}`}
                    ref={(element) => {
                      cardRefs.current[index] =
                        element;
                    }}
                    className={`${
                      styles.reviewCard
                    } ${
                      activeIndex === index
                        ? styles.reviewCardActive
                        : ""
                    }`}
                    onClick={() =>
                      centerCard(index)
                    }
                  >
                    <div
                      className={styles.cardTopline}
                    >
                      <span
                        className={styles.cardNumber}
                      >
                        OPTION {index + 1}
                      </span>

                      {activeIndex === index && (
                        <span
                          className={styles.editLabel}
                        >
                          EDIT YOUR REVIEW
                        </span>
                      )}
                    </div>

                    <textarea
                      className={
                        styles.reviewTextarea
                      }
                      value={review}
                      onChange={(event) =>
                        handleReviewChange(
                          index,
                          event.target.value
                        )
                      }
                      onFocus={() =>
                        setActiveIndex(index)
                      }
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      aria-label={`Edit review option ${
                        index + 1
                      }`}
                      maxLength={MAX_REVIEW_LENGTH}
                      rows={7}
                      spellCheck="true"
                    />

                    <div
                      className={styles.cardFooter}
                    >
                      <span>
                        {review.length}/
                        {MAX_REVIEW_LENGTH}
                      </span>

                      <button
                        type="button"
                        className={
                          styles.centerButton
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          centerCard(index);
                        }}
                        aria-label={`Center review option ${
                          index + 1
                        }`}
                      >
                        {activeIndex === index
                          ? "Selected ✓"
                          : "Use this"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div
                className={styles.sliderHint}
                aria-hidden="true"
              >
                <span>‹</span>
                <span>Swipe to explore</span>
                <span>›</span>
              </div>

              <div
                className={styles.sliderDots}
                aria-label="Choose a review option"
              >
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${
                      styles.sliderDot
                    } ${
                      activeIndex === index
                        ? styles.sliderDotActive
                        : ""
                    }`}
                    onClick={() =>
                      centerCard(index)
                    }
                    aria-label={`Show review option ${
                      index + 1
                    }`}
                    aria-current={
                      activeIndex === index
                        ? "true"
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* POST ON GOOGLE */}

        <button
          type="button"
          className={styles.googleButton}
          onClick={handlePostOnGoogle}
          disabled={
            generating || reviews.length === 0
          }
        >
          <span>Post on Google</span>
          <span aria-hidden="true">↗</span>
        </button>

        {/* FOOTER */}

        <footer className={styles.footer}>
          <span>
            Powered by{" "}
            <strong>Shryxa Review</strong>
          </span>

          <span
            className={styles.footerDot}
            aria-hidden="true"
          >
            •
          </span>

          <span>
            Thank you for your feedback ❤️
          </span>
        </footer>
      </div>

      {/* TOAST NOTIFICATION */}

      {message && (
        <div
          className={`${
            styles.toast
          } ${
            messageType === "success"
              ? styles.toastSuccess
              : messageType === "error"
                ? styles.toastError
                : ""
          }`}
          role={
            messageType === "error"
              ? "alert"
              : "status"
          }
          aria-live={
            messageType === "error"
              ? "assertive"
              : "polite"
          }
        >
          <span aria-hidden="true">
            {messageType === "success"
              ? "✓"
              : messageType === "error"
                ? "!"
                : "ⓘ"}
          </span>

          <span>{message}</span>
        </div>
      )}
    </main>
  );
}
