require("dotenv").config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    console.warn(`[env] Warning: ${name} is not set. Using empty string.`);
    return "";
  }
  return value;
}

module.exports = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  JWT_SECRET: required("JWT_SECRET", "dev-only-change-me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  RPC_URL: process.env.RPC_URL || "http://127.0.0.1:8545",
  SERVER_SIGNER_PRIVATE_KEY: process.env.SERVER_SIGNER_PRIVATE_KEY || "",

  IPFS_API_URL: process.env.IPFS_API_URL || "http://127.0.0.1:5001",
  IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL || "https://ipfs.io/ipfs",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
