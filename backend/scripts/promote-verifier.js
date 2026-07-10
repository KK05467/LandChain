// One-time admin utility: promotes a signed-up user to the "verifier" role
// so they can call the protected /api/properties/:id/verify and /reject
// routes. Run this while the API server is STOPPED (or restart the server
// immediately after), since the JSON user store is loaded into memory once
// at server boot and won't pick up an external file edit on its own.
//
// Usage:
//   node scripts/promote-verifier.js alice@example.com
const path = require("path");
const db = require(path.join(__dirname, "..", "server", "config", "db.js"));

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-verifier.js <email>");
  process.exit(1);
}

const user = db.get("users").find({ email: email.toLowerCase() }).value();
if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

db.get("users").find({ email: email.toLowerCase() }).assign({ role: "verifier" }).write();
console.log(`✓ ${email} promoted to role: verifier`);
console.log("Restart the API server (npm run server) for this to take effect.");
