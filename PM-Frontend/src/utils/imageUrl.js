import axios from "axios";
import { API_BASE_URL } from "../api/apiConfig";
import { getAuthHeaders, getCurrentUserId } from "./auth";

// The backend exposes media under /uploads (or similar). For local dev / different hosts,
// we build a base URL that strips the /api suffix from the API base (if present).
const PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveUrl(rawUrl) {
  if (!rawUrl) return null;

  const trimmed = String(rawUrl).trim();
  if (!trimmed) return null;

  // If it's already absolute (HTTP / data URI / protocol-relative)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("//")
  ) {
    // Some backends return absolute URLs that still contain internal filesystem
    // paths (e.g. https://.../opt/render/.../uploads/...). Rewrite those to a
    // proper public URL so the browser can actually load it.
    try {
      const parsed = new URL(trimmed, PUBLIC_BASE_URL);
      const uploadsMatch = parsed.pathname.match(/(\/uploads\/[^?#]+)/);
      if (uploadsMatch && uploadsMatch[1]) {
        return `${PUBLIC_BASE_URL}${uploadsMatch[1]}`;
      }
    } catch {
      // ignore invalid URL parse and fall back to returning as-is
    }
    return trimmed;
  }

  // Some backends return local filesystem paths (e.g. /opt/render/... or C:\...)
  // These are not directly fetchable from the browser; treat them as missing.
  if (trimmed.includes("/opt/") || trimmed.includes("\\\\") || /^[A-Za-z]:\\/.test(trimmed)) {
    return null;
  }

  // Handle server file paths like: /opt/render/project/src/uploads/photos/xxx.png
  // Extract the public /uploads/... portion.
  const uploadsMatch = trimmed.match(/(\/uploads\/[\w\-\/.]+)/);
  if (uploadsMatch && uploadsMatch[1]) {
    return `${PUBLIC_BASE_URL}${uploadsMatch[1]}`;
  }

  // Normalize /uploads/..., /api/uploads/... (paths starting with /).
  if (trimmed.startsWith("/")) {
    return `${PUBLIC_BASE_URL}${trimmed}`;
  }

  // If it's a plain filename or missing any path separators, it's likely not a full URL.
  // Returning a derived URL here often causes broken image requests, so treat it as missing.
  if (!trimmed.includes("/")) {
    return null;
  }

  // Otherwise, assume it's a relative path and resolve against the public base.
  return `${PUBLIC_BASE_URL}/${trimmed}`;
}

const protectedUrlCache = new Map();
const protectedUrlPromiseCache = new Map();
const protectedUrlCacheExpirations = new Map();
let warnedNoAuth = false;

function setProtectedUrlCache(key, value, ttlMs = 0) {
  protectedUrlCache.set(key, value);
  const prevTimeout = protectedUrlCacheExpirations.get(key);
  if (prevTimeout) {
    clearTimeout(prevTimeout);
  }

  if (ttlMs > 0) {
    const timeout = setTimeout(() => {
      protectedUrlCache.delete(key);
      protectedUrlCacheExpirations.delete(key);
    }, ttlMs);
    protectedUrlCacheExpirations.set(key, timeout);
  }
}

export async function fetchProtectedUrl(mediaId, opts = {}) {
  if (!mediaId) return null;

  if (typeof mediaId !== "string" && typeof mediaId !== "number") {
    // Avoid accidental object/array IDs causing invalid /protected requests.
    if (process.env.NODE_ENV === "development") {
      console.warn("[imageUrl] fetchProtectedUrl called with invalid mediaId", mediaId);
    }
    return null;
  }

  // Some backends may need a user ID to generate a signed URL, but others
  // just rely on the JWT token. Don't fail early if the ID isn't available.
  const userId = opts.userId || getCurrentUserId();
  const mediaIdStr = String(mediaId);
  const cacheKey = userId ? `${mediaIdStr}|${userId}` : `${mediaIdStr}|anon`;

  if (protectedUrlCache.has(cacheKey)) {
    return protectedUrlCache.get(cacheKey);
  }

  // Deduplicate concurrent requests for the same mediaId (and user).
  if (protectedUrlPromiseCache.has(cacheKey)) {
    return protectedUrlPromiseCache.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const headers = getAuthHeaders();

      // Avoid sending custom headers (e.g. X-User-Id) since they require CORS preflight
      // approval from the backend (and the API currently does not allow it).
      // The backend should rely on the Authorization token to determine the user.

      if (!headers.Authorization && !warnedNoAuth) {
        console.warn(
          "[imageUrl] No auth token found when requesting protected media. Images may not load."
        );
        warnedNoAuth = true;
      }

      // Many backends determine the authorized user via the Authorization header.
      // Try fetching without any extra query params first to avoid CORS issues.
      const baseUrl = `${API_BASE_URL}/media/${mediaIdStr}/protected`;

      try {
        const res = await axios.request({
          method: "get",
          url: baseUrl,
          headers,
          timeout: 20000,
        });

        const rawUrl = res.data?.signedUrl || res.data?.downloadUrl || null;
        const protectedUrl = resolveUrl(rawUrl) || rawUrl;
        if (protectedUrl) {
          setProtectedUrlCache(cacheKey, protectedUrl);
        }
        return protectedUrl;
      } catch (err) {
        // If the backend rejects the request due to missing user context, retry
        // with userId as a query param (some implementations require this).
        if (err?.response?.status === 403 && userId) {
          if (process.env.NODE_ENV === "development") {
            console.debug(
              "[imageUrl] protected media request returned 403, retrying with userId query param",
              { mediaId: mediaIdStr, userId, status: err.response.status, data: err.response.data }
            );
          }

          try {
            const res2 = await axios.request({
              method: "get",
              url: `${baseUrl}?userId=${encodeURIComponent(userId)}`,
              headers,
              timeout: 20000,
            });

            const rawUrl = res2.data?.signedUrl || res2.data?.downloadUrl || null;
            const protectedUrl = resolveUrl(rawUrl) || rawUrl;
            if (protectedUrl) {
              setProtectedUrlCache(cacheKey, protectedUrl);
            }
            return protectedUrl;
          } catch (err2) {
            if (process.env.NODE_ENV === "development") {
              console.debug(
                "[imageUrl] protected media retry with userId failed",
                { mediaId: mediaIdStr, userId, status: err2?.response?.status, data: err2?.response?.data }
              );
            }
            // fall through to null below
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.debug(
            "[imageUrl] protected media request failed",
            { mediaId: mediaIdStr, status: err?.response?.status, data: err?.response?.data }
          );
        }

        // Avoid caching permanent failures (e.g. missing access) so that the app
        // can reattempt after the user resolves access (e.g. completes a purchase).
        // Cache null briefly to avoid spamming the backend during rapid re-renders.
        setProtectedUrlCache(cacheKey, null, 10000);
        return null;
      }
    } catch {
      // If something unexpected happens, avoid permanently caching the failure.
      setProtectedUrlCache(cacheKey, null, 10000);
      return null;
    } finally {
      protectedUrlPromiseCache.delete(cacheKey);
    }
  })();

  protectedUrlPromiseCache.set(cacheKey, promise);
  return promise;
}

export function getImageUrl(item, fallbackUrl = null) {
  if (!item) return fallbackUrl;

  // Support string inputs directly (URL, path, or data URI) for convenience.
  if (typeof item === "string") {
    const resolved = resolveUrl(item);
    return resolved || fallbackUrl;
  }

  // Prefer dedicated fields from object payloads.
  const candidates = [item.imageUrl, item.fileUrl, item.url, item.photo, item.previewUrl];
  for (const raw of candidates) {
    const resolved = resolveUrl(raw);
    if (resolved) return resolved;
    // If raw is already a working pattern (e.g. data URI), use as-is.
    if (typeof raw === "string" && raw.trim().startsWith("data:")) {
      return raw;
    }
  }

  // If the payload is a file path or filename, attempt to use it.
  const fileCandidate = item.fileName || item.path || item.src;
  if (fileCandidate) {
    const resolvedFile = resolveUrl(fileCandidate);
    if (resolvedFile) return resolvedFile;
  }

  // If object has a nested media key (common in aggregations), attempt it.
  if (item.media) {
    const nested = getImageUrl(item.media, fallbackUrl);
    if (nested) return nested;
  }

  // Bulk-cart objects sometimes store mediaId and/or fileUrl as top-level 'media' / 'fileURL'.
  if (item.fileUrl || item.url || item.imageUrl || item.media?.fileUrl) {
    const candidate = item.fileUrl || item.url || item.imageUrl || item.media?.fileUrl;
    const resolved = resolveUrl(candidate);
    if (resolved) return resolved;
  }

  return fallbackUrl;
}
