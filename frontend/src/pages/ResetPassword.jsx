import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineLockClosed, HiOutlineEnvelope } from "react-icons/hi2";
import { api } from "../lib/api.js";
import "./Auth.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(params.get("email") || "");
  const [token, setToken] = useState(params.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword({ email, token, newPassword });
      setDone(true);
      setTimeout(() => navigate("/login"), 1800);
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
          Set a new
          <br />
          password.
        </h1>
        <p>Choose something strong you haven&rsquo;t used before.</p>
      </section>

      <section className="auth__form-side">
        <motion.div
          className="auth-card glass-strong"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="auth-card__heading">Reset password</h2>
          <p className="auth-card__subtext">
            <Link to="/login">Back to login</Link>
          </p>

          {error && <p className="auth-card__error" role="alert">{error}</p>}
          {done && <p className="auth-card__success">Password reset. Redirecting to login&hellip;</p>}

          {!done && (
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

              <div className="field">
                <label htmlFor="token">Reset Token</label>
                <div className="field__input-wrap">
                  <HiOutlineLockClosed className="field__icon" />
                  <input
                    id="token"
                    type="text"
                    placeholder="Paste the token from your email"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="newPassword">New Password</label>
                <div className="field__input-wrap">
                  <HiOutlineLockClosed className="field__icon" />
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Create a new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="confirm">Confirm Password</label>
                <div className="field__input-wrap">
                  <HiOutlineLockClosed className="field__icon" />
                  <input
                    id="confirm"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                {submitting ? "Resetting..." : "Reset Password"}
              </motion.button>
            </form>
          )}
        </motion.div>
      </section>
    </main>
  );
}
