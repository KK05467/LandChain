const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (isJson && data.message) || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, isJson ? data : null);
  }

  return data;
}

export const api = {
  // ---- Auth ----
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  walletLogin: (payload) => request("/auth/wallet-login", { method: "POST", body: payload }),
  googleLogin: (payload) => request("/auth/google", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
  updateProfile: (payload, token) => request("/auth/me", { method: "PATCH", body: payload, token }),
  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),

  // ---- Chain / properties ----
  getChainConfig: () => request("/properties/chain-config"),
  listProperties: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/properties${qs ? `?${qs}` : ""}`);
  },
  getProperty: (id) => request(`/properties/${id}`),
  getPropertiesByOwner: (address) => request(`/properties/owner/${address}`),
  verifyProperty: (id, token) => request(`/properties/${id}/verify`, { method: "POST", token }),
  rejectProperty: (id, reason, token) =>
    request(`/properties/${id}/reject`, { method: "POST", body: { reason }, token }),

  // ---- Upload ----
  uploadDocument: (file, token) => {
    const form = new FormData();
    form.append("document", file);
    return request("/upload", { method: "POST", body: form, token, isForm: true });
  },
};

export { ApiError };
