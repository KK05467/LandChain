import { BrowserProvider, Contract } from "ethers";

export function hasInjectedWallet() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/** Prompts the wallet's connect dialog and returns the selected address. */
export async function requestAccount() {
  if (!hasInjectedWallet()) {
    throw new Error("No wallet found. Install MetaMask (or another injected wallet) to continue.");
  }
  const provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

export function getProvider() {
  if (!hasInjectedWallet()) return null;
  return new BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  if (!provider) throw new Error("No wallet found.");
  return provider.getSigner();
}

/** Builds a contract instance connected to the user's wallet (can send transactions). */
export async function getWritableContract(chainConfig) {
  const signer = await getSigner();
  return new Contract(chainConfig.address, chainConfig.abi, signer);
}

/** Builds a read-only contract instance (no signature required). */
export function getReadOnlyContract(chainConfig) {
  const provider = getProvider();
  if (!provider) throw new Error("No wallet found.");
  return new Contract(chainConfig.address, chainConfig.abi, provider);
}

/**
 * Signs a login challenge message with the connected wallet, for the
 * signature-based wallet-login flow (no password, no private key sent
 * to the server - just proof of control over the address).
 */
export async function signLoginMessage(address) {
  const signer = await getSigner();
  const message = `Sign in to LANDCHAIN\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
  const signature = await signer.signMessage(message);
  return { message, signature };
}

export function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
