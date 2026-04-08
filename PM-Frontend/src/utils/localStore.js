// Local storage helpers and API availability fallbacks.
// This is used when the backend does not provide certain endpoints (404/400).

const STORAGE_PREFIX = "pm_";

function safeParse(value, fallback = null) {
  try {
    const parsed = JSON.parse(value);
    // Treat explicit `null` as missing data (fallback)
    if (parsed === null) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function getKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

export function getLocalArray(key) {
  const raw = localStorage.getItem(getKey(key));
  return Array.isArray(safeParse(raw, [])) ? safeParse(raw, []) : [];
}

export function setLocalArray(key, arr) {
  if (!Array.isArray(arr)) return;
  localStorage.setItem(getKey(key), JSON.stringify(arr));
}

export function dispatchEvent(name) {
  try {
    window.dispatchEvent(new Event(name));
  } catch {
    // ignore
  }
}

// Cart helpers
export function getLocalCart() {
  return getLocalArray("cart");
}

export function setLocalCart(items) {
  setLocalArray("cart", items || []);
  dispatchEvent("pm:cart-updated");
}

export function addToLocalCart(mediaId, metadata = {}) {
  if (!mediaId) return;
  const current = getLocalCart();
  const exists = current.find((item) => item.mediaId === mediaId || item._id === mediaId);
  if (exists) return;
  const entry = {
    _id: mediaId,
    mediaId,
    addedAt: new Date().toISOString(),
    ...metadata,
  };
  setLocalCart([...current, entry]);
}

export function removeFromLocalCart(mediaId) {
  if (!mediaId) return;
  const current = getLocalCart();
  setLocalCart(current.filter((item) => item.mediaId !== mediaId && item._id !== mediaId));
}

export function clearLocalCart() {
  setLocalCart([]);
}

// Favorites helpers
export function getLocalFavorites() {
  return getLocalArray("favorites");
}

export function setLocalFavorites(items) {
  setLocalArray("favorites", items || []);
  dispatchEvent("pm:favorites-updated");
}

export function addToLocalFavorites(mediaId, metadata = {}) {
  if (!mediaId) return;
  const current = getLocalFavorites();
  const exists = current.find((item) => item.mediaId === mediaId || item._id === mediaId);
  if (exists) return;
  const entry = {
    _id: mediaId,
    mediaId,
    addedAt: new Date().toISOString(),
    ...metadata,
  };
  setLocalFavorites([...current, entry]);
}

export function removeFromLocalFavorites(mediaId) {
  if (!mediaId) return;
  const current = getLocalFavorites();
  setLocalFavorites(current.filter((item) => item.mediaId !== mediaId && item._id !== mediaId));
}

// Purchases helpers
export function getLocalPurchases() {
  return getLocalArray("purchases");
}

export function setLocalPurchases(items) {
  setLocalArray("purchases", Array.isArray(items) ? items : []);
}

export function addLocalPurchase(purchase) {
  const current = getLocalPurchases();
  const entry = { _id: purchase.mediaId || purchase._id || `${Date.now()}`, ...purchase };
  setLocalArray("purchases", [...current, entry]);
}

export function clearLocalPurchases() {
  setLocalArray("purchases", []);
}

// Wallet helpers (local fallback)
export function getLocalWalletBalance() {
  const data = safeParse(localStorage.getItem(getKey("wallet")), {});
  return typeof data.balance === "number" ? data.balance : 0;
}

export function setLocalWalletBalance(amount) {
  const balance = Number(amount) || 0;
  localStorage.setItem(getKey("wallet"), JSON.stringify({ balance }));
  dispatchEvent("pm:wallet-updated");
}

export function getLocalWalletTransactions() {
  return getLocalArray("walletTransactions");
}

export function addLocalWalletTransaction(tx) {
  const current = getLocalWalletTransactions();
  setLocalArray("walletTransactions", [...current, tx]);
}

// API availability helpers
const API_UNAVAILABLE_KEY = getKey("api_unavailable");

export function isApiAvailable(feature) {
  const data = safeParse(localStorage.getItem(API_UNAVAILABLE_KEY), {});
  return !(data && data[feature]);
}

export function disableApi(feature) {
  const data = safeParse(localStorage.getItem(API_UNAVAILABLE_KEY), {});
  data[feature] = true;
  localStorage.setItem(API_UNAVAILABLE_KEY, JSON.stringify(data));
}

export function enableApi(feature) {
  const data = safeParse(localStorage.getItem(API_UNAVAILABLE_KEY), {});
  delete data[feature];
  localStorage.setItem(API_UNAVAILABLE_KEY, JSON.stringify(data));
}
