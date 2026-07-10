const { ethers } = require("ethers");
const blockchain = require("../config/blockchain");
const asyncHandler = require("../utils/asyncHandler");

function assertConfigured(res) {
  if (!blockchain.isConfigured) {
    res.status(503).json({
      message:
        "LandRegistry is not deployed yet. Run `npm run deploy:local` (or deploy:sepolia), " +
        "which writes server/config/contract.json.",
    });
    return false;
  }
  return true;
}

function serializeProperty(prop) {
  return {
    id: Number(prop.id),
    propertyCode: prop.propertyCode,
    owner: prop.owner,
    location: prop.location,
    areaSqFt: Number(prop.areaSqFt),
    documentHash: prop.documentHash,
    status: ["Pending", "Verified", "Rejected"][Number(prop.status)],
    registeredAt: Number(prop.registeredAt),
    verifiedAt: Number(prop.verifiedAt),
    verifiedBy: prop.verifiedBy,
  };
}

// GET /api/chain/config
// Gives the frontend everything it needs to talk to the contract directly
// through the user's own wallet (MetaMask etc). Registration and transfer
// are end-user actions signed with the user's own key, never the server's -
// ownership must always be attributable to the real wallet, not a backend proxy.
const getChainConfig = asyncHandler(async (req, res) => {
  if (!assertConfigured(res)) return;
  const { address, abi, chainId, network } = blockchain.contractMeta;
  res.json({ address, abi, chainId, network });
});

// GET /api/properties?limit=20&offset=0
const listProperties = asyncHandler(async (req, res) => {
  if (!assertConfigured(res)) return;

  const total = Number(await blockchain.readOnlyContract.totalProperties());
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const ids = [];
  for (let id = total - offset; id > Math.max(0, total - offset - limit); id--) {
    ids.push(id);
  }

  const properties = await Promise.all(
    ids.map((id) => blockchain.readOnlyContract.getProperty(id))
  );

  res.json({ total, items: properties.map(serializeProperty) });
});

// GET /api/properties/:id
const getProperty = asyncHandler(async (req, res) => {
  if (!assertConfigured(res)) return;
  const id = Number(req.params.id);
  const prop = await blockchain.readOnlyContract.getProperty(id);
  res.json({ property: serializeProperty(prop) });
});

// GET /api/properties/owner/:address
const getPropertiesByOwner = asyncHandler(async (req, res) => {
  if (!assertConfigured(res)) return;
  const { address } = req.params;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ message: "Invalid address." });
  }

  const ids = await blockchain.readOnlyContract.getPropertiesByOwner(address);
  const properties = await Promise.all(
    ids.map((id) => blockchain.readOnlyContract.getProperty(id))
  );
  res.json({ items: properties.map(serializeProperty) });
});

// POST /api/properties/:id/verify   (role: verifier | admin)
const verifyProperty = asyncHandler(async (req, res) => {
  if (!assertConfigured(res)) return;
  if (!blockchain.contractWithSigner) {
    return res.status(503).json({
      message: "Server signer is not configured. Set SERVER_SIGNER_PRIVATE_KEY in .env.",
    });
  }

  const id = Number(req.params.id);
  const tx = await blockchain.contractWithSigner.verifyProperty(id);
  const receipt = await tx.wait();

  res.json({ message: "Property verified on-chain.", txHash: receipt.hash });
});

// POST /api/properties/:id/reject   (role: verifier | admin)  { reason }
const rejectProperty = asyncHandler(async (req, res) => {
  if (!assertConfigured(res)) return;
  if (!blockchain.contractWithSigner) {
    return res.status(503).json({
      message: "Server signer is not configured. Set SERVER_SIGNER_PRIVATE_KEY in .env.",
    });
  }

  const id = Number(req.params.id);
  const reason = req.body.reason || "Not specified";

  const tx = await blockchain.contractWithSigner.rejectProperty(id, reason);
  const receipt = await tx.wait();

  res.json({ message: "Property rejected on-chain.", txHash: receipt.hash });
});

module.exports = {
  getChainConfig,
  listProperties,
  getProperty,
  getPropertiesByOwner,
  verifyProperty,
  rejectProperty,
};
