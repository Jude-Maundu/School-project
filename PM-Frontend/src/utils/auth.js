// Utility functions for auth-related helpers.
// Used by components that need to resolve the current user ID or token.

/**
 * Decode a JWT token and return its payload.
 * Returns null if the token is invalid.
 */
export function parseJwt(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1];
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Return the parsed user stored in localStorage (if any).
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Return a best-effort display name for a user object.
 * Supports common fields returned by various APIs.
 */
export function getDisplayName(user) {
  if (!user || typeof user !== "object") return null;

  const name =
    user.name ||
    user.displayName ||
    user.fullName ||
    (user.firstName || user.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : null) ||
    user.username ||
    (typeof user.email === "string" ? user.email.split("@")[0] : null);

  return name || null;
}

/**
 * Return the current auth token from localStorage.
 */
export function isTokenExpired(token) {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload) return true;

  const exp = payload.exp;
  if (!exp) return false; // If there is no expiration in payload, assume not expired.

  const now = Math.floor(Date.now() / 1000);
  return now >= exp;
}

export function getAuthToken() {
  const token = localStorage.getItem("token") || null;
  if (!token) return null;

  if (isTokenExpired(token)) {
    console.warn("[auth] JWT token expired or invalid, clearing localStorage");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    // optional: send user to login; this is handled in API responder
    return null;
  }

  return token;
}

/**
 * Resolve a user ID from localStorage or the JWT token.
 * Tries multiple common fields and falls back to the token 'sub' or 'userId'.
 */
export function getCurrentUserId() {
  const user = getStoredUser();
  if (user) {
    return user.id || user._id || user.userId || user.photographerId || null;
  }

  const token = getAuthToken();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return payload.userId || payload.id || payload.sub || null;
}

/**
 * Build auth headers for axios.
 */
export function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) return {};

  // Some backends may return a token that already includes the scheme (e.g. "Bearer ...").
  const normalized = token.trim();
  if (/^Bearer\s+/i.test(normalized) || /^JWT\s+/i.test(normalized)) {
    return { Authorization: normalized };
  }

  return { Authorization: `Bearer ${normalized}` };
}
