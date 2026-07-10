import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import UploadBox from "../components/UploadBox.jsx";
import { useWallet } from "../context/WalletContext.jsx";
import { api } from "../lib/api.js";
import { formatAddress } from "../lib/wallet.js";
import "./UploadDocuments.css";

const STATUS_CLASS = {
  Pending: "property-row__status--pending",
  Verified: "property-row__status--verified",
  Rejected: "property-row__status--rejected",
};

export default function UploadDocuments() {
  const { address } = useWallet();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const loadProperties = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setLoadError(null);
    try {
      const { items } = await api.getPropertiesByOwner(address);
      setProperties(items);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  return (
    <main className="upload-page section">
      <div className="container upload-page__container">
        <motion.div
          className="upload-page__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="eyebrow">Document Verification</span>
          <h1>Upload your property documents</h1>
          <p>
            Deeds, surveys, and identity proofs are hashed and pinned to IPFS,
            then linked to your on-chain record for permanent, tamper-proof
            verification.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <UploadBox />
        </motion.div>

        {address && (
          <motion.div
            className="my-properties glass"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <div className="my-properties__header">
              <h3>Your properties &mdash; {formatAddress(address)}</h3>
              <button className="my-properties__refresh" onClick={loadProperties} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadError && <p className="auth-card__error">{loadError}</p>}

            {!loading && properties.length === 0 && !loadError && (
              <p className="my-properties__empty">
                No properties registered to this wallet yet. Upload a document above to get started.
              </p>
            )}

            <div className="property-rows">
              {properties.map((p) => (
                <div className="property-row" key={p.id}>
                  <div className="property-row__main">
                    <span className="property-row__code">{p.propertyCode}</span>
                    <span className="property-row__location">{p.location}</span>
                  </div>
                  <span className={`property-row__status ${STATUS_CLASS[p.status]}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
