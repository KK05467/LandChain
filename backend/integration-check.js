// End-to-end integration check. Simulates what the frontend does through
// the browser wallet, using ethers directly against the same local Hardhat
// node + deployed contract the backend is pointed at.
const { ethers } = require("ethers");

const API = "http://localhost:4000/api";
const RPC = "http://127.0.0.1:8545";

// Hardhat's well-known local test keys (account #1 = property owner "Alice",
// account #2 = "Bob" the buyer). Never used outside this local sandbox.
const ALICE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const BOB_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

async function jsonFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("1) Fetching chain config from backend...");
  const chainConfig = await jsonFetch("/properties/chain-config");
  console.log("   ✓ contract:", chainConfig.address);

  const provider = new ethers.JsonRpcProvider(RPC);
  const alice = new ethers.Wallet(ALICE_KEY, provider);
  const bob = new ethers.Wallet(BOB_KEY, provider);

  console.log("\n2) Signing up a verifier-account user (Landchain admin persona)...");
  const verifierEmail = `verifier-${Date.now()}@landchain.test`;
  const { token: verifierToken, user: verifierUser } = await jsonFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: "Registrar", email: verifierEmail, password: "password123" }),
  });
  console.log("   ✓ signed up:", verifierUser.email, "role:", verifierUser.role);
  console.log(
    "   (NOTE: role is 'owner' by default - promoted to 'verifier' below via direct DB write," +
      " simulating an admin action, since there's no public API to self-promote.)"
  );

  // This mirrors what an operator would do once, out of band - not something
  // exposed over the API. For this test we just show the mechanism exists.
  const { execSync, spawn } = require("child_process");
  const path = require("path");
  const db = require(path.join(__dirname, "server", "config", "db.js"));
  db.get("users").find({ id: verifierUser.id }).assign({ role: "verifier" }).write();
  console.log("   ✓ promoted to verifier role in the user store");

  // The running server loaded its lowdb file into memory at boot and won't
  // pick up an external file edit on its own - restart it so it re-reads
  // the file fresh. (A real deployment would expose an admin-role-change
  // endpoint instead of touching the file directly; this is a test-only
  // shortcut to exercise that role, not the intended production path.)
  console.log("   Restarting API server so it re-reads the updated role...");
  try {
    execSync("fuser -k 4000/tcp", { stdio: "ignore" });
  } catch {
    /* no process was listening - fine */
  }
  await new Promise((r) => setTimeout(r, 500));
  spawn("node", ["server/index.js"], {
    cwd: __dirname,
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
  }).unref();
  await new Promise((r) => setTimeout(r, 1500));
  console.log("   ✓ server restarted");

  console.log("\n3) Alice (wallet owner) registers a property directly on-chain...");
  const aliceContract = new ethers.Contract(chainConfig.address, chainConfig.abi, alice);
  const fakeCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"; // stand-in for a real IPFS CID
  const registerTx = await aliceContract.registerProperty(
    "LC-9001-XY",
    "Lucknow, UP",
    1500,
    fakeCid
  );
  const registerReceipt = await registerTx.wait();
  console.log("   ✓ registered, tx:", registerReceipt.hash);

  console.log("\n4) Reading the record back through the backend API (public read)...");
  const propertiesForAlice = await jsonFetch(`/properties/owner/${alice.address}`);
  const property = propertiesForAlice.items[0];
  console.log("   ✓ property:", property.propertyCode, "status:", property.status);
  if (property.status !== "Pending") throw new Error("Expected Pending status after registration");

  console.log("\n5) Verifier attests the record via the backend API (server-signed tx)...");
  const verifyResult = await jsonFetch(`/properties/${property.id}/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${verifierToken}` },
  });
  console.log("   ✓ verify tx:", verifyResult.txHash);

  const afterVerify = await jsonFetch(`/properties/${property.id}`);
  console.log("   ✓ status is now:", afterVerify.property.status);
  if (afterVerify.property.status !== "Verified") throw new Error("Expected Verified status");

  console.log("\n6) Alice transfers the property to Bob, signed with her own wallet...");
  const transferTx = await aliceContract.transferProperty(property.id, bob.address);
  await transferTx.wait();

  const bobProperties = await jsonFetch(`/properties/owner/${bob.address}`);
  const aliceAfter = await jsonFetch(`/properties/owner/${alice.address}`);
  console.log("   ✓ Bob now owns:", bobProperties.items.length, "property/ies");
  console.log("   ✓ Alice now owns:", aliceAfter.items.length, "property/ies");
  console.log("   ✓ new owner status reset to:", bobProperties.items[0].status);

  if (bobProperties.items.length !== 1 || aliceAfter.items.length !== 0) {
    throw new Error("Ownership transfer did not update as expected");
  }

  console.log("\n✅ ALL INTEGRATION CHECKS PASSED — auth, on-chain register/verify/transfer, and reads all work end-to-end.");
}

main().catch((err) => {
  console.error("\n❌ INTEGRATION CHECK FAILED:", err.message);
  process.exit(1);
});
