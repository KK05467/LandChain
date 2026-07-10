const express = require("express");
const { body } = require("express-validator");
const { protect, requireRole } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const {
  getChainConfig,
  listProperties,
  getProperty,
  getPropertiesByOwner,
  verifyProperty,
  rejectProperty,
} = require("../controllers/propertyController");

const router = express.Router();

// Public reads - anyone can look up registry records.
router.get("/chain-config", getChainConfig);
router.get("/", listProperties);
router.get("/owner/:address", getPropertiesByOwner);
router.get("/:id", getProperty);

// Verifier-only writes - the registry authority attesting a submission.
router.post("/:id/verify", protect, requireRole("verifier", "admin"), verifyProperty);

router.post(
  "/:id/reject",
  protect,
  requireRole("verifier", "admin"),
  [body("reason").optional().isString()],
  validateRequest,
  rejectProperty
);

module.exports = router;
