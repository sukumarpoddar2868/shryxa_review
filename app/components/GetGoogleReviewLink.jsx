"use client";
import styles from "./GetGoogleReviewLink.module.css";
import { useState } from "react";

export default function GetGoogleReviewLink({
  shopName,
  address,
  onUrlFound,
}) {
  const [loading, setLoading] = useState(false);

  async function handleGetReviewLink() {
    if (!shopName || !address) {
      alert("Please enter your business name and address first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/google-review-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopName,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not find your Google review page."
        );
      }

      onUrlFound(data.reviewUrl);
    } catch (error) {
      console.error("Google review link error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
  type="button"
  onClick={handleGetReviewLink}
  disabled={loading}
  className={styles.button}
>
  {loading ? "Finding..." : "Get your review page URL"}
</button>
  );
}
