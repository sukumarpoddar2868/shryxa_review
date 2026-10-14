"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./review.module.css";

const MAX_EXPERIENCE_LENGTH = 500;
const MAX_REVIEW_LENGTH = 1000;

export default function ReviewPage({ qrIdentifier, googleReviewUrl }) {
  const [experience, setExperience] = useState("");
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const sliderRef = useRef(null);
  const cardRefs = useRef([]);
  const toastTimerRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const generationIdRef = useRef(0);

  // Display a notification.
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

  // Clean up timers and invalidate pending requests on unmount.
  useEffect(() => {
    return () => {
      generationIdRef.current++;

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Generate four reviews through the backend API.
  async function handleRating(star) {
    setRating(star);
    setMessage("");
    setReviews([]);
    setActiveIndex(0);

    // Require the customer's experience before generating reviews.
    if (!experience.trim()) {
      setGenerating(false);
      generationIdRef.current++;

      showMessage(
        "Write your experience first, then choose a rating.",
        "info"
      );

      return;
    }

    const generationId = ++generationIdRef.current;

    setGenerating(true);

    try {
      const response = await fetch("/api/review/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qrIdentifier,
          experience: experience.trim(),
          rating: star,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // Ignore an outdated response if the customer selected another rating.
      if (generationId !== generationIdRef.current) {
        return;
      }

      if (!response.ok) {
        if (data.code === "SUBSCRIPTION_INACTIVE") {
          showMessage(
            "AI review generation is unavailable because this business's subscription is inactive.",
            "error",
            4500
          );
        } else {
          showMessage(
            data.error || "Could not generate reviews. Please try again.",
            "error",
            4000
          );
        }

        return;
      }

      // Validate the response before displaying the suggestions.
      if (
        !Array.isArray(data.reviews) ||
        data.reviews.length !== 4 ||
        !data.reviews.every(
          (review) =>
            typeof review === "string" && review.trim().length > 0
        )
      ) {
        throw new Error("The review API returned an invalid response.");
      }

      setReviews(data.reviews.map((review) => review.trim()));

      requestAnimationFrame(() => {
        if (sliderRef.current) {
          sliderRef.current.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        }
      });
    } catch (error) {
      console.error("Review generation failed:", error);

      if (generationId === generationIdRef.current) {
        showMessage(
          "Review generation failed. Check your connection and try again.",
          "error",
          4000
        );
      }
    } finally {
      if (generationId === generationIdRef.current) {
        setGenerating(false);
      }
    }
  }

  // Update the customer's original experience.
  function handleExperienceChange(event) {
    setExperience(event.target.value);
  }

  // Allow the customer to edit each review.
  function handleReviewChange(index, value) {
    setReviews((currentReviews) =>
      currentReviews.map((review, reviewIndex) =>
        reviewIndex === index ? value : review
      )
    );
  }

  // Identify the review card closest to the slider's center.
  function updateActiveCard() {
    const slider = sliderRef.current;

    if (!slider || cardRefs.current.length === 0) {
      return;
    }

    const sliderRect = slider.getBoundingClientRect();
    const sliderCenter = sliderRect.left + sliderRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(sliderCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }

  // Center a selected review card.
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

  // Copy review text to the clipboard.
  async function copyReviewText(text) {
    const reviewText = text?.trim();

    if (!reviewText) {
      throw new Error("Review text is empty.");
    }

    // Prefer the modern Clipboard API.
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

    // Fallback for browsers where the Clipboard API is unavailable.
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

  // Retrieve and validate the Google Review URL passed by page.js.
  function getGoogleReviewUrl() {
    if (!googleReviewUrl) {
      throw new Error("Google Review URL is unavailable.");
    }

    const url = new URL(googleReviewUrl);

    if (url.protocol !== "https:") {
      throw new Error("Invalid Google Review URL.");
    }

    return url.toString();
  }

  // Copy the selected review and navigate to Google.
  async function handlePostOnGoogle() {
    const reviewText = (reviews[activeIndex] || "").trim();

    if (!rating) {
      showMessage("Choose a star rating first.", "info");
      return;
    }

    if (generating) {
      showMessage("Please wait for your review options.", "info");
      return;
    }

    if (!reviewText) {
      showMessage(
        "Write your review in the card before continuing.",
        "info"
      );
      return;
    }

    let googleUrl;

    try {
      googleUrl = getGoogleReviewUrl();
    } catch (error) {
      console.error("Google Review URL error:", error);

      showMessage(
        "The Google Review link is unavailable right now.",
        "error"
      );

      return;
    }

    // Open a tab during the click to reduce popup-blocker issues.
    let googleWindow = null;

    try {
      googleWindow = window.open("about:blank", "_blank");

      if (googleWindow) {
        googleWindow.opener = null;
      }
    } catch {
      googleWindow = null;
    }

    try {
      await copyReviewText(reviewText);

      showMessage(
        "Review copied! Paste it on Google.",
        "success",
        2500
      );

      redirectTimerRef.current = window.setTimeout(() => {
        if (googleWindow && !googleWindow.closed) {
          googleWindow.location.replace(googleUrl);
        } else {
          window.location.assign(googleUrl);
        }
      }, 850);
    } catch (error) {
      console.error("Review clipboard error:", error);

      if (googleWindow && !googleWindow.closed) {
        googleWindow.close();
      }

      showMessage(
        "Automatic copying failed. Please try again or copy the text manually.",
        "error",
        4000
      );
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <div className={styles.reviewContainer}>
        {/* EXPERIENCE INPUT */}
        <header className={styles.intro}>
          <h1>Write your experience</h1>
          <p>Get an AI-assisted review suggestion.</p>
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
            <span>Your own words help shape the suggestion.</span>
            <span>
              {experience.length}/{MAX_EXPERIENCE_LENGTH}
            </span>
          </div>
        </section>

        {/* STAR RATING */}
        <section
          className={styles.ratingSection}
          aria-labelledby="rating-heading"
        >
          <h2 id="rating-heading" className={styles.fieldHeading}>
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
                  star <= rating ? styles.starSelected : ""
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

          <p className={styles.ratingHint} aria-live="polite">
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
            <h2 id="options-heading" className={styles.fieldHeading}>
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
              Your suggestions will appear here after you choose a rating.
            </div>
          )}

          {generating && (
            <div
              className={styles.loadingCard}
              role="status"
              aria-live="polite"
            >
              <span className={styles.loader} aria-hidden="true" />
              <span>Preparing your suggestions…</span>
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
                      cardRefs.current[index] = element;
                    }}
                    className={`${styles.reviewCard} ${
                      activeIndex === index
                        ? styles.reviewCardActive
                        : ""
                    }`}
                    onClick={() => centerCard(index)}
                  >
                    <div className={styles.cardTopline}>
                      <span className={styles.cardNumber}>
                        OPTION {index + 1}
                      </span>

                      {activeIndex === index && (
                        <span className={styles.editLabel}>
                          EDIT YOUR REVIEW
                        </span>
                      )}
                    </div>

                    <textarea
                      className={styles.reviewTextarea}
                      value={review}
                      onChange={(event) =>
                        handleReviewChange(index, event.target.value)
                      }
                      onFocus={() => setActiveIndex(index)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Edit review option ${index + 1}`}
                      maxLength={MAX_REVIEW_LENGTH}
                      rows={7}
                      spellCheck="true"
                    />

                    <div className={styles.cardFooter}>
                      <span>
                        {review.length}/{MAX_REVIEW_LENGTH}
                      </span>

                      <button
                        type="button"
                        className={styles.centerButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          centerCard(index);
                        }}
                        aria-label={`Center review option ${index + 1}`}
                      >
                        {activeIndex === index
                          ? "Selected ✓"
                          : "Use this"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className={styles.sliderHint} aria-hidden="true">
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
                    className={`${styles.sliderDot} ${
                      activeIndex === index
                        ? styles.sliderDotActive
                        : ""
                    }`}
                    onClick={() => centerCard(index)}
                    aria-label={`Show review option ${index + 1}`}
                    aria-current={
                      activeIndex === index ? "true" : undefined
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
          disabled={generating || reviews.length === 0}
        >
          <span>Post on Google</span>
          <span aria-hidden="true">↗</span>
        </button>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <span>
            Powered by <strong>Shryxa Review</strong>
          </span>

          <span className={styles.footerDot} aria-hidden="true">
            •
          </span>

          <span>Thank you for your feedback ❤️</span>
        </footer>
      </div>

      {/* TOAST NOTIFICATION */}
      {message && (
        <div
          className={`${styles.toast} ${
            messageType === "success"
              ? styles.toastSuccess
              : messageType === "error"
                ? styles.toastError
                : ""
          }`}
          role={messageType === "error" ? "alert" : "status"}
          aria-live={
            messageType === "error" ? "assertive" : "polite"
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
