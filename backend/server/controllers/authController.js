const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { ethers } = require("ethers");
const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, walletAddress } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required." });
  }

  if (User.findByEmail(email)) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  if (walletAddress && !ethers.isAddress(walletAddress)) {
    return res.status(400).json({ message: "walletAddress is not a valid Ethereum address." });
  }

  const user = await User.create({ name, email, password, walletAddress });
  const token = signToken(user);

  res.status(201).json({ token, user: User.toPublic(user) });
});

// POST /api/auth/login  { email, password }
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required." });
  }

  const user = User.findByEmail(email);
  if (!user || !(await User.verifyPassword(user, password))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);
  res.json({ token, user: User.toPublic(user) });
});

// POST /api/auth/wallet-login  { walletAddress, signature, message }
// Verifies the user controls walletAddress by checking a signed message,
// so login never requires sending a private key to the server.
const walletLogin = asyncHandler(async (req, res) => {
  const { walletAddress, signature, message } = req.body;

  if (!walletAddress || !signature || !message) {
    return res
      .status(400)
      .json({ message: "walletAddress, signature and message are required." });
  }

  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch {
    return res.status(400).json({ message: "Could not verify signature." });
  }

  if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
    return res.status(401).json({ message: "Signature does not match walletAddress." });
  }

  const user = User.findByWallet(walletAddress);
  if (!user) {
    return res.status(404).json({
      message: "No account is linked to this wallet yet. Sign up first and attach a wallet.",
    });
  }

  const token = signToken(user);
  res.json({ token, user: User.toPublic(user) });
});

// POST /api/auth/google  { idToken }
// Verifies the Google ID token server-side (never trusts the client's
// claimed identity), then finds or creates the matching account.
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: "idToken is required." });
  }
  if (!googleClient) {
    return res.status(503).json({
      message: "Google login is not configured. Set GOOGLE_CLIENT_ID in the backend .env.",
    });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: "Invalid Google token." });
  }

  let user = User.findByGoogleId(payload.sub) || User.findByEmail(payload.email);

  if (!user) {
    user = await User.createFromGoogle({
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      googleId: payload.sub,
    });
  } else if (!user.googleId) {
    user = User.updateById(user.id, { googleId: payload.sub });
  }

  const token = signToken(user);
  res.json({ token, user: User.toPublic(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/me  { name }
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "name is required." });
  }
  const updated = User.updateById(req.user.id, { name: name.trim() });
  res.json({ user: User.toPublic(updated) });
});

// POST /api/auth/forgot-password  { email }
// Issues a short-lived reset token. In a real deployment this would be
// emailed to the user, never returned in the API response. Since this
// project has no email sending configured, the token is returned directly
// so the reset flow is fully demonstrable end-to-end - clearly called out
// below and MUST be replaced before any real deployment.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required." });

  const user = User.findByEmail(email);

  // Always respond the same way whether or not the account exists, so
  // this endpoint can't be used to enumerate registered emails.
  const genericResponse = {
    message: "If an account exists for this email, a reset link has been issued.",
  };

  if (!user) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const resetTokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

  User.updateById(user.id, { resetTokenHash, resetTokenExpires });

  const devOnlyResetToken = env.NODE_ENV !== "production" ? rawToken : undefined;

  res.json({ ...genericResponse, devOnlyResetToken });
});

// POST /api/auth/reset-password  { email, token, newPassword }
const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: "email, token and newPassword are required." });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "newPassword must be at least 8 characters." });
  }

  const user = User.findByEmail(email);
  if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }
  if (Date.now() > user.resetTokenExpires) {
    return res.status(400).json({ message: "Reset token has expired. Request a new one." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  if (tokenHash !== user.resetTokenHash) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }

  await User.setPassword(user.id, newPassword);
  res.json({ message: "Password has been reset. You can now log in." });
});

module.exports = {
  signup,
  login,
  walletLogin,
  googleLogin,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
};
