import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "landchain_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        // Token expired or invalid - clear it silently.
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const persistSession = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (payload) => persistSession(await api.signup(payload)),
    [persistSession]
  );

  const login = useCallback(
    async (payload) => persistSession(await api.login(payload)),
    [persistSession]
  );

  const walletLogin = useCallback(
    async (payload) => persistSession(await api.walletLogin(payload)),
    [persistSession]
  );

  const googleLogin = useCallback(
    async (payload) => persistSession(await api.googleLogin(payload)),
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const data = await api.me(token);
    setUser(data.user);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ token, user, loading, signup, login, walletLogin, googleLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
