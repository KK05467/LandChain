const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const db = require("../config/db");

const SALT_ROUNDS = 10;

function findByEmail(email) {
  return db.get("users").find({ email: email.toLowerCase() }).value();
}

function findByWallet(walletAddress) {
  if (!walletAddress) return undefined;
  return db
    .get("users")
    .find({ walletAddress: walletAddress.toLowerCase() })
    .value();
}

function findById(id) {
  return db.get("users").find({ id }).value();
}

async function create({ name, email, password, walletAddress }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash,
    walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
    googleId: null,
    role: "owner", // owner | verifier | admin
    resetTokenHash: null,
    resetTokenExpires: null,
    createdAt: new Date().toISOString(),
  };
  db.get("users").push(user).write();
  return user;
}

async function createFromGoogle({ name, email, googleId }) {
  const user = {
    id: randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash: null,
    walletAddress: null,
    googleId,
    role: "owner",
    resetTokenHash: null,
    resetTokenExpires: null,
    createdAt: new Date().toISOString(),
  };
  db.get("users").push(user).write();
  return user;
}

function findByGoogleId(googleId) {
  return db.get("users").find({ googleId }).value();
}

function updateById(id, patch) {
  db.get("users").find({ id }).assign(patch).write();
  return findById(id);
}

async function setPassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  return updateById(id, { passwordHash, resetTokenHash: null, resetTokenExpires: null });
}

async function verifyPassword(user, plainPassword) {
  if (!user.passwordHash) return false;
  return bcrypt.compare(plainPassword, user.passwordHash);
}

function toPublic(user) {
  if (!user) return null;
  const { passwordHash, resetTokenHash, resetTokenExpires, ...safe } = user;
  return safe;
}

module.exports = {
  findByEmail,
  findByWallet,
  findByGoogleId,
  findById,
  create,
  createFromGoogle,
  updateById,
  setPassword,
  verifyPassword,
  toPublic,
};
