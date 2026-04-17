/**
 * API Configuration File
 * Central location for all API endpoints
 */

// FORCE USE ONLINE SERVER - Remove localhost fallback
const ONLINE_API_BASE_URL = "https://pm-backend-f3b6.onrender.com/api";

// Override to always use online server
const API_BASE_URL = ONLINE_API_BASE_URL;

console.log("[API] Using API_BASE_URL:", API_BASE_URL);

// Optional: Check if server is reachable (for debugging)
if (typeof window !== "undefined") {
  fetch(`${API_BASE_URL}/health`)
    .then(res => res.json())
    .then(data => console.log("[API] Backend health check:", data))
    .catch(err => console.warn("[API] Backend not reachable:", err.message));
}

const API_ENDPOINTS = {
  // ==================== AUTH ====================
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    GET_USERS: `${API_BASE_URL}/auth/users`,
    GET_USER: (id) => `${API_BASE_URL}/auth/users/${id}`,
    UPDATE_USER: (id) => `${API_BASE_URL}/auth/users/${id}`,
    DELETE_USER: (id) => `${API_BASE_URL}/auth/users/${id}`,
    UPDATE_PHONE: (id) => `${API_BASE_URL}/auth/photographers/${id}/phone`,
  },

  USERS: {
    FAVORITES: {
      GET: (userId) => `${API_BASE_URL}/users/favorites/${userId}`,
      DELETE: (userId, mediaId) => `${API_BASE_URL}/users/favorites/${userId}/${mediaId}`,
      ADD: `${API_BASE_URL}/users/favorites/add`,
    },
  },

  // ==================== MEDIA ====================
  MEDIA: {
    GET_ALL: `${API_BASE_URL}/media`,
    GET_MY: `${API_BASE_URL}/media/mine`,
    GET_ONE: (id) => `${API_BASE_URL}/media/${id}`,
    GET_PROTECTED: (id) => `${API_BASE_URL}/media/${id}/protected`,
    CREATE: `${API_BASE_URL}/media`,
    UPDATE: (id) => `${API_BASE_URL}/media/${id}`,
    UPDATE_PRICE: (id) => `${API_BASE_URL}/media/${id}/price`,
    DELETE: (id) => `${API_BASE_URL}/media/${id}`,
    ALBUM_ACCESS_CREATE: (albumId) => `${API_BASE_URL}/media/album/${albumId}/access`,
    ALBUM_ACCESS_VIEW: (albumId, token) => `${API_BASE_URL}/media/album/${albumId}/access/${token}`,
    ALBUM_ACCESS_HISTORY: (albumId) => `${API_BASE_URL}/media/album/${albumId}/access`,
    CREATE_ALBUM: `${API_BASE_URL}/media/album`,
    GET_ALBUMS: `${API_BASE_URL}/media/albums`,
    GET_ALBUM: (albumId) => `${API_BASE_URL}/media/album/${albumId}`,
    UPDATE_ALBUM: (albumId) => `${API_BASE_URL}/media/album/${albumId}`,
    DELETE_ALBUM: (albumId) => `${API_BASE_URL}/media/album/${albumId}`,
    BULK_UPLOAD: `${API_BASE_URL}/media/album/bulk-upload`,
    BULK_UPLOAD_FALLBACK: `${API_BASE_URL}/media/bulk-upload`,
  },

  // ==================== PAYMENTS ====================
  PAYMENTS: {
    MPESA: `${API_BASE_URL}/payments/mpesa`,
    CALLBACK: `${API_BASE_URL}/payments/callback`,
    BUY: `${API_BASE_URL}/payments/buy`,
    PURCHASE_HISTORY: (userId) => `${API_BASE_URL}/payments/purchase-history/${userId}`,
    EARNINGS: (photographerId) => `${API_BASE_URL}/payments/earnings/${photographerId}`,
    EARNINGS_SUMMARY: (photographerId) => `${API_BASE_URL}/payments/earnings-summary/${photographerId}`,
    TRANSACTIONS: (userId) => `${API_BASE_URL}/payments/transactions/${userId}`,
    ADMIN_DASHBOARD: `${API_BASE_URL}/payments/admin/dashboard`,
  },

  // ==================== CART ====================
  CART: {
    GET: (userId) => `${API_BASE_URL}/payments/cart/${userId}`,
    ADD: `${API_BASE_URL}/payments/cart/add`,
    REMOVE: `${API_BASE_URL}/payments/cart/remove`,
    CLEAR: (userId) => `${API_BASE_URL}/payments/cart/${userId}`,
  },

  // ==================== RECEIPTS ====================
  RECEIPTS: {
    CREATE: `${API_BASE_URL}/payments/receipt/create`,
    GET: (receiptId) => `${API_BASE_URL}/payments/receipt/${receiptId}`,
    GET_USER: (userId) => `${API_BASE_URL}/payments/receipts/${userId}`,
    GET_ALL_ADMIN: `${API_BASE_URL}/payments/admin/receipts`,
  },

  // ==================== REFUNDS ====================
  REFUNDS: {
    REQUEST: `${API_BASE_URL}/payments/refund/request`,
    GET_USER: (userId) => `${API_BASE_URL}/payments/refunds/${userId}`,
    APPROVE: `${API_BASE_URL}/payments/refund/approve`,
    REJECT: `${API_BASE_URL}/payments/refund/reject`,
    PROCESS: `${API_BASE_URL}/payments/refund/process`,
    GET_ALL_ADMIN: `${API_BASE_URL}/payments/admin/refunds`,
  },

  // ==================== WALLET ====================
  WALLET: {
    GET_BALANCE: (userId) => `${API_BASE_URL}/payments/wallet/${userId}`,
    GET_TRANSACTIONS: (userId) => `${API_BASE_URL}/payments/transactions/${userId}`,
    ADD_FUNDS: `${API_BASE_URL}/payments/wallet/add`,
  },

  // ==================== ADMIN ====================
  ADMIN: {
    SETTINGS: `${API_BASE_URL}/admin/settings`,
    UPDATE_SETTINGS: `${API_BASE_URL}/admin/settings`,
    PLATFORM_FEE: `${API_BASE_URL}/admin/settings/platform-fee`,
    PAYOUT: `${API_BASE_URL}/admin/settings/payout`,
    TEST_EMAIL: `${API_BASE_URL}/admin/settings/test-email`,
    CLEAR_CACHE: `${API_BASE_URL}/admin/clear-cache`,
    MAINTENANCE_MODE: `${API_BASE_URL}/admin/maintenance-mode`,
    AUDIT_PURCHASES: `${API_BASE_URL}/admin/audit/purchases`,
  },

  // ==================== SHARE ====================
  SHARE: {
    GENERATE: `${API_BASE_URL}/share/generate`,
    ACCESS: (token) => `${API_BASE_URL}/share/${token}`,
    DOWNLOAD: (token) => `${API_BASE_URL}/share/${token}/download`,
    LIST: `${API_BASE_URL}/share/list`,
    STATS: (token) => `${API_BASE_URL}/share/${token}/stats`,
    REVOKE: (token) => `${API_BASE_URL}/share/${token}/revoke`,
  },

  // ==================== NOTIFICATIONS ====================
  NOTIFICATIONS: {
    GET: `${API_BASE_URL}/notifications`,
    GET_UNREAD: `${API_BASE_URL}/notifications?unreadOnly=true`,
    MARK_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/read/all`,
    DELETE: (id) => `${API_BASE_URL}/notifications/${id}`,
    SEND_SHARE: `${API_BASE_URL}/notifications/share/send`,
    SEARCH_USERS: `${API_BASE_URL}/notifications/share/search-recipients`,
    ADMIN_SHARES: `${API_BASE_URL}/notifications/admin/shares`,
    ADMIN_STATS: `${API_BASE_URL}/notifications/admin/stats`,
  },

  // ==================== MESSAGING ====================
  MESSAGING: {
    GET_CONVERSATIONS: `${API_BASE_URL}/messages/conversations`,
    GET_CONVERSATION: (otherUserId) => `${API_BASE_URL}/messages/conversations/${otherUserId}`,
    GET_MESSAGES: (conversationId) => `${API_BASE_URL}/messages/${conversationId}`,
    SEND_MESSAGE: `${API_BASE_URL}/messages/send`,
    EDIT_MESSAGE: (messageId) => `${API_BASE_URL}/messages/${messageId}`,
    DELETE_MESSAGE: (messageId) => `${API_BASE_URL}/messages/${messageId}`,
    MARK_READ: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}/read`,
    ARCHIVE: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}/archive`,
    UNARCHIVE: (conversationId) => `${API_BASE_URL}/messages/conversations/${conversationId}/unarchive`,
    ADD_REACTION: (messageId) => `${API_BASE_URL}/messages/${messageId}/reaction`,
    REMOVE_REACTION: (messageId) => `${API_BASE_URL}/messages/${messageId}/reaction`,
  },

  // ==================== WITHDRAWALS ====================
  WITHDRAWALS: {
    REQUEST: `${API_BASE_URL}/withdrawals/request`,
    GET_MY: `${API_BASE_URL}/withdrawals/my`,
    GET_ALL: `${API_BASE_URL}/withdrawals/all`,
    PROCESS: (id) => `${API_BASE_URL}/withdrawals/${id}/process`,
  },
};

export { API_BASE_URL, API_ENDPOINTS };