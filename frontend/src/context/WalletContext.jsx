import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api } from "../lib/api.js";
import {
  requestAccount,
  getWritableContract,
  getReadOnlyContract,
  hasInjectedWallet,
} from "../lib/wallet.js";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainConfig, setChainConfig] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Load the contract address/ABI once at startup so "Connect Wallet"
  // is instant rather than round-tripping to the API on click.
  useEffect(() => {
    api
      .getChainConfig()
      .then(setChainConfig)
      .catch((err) => setError(err.message));
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const account = await requestAccount();
      setAddress(account);
      return account;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  const getContract = useCallback(async () => {
    if (!chainConfig) throw new Error("Chain config not loaded yet.");
    return getWritableContract(chainConfig);
  }, [chainConfig]);

  const getReadContract = useCallback(() => {
    if (!chainConfig) throw new Error("Chain config not loaded yet.");
    return getReadOnlyContract(chainConfig);
  }, [chainConfig]);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainConfig,
        connecting,
        error,
        connect,
        disconnect,
        getContract,
        getReadContract,
        hasWallet: hasInjectedWallet(),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
