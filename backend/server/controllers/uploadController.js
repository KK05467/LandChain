const ipfs = require("../config/ipfs");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/upload  (multipart/form-data, field name "document")
// Returns the IPFS CID; the frontend then passes this hash into
// registerProperty()/updateDocumentHash() on-chain via the user's wallet.
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded. Use field name 'document'." });
  }

  const cid = await ipfs.pinBuffer(req.file.buffer, req.file.originalname);

  res.status(201).json({
    filename: req.file.originalname,
    size: req.file.size,
    cid,
    url: ipfs.gatewayUrl(cid),
  });
});

module.exports = { uploadDocument };
