const env = require("./env");

// kubo-rpc-client ships as an ESM-only package, so it's loaded lazily via
// dynamic import (works from CommonJS) the first time it's actually needed,
// rather than at module load time.
let clientPromise = null;
async function getClient() {
  if (!clientPromise) {
    clientPromise = import("kubo-rpc-client").then(({ create }) =>
      create({ url: env.IPFS_API_URL })
    );
  }
  return clientPromise;
}

/**
 * Pins a buffer to IPFS and returns its CID.
 * Requires a reachable IPFS node (local `ipfs daemon`, or a pinning
 * service's Kubo-compatible RPC endpoint) at env.IPFS_API_URL.
 */
async function pinBuffer(buffer, filename) {
  const client = await getClient();
  const { cid } = await client.add(
    { path: filename, content: buffer },
    { pin: true }
  );
  return cid.toString();
}

function gatewayUrl(cid) {
  return `${env.IPFS_GATEWAY_URL}/${cid}`;
}

module.exports = { pinBuffer, gatewayUrl };
