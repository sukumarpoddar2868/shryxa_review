"use client";

import { useEffect, useState } from "react";
import styles from "./review.module.css";

const DEMO_BUSINESS = {
  name: "ABC Restaurant",
  googleReviewUrl: "https://www.google.com/maps",
};

/*
 * TEMPORARY LLM SIMULATION
 *
 * This is only here so the frontend can be tested.
 *
 * In production, this function will be replaced by an API call:
 *
 * Customer selects rating
 *        ↓
 * Backend
 *        ↓
 * LLM
 *        ↓
 * 4 review suggestions
 *
 * We are intentionally not putting real review content here.
 */
function generateDemoReviews(rating) {
  return [
    `LLM generated review ${rating}★ — Option 1`,
    `LLM generated review ${rating}★ — Option 2`,
    `LLM generated review ${rating}★ — Option 3`,
    `LLM generated review ${rating}★ — Option 4`,
  ];
}

export default function ReviewPage({ qrIdentifier }) {
  const [rating, setRating] = useState(0);

  // Reviews returned by the LLM.
  const [reviews, setReviews] = useState([]);

  // The review currently inside the customer's textarea.
  const [selectedReview, setSelectedReview] = useState("");

  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * Temporary business data.
   *
   * Later:
   *
   * qrIdentifier
   *      ↓
   * backend
   *      ↓
   * database
   *      ↓
   * business.name
   * business.googleReviewUrl
   */
  const business = DEMO_BUSINESS;

  /*
   * Generate review suggestions whenever
   * the customer selects a rating.
   *
   * Currently simulated.
   *
   * Later this will become an API request
   * to the backend/LLM.
   */
  useEffect(() => {
    if (!rating) {
      setReviews([]);
      return;
    }

    setGenerating(true);
    setCopied(false);
    setMessage("");

    const timer = setTimeout(() => {
      const generatedReviews = generateDemoReviews(rating);

      setReviews(generatedReviews);
      setGenerating(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [rating]);

  /*
   * Customer selects a rating.
   */
  function handleRating(star) {
    setRating(star);
    setCopied(false);
    setMessage("");
  }

  /*
   * Customer selects one of the AI-generated
   * suggestions.
   *
   * It is placed into the textarea.
   *
   * The customer can then:
   * - edit it
   * - delete it
   * - replace it completely
   */
  function handleReviewSelect(review) {
    setSelectedReview(review);
    setCopied(false);
    setMessage("");

    setTimeout(() => {
      document
        .getElementById("review-textarea")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  }

  /*
   * Customer writes or edits the review manually.
   */
  function handleReviewChange(event) {
    setSelectedReview(event.target.value);
    setCopied(false);
    setMessage("");
  }

  /*
   * Clear the textarea.
   */
  function handleClearReview() {
    setSelectedReview("");
    setCopied(false);
    setMessage("");
  }

  /*
   * Perfect button.
   *
   * Copies whatever is currently in the textarea.
   *
   * It does not matter whether the content came from:
   *
   * 1. LLM
   * 2. Edited LLM suggestion
   * 3. Completely manual writing
   */
  async function handlePerfect() {
    const reviewText = selectedReview.trim();

    if (!reviewText) {
      setMessage("Please write a review first.");
      setCopied(false);
      return;
    }

    try {
      await navigator.clipboard.writeText(reviewText);

      setCopied(true);
      setMessage("Your review has been copied.");

      setTimeout(() => {
        setCopied(false);
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error("Clipboard error:", error);

      /*
       * Keep the review in the textarea.
       * Customer can manually copy it.
       */
      setCopied(false);
      setMessage(
        "Automatic copy failed. Please copy your review manually."
      );
    }
  }

  /*
   * Open the business-specific Google review page.
   *
   * The customer performs the final posting action
   * on Google.
   */
  function handleGoogleReview() {
    window.open(
      business.googleReviewUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <section className={styles.reviewContainer}>

        {/* =========================
            BRAND
        ========================== */}

        <div className={styles.brand}>
          <div className={styles.logoBox}>
            <img
              src="/shryxa-logo.png"
              alt="Shryxa Review"
            />
          </div>

          <span>Shryxa Review</span>
        </div>

        {/* =========================
            BUSINESS
        ========================== */}

        <header className={styles.header}>
          <span className={styles.smallLabel}>
            CUSTOMER FEEDBACK
          </span>

          <h1>
            How was your experience at{" "}
            <span>{business.name}</span>?
          </h1>

          <p>
            Select a rating to get review suggestions,
            or write your own review.
          </p>
        </header>

        {/* =========================
            STAR RATING
        ========================== */}

        <section className={styles.ratingSection}>
          <div
            className={styles.stars}
            role="radiogroup"
            aria-label="Select your rating"
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
                aria-label={`${star} star${
                  star > 1 ? "s" : ""
                }`}
                aria-checked={star === rating}
                role="radio"
              >
                {star <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>

          <div className={styles.ratingText}>
            {rating === 0 && (
              <span>Rating is optional</span>
            )}

            {rating === 1 && (
              <span>
                We're sorry to hear that.
              </span>
            )}

            {rating === 2 && (
              <span>
                We'd love to do better.
              </span>
            )}

            {rating === 3 && (
              <span>
                Thanks for your feedback.
              </span>
            )}

            {rating === 4 && (
              <span>
                Glad you had a good experience!
              </span>
            )}

            {rating === 5 && (
              <span>
                Wonderful! Thank you! ❤️
              </span>
            )}
          </div>
        </section>

        {/* =========================
            GENERATING
        ========================== */}

        {generating && (
          <section className={styles.loadingCard}>
            <div className={styles.loader} />

            <div className={styles.loadingContent}>
              <strong>
                Creating your review options
              </strong>

              <span>
                Just a moment...
              </span>
            </div>
          </section>
        )}

        {/* =========================
            AI REVIEW OPTIONS
        ========================== */}

        {!generating && reviews.length > 0 && (
          <section className={styles.optionsSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.smallLabel}>
                  REVIEW OPTIONS
                </span>

                <h2>
                  Choose the one you like
                </h2>
              </div>

              <span className={styles.optionCount}>
                {reviews.length} options
              </span>
            </div>

            <p className={styles.suggestionHint}>
              These suggestions are optional. You can
              choose one, edit it, or write your own review.
            </p>

            <div className={styles.reviewOptions}>
              {reviews.map((review, index) => (
                <button
                  type="button"
                  key={index}
                  className={`${styles.reviewOption} ${
                    selectedReview === review
                      ? styles.reviewOptionSelected
                      : ""
                  }`}
                  onClick={() =>
                    handleReviewSelect(review)
                  }
                >
                  <span className={styles.optionNumber}>
                    {index + 1}
                  </span>

                  <span className={styles.optionText}>
                    {review}
                  </span>

                  <span className={styles.optionArrow}>
                    →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* =========================
            REVIEW EDITOR
            ALWAYS VISIBLE
        ========================== */}

        <section className={styles.editorSection}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.smallLabel}>
                YOUR REVIEW
              </span>

              <h2>
                Write it your way
              </h2>
            </div>
          </div>

          <p className={styles.editorHint}>
            Use an AI suggestion above, edit it, or write
            your own review from scratch.
          </p>

          <div className={styles.editorCard}>
            <textarea
              id="review-textarea"
              value={selectedReview}
              onChange={handleReviewChange}
              placeholder="Write your review here..."
              aria-label="Write your review"
              rows={7}
              maxLength={1000}
            />

            <div className={styles.editorFooter}>
              <span>
                {selectedReview.length} / 1000 characters
              </span>

              {selectedReview && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleClearReview}
                >
                  Clear
                </button>
              )}
            </div>

            {/* =========================
                PERFECT
                ALWAYS VISIBLE
            ========================== */}

            <button
              type="button"
              className={styles.perfectButton}
              onClick={handlePerfect}
            >
              <span>Perfect</span>
              <span>✓</span>
            </button>

            {message && (
              <div
                className={
                  copied
                    ? styles.successMessage
                    : styles.infoMessage
                }
              >
                <span>
                  {copied ? "✓" : "ⓘ"}
                </span>

                <span>
                  {message}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* =========================
            GOOGLE
            ALWAYS VISIBLE
        ========================== */}

        <section className={styles.googleSection}>
          <div className={styles.googleIcon}>
            G
          </div>

          <div className={styles.googleContent}>
            <span className={styles.smallLabel}>
              GOOGLE REVIEWS
            </span>

            <h2>
              Ready to share your review?
            </h2>

            <p>
              Continue to Google to complete your review.
              You can make any final changes there before
              posting.
            </p>
          </div>

          {/* =========================
              POST ON GOOGLE
              ALWAYS VISIBLE
          ========================== */}

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleReview}
          >
            <span>Post on Google</span>
            <span>↗</span>
          </button>
        </section>

        {/* =========================
            FOOTER
        ========================== */}

        <footer className={styles.footer}>
          <span>Powered by</span>

          <strong>
            Shryxa Review
          </strong>

          <span className={styles.dot}>
            •
          </span>

          <span>
            Thank you for your feedback ❤️
          </span>
        </footer>

      </section>
    </main>
  );
}
