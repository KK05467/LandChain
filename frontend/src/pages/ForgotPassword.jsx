import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { api } from "../lib/api.js";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.forgotPassword(email);
      setSent(true);
      // Only present when the backend is running outside production and
      // has no email service configured - see server/controllers/authController.js.
      if (result.devOnlyResetToken) setDevToken(result.devOnlyResetToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth__visual">
        <span className="eyebrow auth__eyebrow">Account Recovery</span>
        <h1>
          Forgot your
          <br />
          password?
        </h1>
        <p>
          Enter the email on your account and we&rsquo;ll send you a link to
          reset your password.
        </p>
      </section>

      <section className="auth__form-side">
        <motion.div
          className="auth-card glass-strong"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="auth-card__heading">Reset your password</h2>
          <p className="auth-card__subtext">
            Remembered it? <Link to="/login">Back to login</Link>
          </p>

          {error && <p className="auth-card__error" role="alert">{error}</p>}

          {sent ? (
            <>
              <p className="auth-card__success">
                If an account exists for {email}, a reset link has been issued.
              </p>
              {devToken && (
                <div className="auth-card__devtoken">
                  <p>
                    No email service is configured for this project, so here&rsquo;s
                    the reset token directly (development only):
                  </p>
                  <code>{devToken}</code>
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: 14 }}
                    onClick={() =>
                      navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${devToken}`)
                    }
                  >
                    Continue to reset password
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="field__input-wrap">
                  <HiOutlineEnvelope className="field__icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Reset Link"}
              </motion.button>
            </form>
          )}
        </motion.div>
      </section>
    </main>
  );
}
