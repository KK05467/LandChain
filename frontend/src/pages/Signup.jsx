import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed } from "react-icons/hi2";
import { TbShieldCheck } from "react-icons/tb";
import { useAuth } from "../context/AuthContext.jsx";
import { useWallet } from "../context/WalletContext.jsx";
import { formatAddress } from "../lib/wallet.js";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { address, connect, connecting, hasWallet } = useWallet();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        walletAddress: address || undefined,
      });
      navigate("/upload");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConnectWallet() {
    setError(null);
    try {
      await connect();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth">
      <section className="auth__visual">
        <span className="eyebrow auth__eyebrow">Get Started</span>
        <h1>
          Register your land,
          <br />
          own it forever.
        </h1>
        <p>
          Create your LANDCHAIN account to start registering, verifying, and
          transferring property titles on an immutable public ledger.
        </p>

        <div className="auth__stats">
          <div className="auth__stat">
            <strong>2 min</strong>
            <span>Average setup time</span>
          </div>
          <div className="auth__stat">
            <strong>0</strong>
            <span>Paperwork required</span>
          </div>
        </div>
      </section>

      <section className="auth__form-side">
        <motion.div
          className="auth-card glass-strong"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="auth-card__heading">Create your account</h2>
          <p className="auth-card__subtext">
            Already registered? <Link to="/login">Log in</Link>
          </p>

          {error && <p className="auth-card__error" role="alert">{error}</p>}
          {address && (
            <p className="auth-card__success">
              Wallet linked: {formatAddress(address)}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <div className="field__input-wrap">
                <HiOutlineUser className="field__icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="field__input-wrap">
                <HiOutlineEnvelope className="field__icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="field__input-wrap">
                <HiOutlineLockClosed className="field__icon" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={updateField}
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
                  name="confirm"
                  type="password"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: 6 }}
              disabled={submitting}
            >
              {submitting ? "Creating account..." : "Create Account"}
            </motion.button>
          </form>

          <div className="auth-card__divider">OR</div>

          <button
            className="auth-card__wallet-btn"
            onClick={handleConnectWallet}
            disabled={connecting || Boolean(address)}
            type="button"
          >
            <TbShieldCheck size={18} />
            {address
              ? `Wallet Connected (${formatAddress(address)})`
              : connecting
              ? "Connecting..."
              : hasWallet
              ? "Connect Wallet"
              : "Install a Wallet"}
          </button>

          <div className="auth-card__divider">OR</div>

          <GoogleLoginButton onError={setError} />
        </motion.div>
      </section>
    </main>
  );
}
