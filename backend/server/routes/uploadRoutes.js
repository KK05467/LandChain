const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { uploadDocument } = require("../controllers/uploadController");

const router = express.Router();

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB, matches frontend copy
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, and PNG files are allowed."));
    }
    cb(null, true);
  },
});

router.post("/", protect, upload.single("document"), uploadDocument);

module.exports = router;
