# LANDCHAIN Backend

Two things live in this folder, deliberately kept separate:

1. **`contracts/`** — the Solidity smart contract (`LandRegistry.sol`), the
   actual source of truth for land records. Deployed with Hardhat.
2. **`server/`** — a Node/Express API that sits in front of the chain:
   handles user accounts, IPFS document pinning, read access to registry
   data, and the government/verifier-role actions.

## Why this split

Registration and ownership transfer are **end-user wallet actions** —
they're meant to be signed by the property owner's own key, so the frontend
calls the contract directly (via MetaMask/wagmi) using the ABI/address the
API exposes at `GET /api/properties/chain-config`. The backend never signs
those on a user's behalf; that would make it, not the user, the actual owner
on-chain.

What the backend *does* sign with its own key: verifier-role actions
(`verifyProperty` / `rejectProperty`), because that's a legitimate
backend-held role — e.g. a registrar's office — separate from any single
citizen's wallet.

```
contracts/LandRegistry.sol   ← on-chain source of truth
        │
        │ deploy.js writes address + ABI
        ▼
server/config/contract.json  ← consumed by the API
        │
        ▼
server/  (Express)
 ├─ auth        → signup/login (email+password) or wallet-signature login
 ├─ properties  → public reads + verifier-only verify/reject
 └─ upload      → pins deed/survey files to IPFS, returns a CID
```

## Smart contract — `LandRegistry.sol`

- `registerProperty(propertyCode, location, areaSqFt, documentHash)` — caller
  becomes the owner of record.
- `verifyProperty(id)` / `rejectProperty(id, reason)` — verifier-role only.
- `transferProperty(id, newOwner)` — current owner only; resets status to
  `Pending` so the new owner's title gets re-attested.
- `updateDocumentHash(id, newHash)` — owner can resubmit after a rejection.
- `setVerifier(address, bool)` — contract owner (registry authority) manages
  who can attest records.
- Uses OpenZeppelin `Ownable` + `ReentrancyGuard`. Full test suite in
  `test/LandRegistry.test.js` covering registration, access control,
  verification, rejection/resubmission, and transfer.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in JWT_SECRET, SERVER_SIGNER_PRIVATE_KEY, etc.
```

### Run a local chain + deploy

```bash
npm run node              # terminal 1: local Hardhat chain on :8545
npm run deploy:local       # terminal 2: deploys LandRegistry, writes
                            #   server/config/contract.json
```

`.env.example`'s `SERVER_SIGNER_PRIVATE_KEY` already defaults to Hardhat's
well-known local account #0, which the contract constructor auto-approves
as a verifier — no extra setup needed for local dev.

### Promoting a verifier (your own registrar accounts)

Sign up normally through `/api/auth/signup`, then:

```bash
npm run promote-verifier -- someone@example.com
```

Restart the API server afterward — the JSON user store is loaded into
memory once at boot, so it won't pick up the change until the process
restarts.

### Run the tests

```bash
npm test
```

### Run the API

```bash
npm run server        # or: npm run server:dev  (nodemon)
```

Health check: `GET http://localhost:4000/api/health`

### Full end-to-end integration check

`integration-check.js` at the project root exercises the entire stack for
real — no mocks: signup, promoting a verifier, registering a property
on-chain with a wallet-signed transaction, verifying it through the API,
and transferring ownership — then asserts the reads reflect every change.

```bash
npm run node &
npm run deploy:local
npm run server &
node integration-check.js
```

### Deploying to a testnet (Sepolia)

Fill in `SEPOLIA_RPC_URL` and `DEPLOYER_PRIVATE_KEY` in `.env`, then:

```bash
npm run deploy:sepolia
```

## API reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account (name, email, password, optional walletAddress) |
| POST | `/api/auth/login` | — | Email + password login |
| POST | `/api/auth/wallet-login` | — | Login by proving control of a wallet (signed message) |
| GET  | `/api/auth/me` | Bearer | Current user |
| GET  | `/api/properties/chain-config` | — | Contract address + ABI for the frontend to connect a wallet directly |
| GET  | `/api/properties` | — | Paginated list of registry records |
| GET  | `/api/properties/:id` | — | Single record |
| GET  | `/api/properties/owner/:address` | — | Records owned by an address |
| POST | `/api/properties/:id/verify` | Bearer, role `verifier`/`admin` | Attest a record on-chain |
| POST | `/api/properties/:id/reject` | Bearer, role `verifier`/`admin` | Reject with a reason |
| POST | `/api/upload` | Bearer | Multipart upload (`document` field), pins to IPFS, returns CID |

Registration and transfer are **not** backend routes — the frontend submits
those transactions straight to the contract using the connected wallet and
the CID returned by `/api/upload`.

## Notes on the demo IPFS/user store

- `server/config/ipfs.js` expects a Kubo-compatible RPC endpoint
  (`ipfs daemon` locally, or a pinning provider) at `IPFS_API_URL`. Swap in
  Pinata/web3.storage if you'd rather not run a node.
- User accounts are stored in `server/data/db.json` via `lowdb` — fine for a
  prototype, swap for Postgres/Mongo before production traffic.

## If `hardhat compile` can't reach the internet

Hardhat downloads its solc compiler binary from `binaries.soliditylang.org`
on first compile. In network-restricted environments (CI runners, sandboxes)
where that host is blocked, `manual-compile.js` at the project root produces
the same artifact using the npm-distributed `solc` package instead:

```bash
npm install --no-save solc@0.8.24
node manual-compile.js          # writes artifacts/contracts/LandRegistry.sol/LandRegistry.json
npx hardhat run scripts/deploy.js --network localhost --no-compile
npx hardhat test --no-compile
```

This is exactly how the contract was compiled, tested, and deployed while
building this project.
