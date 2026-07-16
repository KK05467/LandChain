import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Navigate } from "react-router-dom";
import { HiOutlineUserCircle, HiOutlinePencil, HiOutlineCheck } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext.jsx";
import { useWallet } from "../context/WalletContext.jsx"
import { api } from "../lib/api.js"
import { formatAddress } from "../lib/wallet.js";
import "./Account.css";

const STATUS_CLASS = {
  Pending: "property-row__status--pending",
  Verified: "property-row__status--verified",
  Rejected: "property-row__status--rejected",
};

function StatCounter({ value, label }) {
  const ref = useRef(null);

  useEffect(() => {
    const counter = { n: 0 };
    gsap.to(counter, {
      n: value,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(counter.n);
      },
    });
  }, [value]);

  return (
    <div className="account-stat">
      <strong ref={ref}>0</strong>
      <span>{label}</span>
    </div>
  );
}

export default function Account() {
  const { user, token, loading } = useAuth();
  const { address, connect, hasWallet } = useWallet();

  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  const loadProperties = useCallback(async () => {
    if (!address) return;
    setLoadingProps(true);
    try {
      const { items } = await api.getPropertiesByOwner(address);
      setProperties(items);
    } catch {
      setProperties([]);
    } finally {
      setLoadingProps(false);
    }
  }, [address]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  async function handleSaveName() {
    setSaveState("saving");
    try {
      await api.updateProfile({ name }, token);
      setSaveState("saved");
      setEditingName(false);
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  }

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const verifiedCount = properties.filter((p) => p.status === "Verified").length;
  const pendingCount = properties.filter((p) => p.status === "Pending").length;

  return (
    <main className="account section">
      <div className="container account__container">
        <motion.div
          className="account__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="eyebrow">Your Account</span>
          <h1>Manage your LANDCHAIN profile</h1>
        </motion.div>

        <motion.div
          className="account-card glass-strong"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="account-card__top">
            <div className="account-card__avatar">
              <HiOutlineUserCircle size={56} />
            </div>

            <div className="account-card__identity">
              {editingName ? (
                <div className="account-card__name-edit">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                  <button onClick={handleSaveName} aria-label="Save name">
                    <HiOutlineCheck size={18} />
                  </button>
                </div>
              ) : (
                <h2>
                  {user.name}
                  <button
                    className="account-card__edit-btn"
                    onClick={() => setEditingName(true)}
                    aria-label="Edit name"
                  >
                    <HiOutlinePencil size={15} />
                  </button>
                </h2>
              )}
              <p className="account-card__email">{user.email}</p>
              {saveState === "saved" && <span className="account-card__saved">Saved</span>}
              {saveState === "error" && (
                <span className="account-card__error-text">Couldn&rsquo;t save. Try again.</span>
              )}
            </div>
          </div>

          <div className="account-card__wallet">
            <div>
              <span className="account-card__field-label">Linked Wallet</span>
              <p className="account-card__wallet-address">
                {address ? formatAddress(address) : user.walletAddress ? formatAddress(user.walletAddress) : "Not connected"}
              </p>
            </div>
            {!address && (
              <button className="btn btn-outline" onClick={connect} disabled={!hasWallet}>
                {hasWallet ? "Connect Wallet" : "Install a Wallet"}
              </button>
            )}
          </div>

          <div className="account-stats">
            <StatCounter value={properties.length} label="Total Properties" />
            <StatCounter value={verifiedCount} label="Verified" />
            <StatCounter value={pendingCount} label="Pending" />
          </div>
        </motion.div>

        <motion.div
          className="account-properties glass"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="account-properties__header">
            <h3>Your properties</h3>
            <button onClick={loadProperties} disabled={loadingProps || !address}>
              {loadingProps ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {!address && <p className="account-properties__empty">Connect your wallet to see your registered properties.</p>}
          {address && !loadingProps && properties.length === 0 && (
            <p className="account-properties__empty">No properties registered to this wallet yet.</p>
          )}

          <div className="property-rows">
            {properties.map((p) => (
              <div className="property-row" key={p.id}>
                <div className="property-row__main">
                  <span className="property-row__code">{p.propertyCode}</span>
                  <span className="property-row__location">{p.location}</span>
                </div>
                <span className={`property-row__status ${STATUS_CLASS[p.status]}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
