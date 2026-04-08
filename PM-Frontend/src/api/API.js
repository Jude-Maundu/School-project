import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "./apiConfig";
import { getAuthToken, getAuthHeaders } from "../utils/auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (!token) {
      console.warn("[API] No valid auth token for request", {
        url: config.url,
        method: config.method,
      });
      return config;
    }

    config.headers = {
      ...(config.headers || {}),
      ...getAuthHeaders(),
      "Content-Type": config.headers?.["Content-Type"] || "application/json",
    };

    console.debug("[API] attaching auth token to request", {
      url: config.url,
      method: config.method,
      token: `${token.slice(0, 8)}...`,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const token = getAuthToken();
    const message = error.message;
    
    if (error.code === 'ECONNABORTED') {
      console.error("[API] Request timeout exceeded", { url, timeout: error.config?.timeout });
    } else {
      console.warn("[API] response error", { 
        status, 
        url, 
        message,
        token: token ? `${token.slice(0, 8)}...` : "none" 
      });
    }

    if (status === 401) {
      console.error("[API] 401 Unauthorized; clearing auth and redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

const get = (url, config) => api.get(url, config);
const post = (url, data, config) => api.post(url, data, config);
const put = (url, data, config) => api.put(url, data, config);
const patch = (url, data, config) => api.patch(url, data, config);
const remove = (url, config) => api.delete(url, config);

// ============================================
// MEDIA FUNCTIONS
// ============================================
export const getAllMedia = () => get(API_ENDPOINTS.MEDIA.GET_ALL);
export const getMyMedia = () => get(API_ENDPOINTS.MEDIA.GET_MY);
export const getMediaById = (id) => get(API_ENDPOINTS.MEDIA.GET_ONE(id));
export const deleteMedia = (id) => remove(API_ENDPOINTS.MEDIA.DELETE(id));
export const updateMedia = (id, payload) => put(API_ENDPOINTS.MEDIA.UPDATE(id), payload);
export const updateMediaPrice = (id, price) => put(API_ENDPOINTS.MEDIA.UPDATE_PRICE(id), { price });
export const getLikedMedia = async () => {
  try {
    return await get(`${API_BASE_URL}/media/liked`);
  } catch (error) {
    if (error?.response?.status === 400) {
      return { data: [] };
    }
    throw error;
  }
};
export const likeMedia = (id) => post(`${API_BASE_URL}/media/${id}/like`, {});
export const unlikeMedia = (id) => post(`${API_BASE_URL}/media/${id}/unlike`, {});
export const uploadMedia = (formData, config = {}) =>
  api.post(API_ENDPOINTS.MEDIA.CREATE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  });

// ============================================
// ALBUM FUNCTIONS
// ============================================
export const createAlbum = (payload) => post(API_ENDPOINTS.MEDIA.CREATE_ALBUM, payload);
export const getAlbums = () => get(API_ENDPOINTS.MEDIA.GET_ALBUMS);
export const getAlbum = (albumId) => get(API_ENDPOINTS.MEDIA.GET_ALBUM(albumId));
export const updateAlbum = (albumId, payload, config = {}) => put(API_ENDPOINTS.MEDIA.UPDATE_ALBUM(albumId), payload, config);
export const deleteAlbum = (albumId, config = {}) => remove(API_ENDPOINTS.MEDIA.DELETE_ALBUM(albumId), config);

export const addMediaToAlbum = async (albumId, mediaId) => {
  return post(`${API_BASE_URL}/media/album/${albumId}/add`, { mediaId });
};

export const removeMediaFromAlbum = async (albumId, mediaId) => {
  return remove(`${API_BASE_URL}/media/album/${albumId}/remove/${mediaId}`);
};

export const getAlbumMedia = async (albumId) => {
  return get(`${API_BASE_URL}/media/album/${albumId}/media`);
};

export const bulkUpload = (formData, config = {}) =>
  api.post(API_ENDPOINTS.MEDIA.BULK_UPLOAD, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...config,
  });

// ============================================
// ALBUM ACCESS (Private share links)
// ============================================
export const createAlbumAccess = async (albumId, payload) => {
  const candidateUrls = [
    API_ENDPOINTS.MEDIA.ALBUM_ACCESS_CREATE(albumId),
    `${API_BASE_URL}/media/${albumId}/access`,
    `${API_BASE_URL}/album/${albumId}/access`,
    `${API_BASE_URL}/media/album/${albumId}/access`,
  ];

  let lastError;
  for (const url of candidateUrls) {
    try {
      return await post(url, payload);
    } catch (err) {
      lastError = err;
      if (err.response?.status !== 404) {
        throw err;
      }
      console.warn("[API] createAlbumAccess 404, trying next candidate:", url);
    }
  }

  if (lastError) throw lastError;
  throw new Error("No candidate endpoint succeeded for createAlbumAccess");
};

// ============================================
// AUTH FUNCTIONS
// ============================================
export const login = (credentials) => post(API_ENDPOINTS.AUTH.LOGIN, credentials);
export const register = (data) => post(API_ENDPOINTS.AUTH.REGISTER, data);
export const getUsers = () => get(API_ENDPOINTS.AUTH.GET_USERS);
export const getUser = (id) => get(API_ENDPOINTS.AUTH.GET_USER(id));
export const updateUser = (id, payload) => put(API_ENDPOINTS.AUTH.UPDATE_USER(id), payload);
export const deleteUser = (id) => remove(API_ENDPOINTS.AUTH.DELETE_USER(id));

// ============================================
// FOLLOW/UNFOLLOW FUNCTIONS
// ============================================
export const followUser = (userId) => post(`${API_BASE_URL}/auth/users/${userId}/follow`, {});
export const unfollowUser = (userId) => post(`${API_BASE_URL}/auth/users/${userId}/unfollow`, {});
export const getUserFollowers = (userId) => get(`${API_BASE_URL}/auth/users/${userId}/followers`);
export const getUserFollowing = (userId) => get(`${API_BASE_URL}/auth/users/${userId}/following`);
export const isFollowing = (userId) => get(`${API_BASE_URL}/auth/users/${userId}/is-following`);

// ============================================
// PAYMENT FUNCTIONS
// ============================================
export const getPurchaseHistory = (userId) => get(API_ENDPOINTS.PAYMENTS.PURCHASE_HISTORY(userId));
export const getUserFavorites = (userId) => get(API_ENDPOINTS.USERS.FAVORITES.GET(userId));
export const addFavorite = (payload) => post(API_ENDPOINTS.USERS.FAVORITES.ADD, payload);
export const removeFavorite = (userId, mediaId) => remove(API_ENDPOINTS.USERS.FAVORITES.DELETE(userId, mediaId));
export const getEarnings = (photographerId) => get(API_ENDPOINTS.PAYMENTS.EARNINGS(photographerId));
export const getEarningsSummary = (photographerId) => get(API_ENDPOINTS.PAYMENTS.EARNINGS_SUMMARY(photographerId));
export const mpesa = (payload) => post(API_ENDPOINTS.PAYMENTS.MPESA, payload);
export const buy = (payload) => post(API_ENDPOINTS.PAYMENTS.BUY, payload);

// ============================================
// CART FUNCTIONS
// ============================================
export const getCart = (userId) => get(API_ENDPOINTS.CART.GET(userId));
export const addCart = (payload) => post(API_ENDPOINTS.CART.ADD, payload);
export const removeCart = (payload) => post(API_ENDPOINTS.CART.REMOVE, payload);
export const clearCart = (userId) => remove(API_ENDPOINTS.CART.CLEAR(userId));

// ============================================
// RECEIPT & REFUND FUNCTIONS
// ============================================
export const createReceipt = (payload) => post(API_ENDPOINTS.RECEIPTS.CREATE, payload);
export const getReceipt = (id) => get(API_ENDPOINTS.RECEIPTS.GET(id));
export const getReceiptsByUser = (userId) => get(API_ENDPOINTS.RECEIPTS.GET_USER(userId));
export const getAllAdminReceipts = () => get(API_ENDPOINTS.RECEIPTS.GET_ALL_ADMIN);

export const requestRefund = (payload) => post(API_ENDPOINTS.REFUNDS.REQUEST, payload);
export const getRefundsByUser = (userId) => get(API_ENDPOINTS.REFUNDS.GET_USER(userId));
export const approveRefund = (payload) => post(API_ENDPOINTS.REFUNDS.APPROVE, payload);
export const rejectRefund = (payload) => post(API_ENDPOINTS.REFUNDS.REJECT, payload);
export const processRefund = (payload) => post(API_ENDPOINTS.REFUNDS.PROCESS, payload);
export const getAllAdminRefunds = () => get(API_ENDPOINTS.REFUNDS.GET_ALL_ADMIN);

// ============================================
// WALLET FUNCTIONS
// ============================================
export const getWalletBalance = (userId) => get(API_ENDPOINTS.WALLET.GET_BALANCE(userId));
export const getWalletTransactions = (userId) => get(API_ENDPOINTS.WALLET.GET_TRANSACTIONS(userId));
export const addWalletFunds = (payload) => post(API_ENDPOINTS.WALLET.ADD_FUNDS, payload);

// ============================================
// ADMIN SETTINGS
// ============================================
export const getAdminSettings = () => get(API_ENDPOINTS.ADMIN.SETTINGS);
export const updateAdminSettings = (settings) => put(API_ENDPOINTS.ADMIN.UPDATE_SETTINGS, settings);
export const updatePlatformFee = (fee) => put(API_ENDPOINTS.ADMIN.PLATFORM_FEE, { fee });
export const updateMinPayout = (minPayout) => put(API_ENDPOINTS.ADMIN.PAYOUT, { minPayout });
export const sendTestEmail = (payload) => post(API_ENDPOINTS.ADMIN.TEST_EMAIL, payload);
export const clearSettingsCache = () => post(API_ENDPOINTS.ADMIN.CLEAR_CACHE, {});
export const setMaintenanceMode = (enabled) => post(API_ENDPOINTS.ADMIN.MAINTENANCE_MODE, { enabled });
export const getAdminPurchaseAudit = () => get(API_ENDPOINTS.ADMIN.AUDIT_PURCHASES);

// ============================================
// SHARE LINKS
// ============================================
export const generateShareLink = (payload) => post(API_ENDPOINTS.SHARE.GENERATE, payload);
export const accessSharedMedia = (token) => get(API_ENDPOINTS.SHARE.ACCESS(token));
export const downloadViaShareLink = (token) => get(API_ENDPOINTS.SHARE.DOWNLOAD(token));
export const listActiveShares = () => get(API_ENDPOINTS.SHARE.LIST);
export const getShareStats = (token) => get(API_ENDPOINTS.SHARE.STATS(token));
export const revokeShareLink = (token) => remove(API_ENDPOINTS.SHARE.REVOKE(token));

// ============================================
// NOTIFICATIONS
// ============================================
export const getNotifications = (limit = 20, skip = 0) =>
  get(`${API_ENDPOINTS.NOTIFICATIONS.GET}?limit=${limit}&skip=${skip}`);
export const getUnreadNotifications = () => get(API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD);
export const markNotificationAsRead = (id) => patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {});
export const markAllNotificationsAsRead = () => put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});
export const deleteNotification = (id) => remove(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
export const sendShareToUsers = (payload) => post(API_ENDPOINTS.NOTIFICATIONS.SEND_SHARE, payload);
export const searchUsersForShare = (query, limit = 10) =>
  get(`${API_ENDPOINTS.NOTIFICATIONS.SEARCH_USERS}?query=${encodeURIComponent(query)}&limit=${limit}`);
export const adminGetAllShares = (photogId = "", limit = 20, skip = 0) =>
  get(`${API_ENDPOINTS.NOTIFICATIONS.ADMIN_SHARES}?photogId=${photogId}&limit=${limit}&skip=${skip}`);
export const adminGetNotificationStats = () => get(API_ENDPOINTS.NOTIFICATIONS.ADMIN_STATS);

// ============================================
// HEALTH/TEST
// ============================================
export const healthCheck = () => get(API_ENDPOINTS.MEDIA.GET_ALL);

// ============================================
// MESSAGING
// ============================================
export const getConversations = (limit = 20, skip = 0) =>
  get(`${API_ENDPOINTS.MESSAGING.GET_CONVERSATIONS}?limit=${limit}&skip=${skip}`);
export const getConversationWithUser = (otherUserId) =>
  get(API_ENDPOINTS.MESSAGING.GET_CONVERSATION(otherUserId));
export const getMessages = (conversationId, limit = 30, skip = 0) =>
  get(`${API_ENDPOINTS.MESSAGING.GET_MESSAGES(conversationId)}?limit=${limit}&skip=${skip}`);
export const sendMessage = (conversationId, text, replyTo = null) =>
  post(API_ENDPOINTS.MESSAGING.SEND_MESSAGE, { conversationId, text, replyTo });
export const editMessage = (messageId, newText) =>
  put(API_ENDPOINTS.MESSAGING.EDIT_MESSAGE(messageId), { text: newText });
export const deleteMessage = (messageId, hard = false) =>
  remove(`${API_ENDPOINTS.MESSAGING.DELETE_MESSAGE(messageId)}${hard ? "?hard=true" : ""}`);
export const markConversationAsRead = (conversationId) =>
  put(API_ENDPOINTS.MESSAGING.MARK_READ(conversationId), {});
export const archiveConversation = (conversationId) =>
  post(API_ENDPOINTS.MESSAGING.ARCHIVE(conversationId), {});
export const unarchiveConversation = (conversationId) =>
  post(API_ENDPOINTS.MESSAGING.UNARCHIVE(conversationId), {});
export const addReaction = (messageId, emoji) =>
  post(API_ENDPOINTS.MESSAGING.ADD_REACTION(messageId), { emoji });
export const removeReaction = (messageId, emoji) =>
  remove(`${API_ENDPOINTS.MESSAGING.REMOVE_REACTION(messageId)}?emoji=${encodeURIComponent(emoji)}`);

// ============================================
// WITHDRAWALS
// ============================================
export const requestWithdrawal = (payload) => post(API_ENDPOINTS.WITHDRAWALS.REQUEST, payload);
export const getMyWithdrawals = () => get(API_ENDPOINTS.WITHDRAWALS.GET_MY);
export const getAllWithdrawals = () => get(API_ENDPOINTS.WITHDRAWALS.GET_ALL);
export const processWithdrawal = (id, payload) => put(API_ENDPOINTS.WITHDRAWALS.PROCESS(id), payload);

// ============================================
// API CLIENT EXPORT
// ============================================
const apiClient = {
  api,
  get,
  post,
  put,
  remove,
  // Media
  getAllMedia,
  getMyMedia,
  getMediaById,
  deleteMedia,
  updateMedia,
  updateMediaPrice,
  uploadMedia,
  likeMedia,
  unlikeMedia,
  getLikedMedia,
  // Albums
  createAlbum,
  getAlbums,
  getAlbum,
  updateAlbum,
  deleteAlbum,
  addMediaToAlbum,
  removeMediaFromAlbum,
  getAlbumMedia,
  bulkUpload,
  createAlbumAccess,
  // Auth
  login,
  register,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  // Follow
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing,
  isFollowing,
  // Payments
  getPurchaseHistory,
  getUserFavorites,
  addFavorite,
  removeFavorite,
  getEarnings,
  getEarningsSummary,
  mpesa,
  buy,
  // Cart
  getCart,
  addCart,
  removeCart,
  clearCart,
  // Receipts & Refunds
  createReceipt,
  getReceipt,
  getReceiptsByUser,
  getAllAdminReceipts,
  requestRefund,
  getRefundsByUser,
  approveRefund,
  rejectRefund,
  processRefund,
  getAllAdminRefunds,
  // Wallet
  getWalletBalance,
  getWalletTransactions,
  addWalletFunds,
  // Admin
  getAdminSettings,
  updateAdminSettings,
  updatePlatformFee,
  updateMinPayout,
  sendTestEmail,
  clearSettingsCache,
  setMaintenanceMode,
  getAdminPurchaseAudit,
  // Share
  generateShareLink,
  accessSharedMedia,
  downloadViaShareLink,
  listActiveShares,
  getShareStats,
  revokeShareLink,
  // Notifications
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  sendShareToUsers,
  searchUsersForShare,
  adminGetAllShares,
  adminGetNotificationStats,
  // Messaging
  getConversations,
  getConversationWithUser,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markConversationAsRead,
  archiveConversation,
  unarchiveConversation,
  addReaction,
  removeReaction,
  // Withdrawals
  requestWithdrawal,
  getMyWithdrawals,
  getAllWithdrawals,
  processWithdrawal,
  // Health
  healthCheck,
};

export default apiClient;