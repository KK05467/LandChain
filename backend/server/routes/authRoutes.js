const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");
const { protect } = require("../middleware/auth");
const {
  signup,
  login,
  walletLogin,
  googleLogin,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("name is required"),
    body("email").isEmail().withMessage("a valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("password must be at least 8 characters"),
  ],
  validateRequest,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("a valid email is required"),
    body("password").notEmpty().withMessage("password is required"),
  ],
  validateRequest,
  login
);

router.post(
  "/wallet-login",
  [
    body("walletAddress").notEmpty(),
    body("signature").notEmpty(),
    body("message").notEmpty(),
  ],
  validateRequest,
  walletLogin
);

router.post("/google", [body("idToken").notEmpty()], validateRequest, googleLogin);

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("a valid email is required")],
  validateRequest,
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("email").isEmail(),
    body("token").notEmpty(),
    body("newPassword").isLength({ min: 8 }),
  ],
  validateRequest,
  resetPassword
);

router.get("/me", protect, me);
router.patch("/me", protect, [body("name").trim().notEmpty()], validateRequest, updateProfile);

module.exports = router;
