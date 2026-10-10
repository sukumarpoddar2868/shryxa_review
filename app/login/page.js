
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/client/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login failed:", error);
      setError("Unable to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Forgot password flow will be connected later.
    console.log("Forgot password clicked");
  };

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />

      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brandSection}>
          <button
            type="button"
            className={styles.brand}
            onClick={() => router.push("/")}
            aria-label="Go to Shryxa home"
          >
            <span className={styles.logoBox}>
              <img src="/shryxa-logo.png" alt="Shryxa Review" />
            </span>

            <span className={styles.brandName}>Shryxa</span>
          </button>

          <p className={styles.tagline}>
            Manage your business reviews with ease.
          </p>
        </div>

        {/* Login Card */}
        <section className={styles.card}>
          <div className={styles.header}>
            <h1>Welcome back</h1>

            <p>Login to your Shryxa Review account.</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className={styles.field}>
              <div className={styles.passwordHeader}>
                <label htmlFor="password">Password</label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className={styles.forgotButton}
                >
                  Forgot password?
                </button>
              </div>

              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className={styles.showButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Login */}
            {error && (
              <p role="alert" className={styles.errorMessage}>
                {error}
              </p>
            )}
            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}

              {!isLoading && <span>↗</span>}
            </button>
          </form>

          {/* Signup */}
          <div className={styles.signupSection}>
            <span>Don't have an account?</span>

            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className={styles.signupButton}
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Footer */}
        <p className={styles.footer}>
          © {new Date().getFullYear()} Shryxa. All rights reserved.
        </p>
      </div>
    </main>
  );
}

