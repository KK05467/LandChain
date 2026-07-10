const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const env = require("./env");

const contractConfigPath = path.join(__dirname, "contract.json");

let contractMeta = null;
if (fs.existsSync(contractConfigPath)) {
  contractMeta = JSON.parse(fs.readFileSync(contractConfigPath, "utf-8"));
} else {
  console.warn(
    "[blockchain] server/config/contract.json not found. Run `npm run deploy:local` " +
      "(or deploy:sepolia) first. API will start, but chain routes will return 503."
  );
}

const provider = new ethers.JsonRpcProvider(env.RPC_URL);

// Read-only contract instance (no signer) - safe for all "get" endpoints.
const readOnlyContract = contractMeta
  ? new ethers.Contract(contractMeta.address, contractMeta.abi, provider)
  : null;

// Server-side signer used for verifier-role actions (verify/reject a
// property) triggered from an authenticated admin/verifier API call.
// In production this key belongs to the registry authority, kept in a
// secrets manager - never committed.
let serverSigner = null;
let contractWithSigner = null;

if (contractMeta && env.SERVER_SIGNER_PRIVATE_KEY) {
  serverSigner = new ethers.Wallet(env.SERVER_SIGNER_PRIVATE_KEY, provider);
  contractWithSigner = new ethers.Contract(contractMeta.address, contractMeta.abi, serverSigner);
} else if (contractMeta) {
  console.warn(
    "[blockchain] SERVER_SIGNER_PRIVATE_KEY not set. Verifier-only write routes " +
      "(verify/reject) will be unavailable until it is configured."
  );
}

module.exports = {
  contractMeta,
  provider,
  readOnlyContract,
  contractWithSigner,
  isConfigured: Boolean(contractMeta),
};
