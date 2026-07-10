import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocument,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext.jsx";
import { useWallet } from "../context/WalletContext.jsx";
import { api, ApiError } from "../lib/api.js";
import "./UploadBox.css";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadBox() {
  const { token, user } = useAuth();
  const { address, connect, getContract, hasWallet } = useWallet();

  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]); // { id, name, size, uploading, cid, error }
  const [form, setForm] = useState({ propertyCode: "", location: "", areaSqFt: "" });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registeredTx, setRegisteredTx] = useState(null);
  const inputRef = useRef(null);

  const readyFile = files.find((f) => f.cid);

  const uploadOne = useCallback(
    async (file) => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      setFiles((prev) => [
        ...prev,
        { id, name: file.name, size: file.size, uploading: true, cid: null, error: null },
      ]);

      try {
        const result = await api.uploadDocument(file, token);
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, uploading: false, cid: result.cid } : f))
        );
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Upload failed. Is the backend/IPFS node running?";
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, uploading: false, error: message } : f))
        );
      }
    },
    [token]
  );

  const addFiles = useCallback(
    (fileList) => {
      if (!token) return;
      Array.from(fileList).forEach(uploadOne);
    },
    [token, uploadOne]
  );

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleRegister() {
    setRegisterError(null);
    setRegisteredTx(null);

    if (!readyFile) {
      setRegisterError("Upload a document first.");
      return;
    }
    if (!form.propertyCode || !form.location || !form.areaSqFt) {
      setRegisterError("Fill in property code, location, and area.");
      return;
    }

    setRegistering(true);
    try {
      if (!address) await connect();
      const contract = await getContract();

      const tx = await contract.registerProperty(
        form.propertyCode,
        form.location,
        BigInt(form.areaSqFt),
        readyFile.cid
      );
      const receipt = await tx.wait();
      setRegisteredTx(receipt.hash);
    } catch (err) {
      setRegisterError(err.shortMessage || err.reason || err.message || "Transaction failed.");
    } finally {
      setRegistering(false);
    }
  }

  if (!user) {
    return (
      <div className="upload-box-wrap">
        <div className="upload-box glass-strong upload-box--locked">
          <div className="upload-box__icon">
            <HiOutlineCloudArrowUp size={36} />
          </div>
          <h3>Log in to upload documents</h3>
          <p>Document uploads are tied to your account so you can track verification status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-box-wrap">
      <div
        className={`upload-box glass-strong ${dragActive ? "upload-box--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop documents to upload, or click to browse"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
        />
        <div className="upload-box__icon">
          <HiOutlineCloudArrowUp size={36} />
        </div>
        <h3>Drag & drop your property documents</h3>
        <p>PDF, JPG or PNG &mdash; up to 25MB each. Files are pinned to IPFS once uploaded.</p>
        <span className="btn btn-secondary upload-box__browse">Browse Files</span>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="upload-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                className="upload-file-card glass"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                layout
              >
                <div className="upload-file-card__icon">
                  <HiOutlineDocument size={20} />
                </div>

                <div className="upload-file-card__info">
                  <div className="upload-file-card__row">
                    <span className="upload-file-card__name">{file.name}</span>
                    <span className="upload-file-card__size">{formatSize(file.size)}</span>
                  </div>

                  {file.error ? (
                    <span className="upload-file-card__status upload-file-card__status--error">
                      {file.error}
                    </span>
                  ) : file.cid ? (
                    <div className="upload-file-card__hash">
                      <span>IPFS CID</span>
                      <code>{file.cid.slice(0, 20)}&hellip;</code>
                    </div>
                  ) : (
                    <span className="upload-file-card__status">Uploading &amp; pinning&hellip;</span>
                  )}
                </div>

                <button
                  className="upload-file-card__remove"
                  onClick={() => removeFile(file.id)}
                  aria-label={`Remove ${file.name}`}
                >
                  <HiOutlineXMark size={16} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {readyFile && (
        <motion.div
          className="upload-register glass"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4>Register this property on-chain</h4>
          <p className="upload-register__hint">
            Signed with your own wallet &mdash; LANDCHAIN never holds your key.
          </p>

          <div className="upload-register__grid">
            <div className="field">
              <label htmlFor="propertyCode">Property Code</label>
              <input
                id="propertyCode"
                placeholder="LC-2984-KB"
                value={form.propertyCode}
                onChange={(e) => setForm((f) => ({ ...f, propertyCode: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="areaSqFt">Area (sq.ft.)</label>
              <input
                id="areaSqFt"
                type="number"
                min="1"
                placeholder="1200"
                value={form.areaSqFt}
                onChange={(e) => setForm((f) => ({ ...f, areaSqFt: e.target.value }))}
              />
            </div>
            <div className="field upload-register__location">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                placeholder="Varanasi, UP"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>

          {registerError && <p className="auth-card__error">{registerError}</p>}
          {registeredTx && (
            <p className="auth-card__success">
              <HiOutlineCheckCircle style={{ marginRight: 6, verticalAlign: "-2px" }} />
              Registered on-chain. Tx: {registeredTx.slice(0, 14)}&hellip;
            </p>
          )}

          <motion.button
            className="btn btn-primary upload-box__submit"
            disabled={registering}
            whileHover={!registering ? { y: -2 } : {}}
            whileTap={!registering ? { scale: 0.98 } : {}}
            onClick={handleRegister}
          >
            {registering
              ? "Confirming transaction..."
              : !hasWallet
              ? "Install a Wallet to Continue"
              : address
              ? "Submit for Verification"
              : "Connect Wallet & Submit"}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
