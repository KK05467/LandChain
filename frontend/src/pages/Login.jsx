import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineEnvelope, HiOutlineLockClosed } from "react-icons/hi2";
import { TbShieldCheck } from "react-icons/tb";
import { useAuth } from "../context/AuthContext.jsx";
import { useWallet } from "../context/WalletContext.jsx";
import { signLoginMessage } from "../lib/wallet.js";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, walletLogin } = useAuth();
  const { address, connect, hasWallet } = useWallet();

  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updateField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate("/upload");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWalletLogin() {
    setError(null);
    setWalletSubmitting(true);
    try {
      const account = address || (await connect());
      const { message, signature } = await signLoginMessage(account);
      await walletLogin({ walletAddress: account, message, signature });
      navigate("/upload");
    } catch (err) {
      setError(err.message);
    } finally {
      setWalletSubmitting(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth__visual">
        <span className="eyebrow auth__eyebrow">Welcome Back</span>
        <h1>
          Your land records,
          <br />
          one login away.
        </h1>
        <p>
          Access your verified property portfolio, track pending transfers, and
          manage your on-chain deeds from a single secure account.
        </p>

        <div className="auth__stats">
          <div className="auth__stat">
            <strong>128K+</strong>
            <span>Records secured</span>
          </div>
          <div className="auth__stat">
            <strong>99.99%</strong>
            <span>Ledger uptime</span>
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
          <h2 className="auth-card__heading">Log in to LANDCHAIN</h2>
          <p className="auth-card__subtext">
            New here? <Link to="/signup">Create an account</Link>
          </p>

          {error && <p className="auth-card__error" role="alert">{error}</p>}

          <form onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={updateField}
                  required
                />
              </div>
            </div>

            <div className="field__row">
              <label className="field__checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="field__forgot">Forgot password?</Link>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
            >
              {submitting ? "Logging in..." : "Log In"}
            </motion.button>
          </form>

          <div className="auth-card__divider">OR</div>

          <button
            className="auth-card__wallet-btn"
            onClick={handleWalletLogin}
            disabled={walletSubmitting}
            type="button"
          >
            <TbShieldCheck size={18} />
            {walletSubmitting
              ? "Signing..."
              : hasWallet
              ? "Connect Wallet Instead"
              : "Install a Wallet"}
          </button>

          <div className="auth-card__divider">OR</div>

          <GoogleLoginButton onError={setError} />
        </motion.div>
      </section>
    </main>
  );
}
