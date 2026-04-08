# Backend Media Download Protection (Protected Media)

This document explains how the backend protects media downloads, why clients may receive `403 Forbidden`, and what behavior was added/changed to support free media and photographer access.

---

## 🔒 Protected Media endpoint

**Endpoint:** `GET /api/media/:mediaId/protected`

### Purpose
Returns:
- `media` metadata
- a short-lived `downloadUrl` to actually download the file
- `canDownload: true` when access is allowed

### Access rules (current behavior)
1. **Authenticated request required** (JWT Bearer token)
2. **User must be one of:**
   - an **admin** (`req.user.role === "admin"`)
   - the **photographer who owns the media** (owner access)
   - a user who has a **completed purchase record** for that media
   - media that is **free** (`price <= 0`)

If none of the above match, the request returns **403 Forbidden** with:
```json
{ "message": "Download not permitted. You need to purchase this media first." }
```

### Why you might see `403` repeatedly
The frontend may try to fetch protected media (and retry with `userId` query param) but still gets `403` because:
- the user doesn’t have a **completed** `Payment` record for that media
- the request is not properly authenticated (missing/invalid JWT)

On the backend, the protection check looks for an existing `Payment` document with:
- `media` = requested media id
- `buyer` = requesting user id
- `status` = `completed`

If you want the request to succeed, ensure one of the allowed access paths is satisfied.

---

## ✅ Changes made (implemented)

### Updated `controllers/MediaController.js`
- Added support for **free media** (`price <= 0`) to bypass the purchase check.
- Added support for the **photographer who owns the media** to bypass the purchase check.

Both `getProtectedMedia()` and `downloadMedia()` were updated to include the same access logic.

### Additional fixes applied (image & access URL correctness)
- Media `fileUrl` values are now normalized to **web-accessible paths** (`/uploads/photos/...`) instead of filesystem paths (`/opt/render/...`).
- The backend now ensures `downloadUrl` and redirect URLs work for images stored under `/uploads`.
- Added support for **GET** on `/api/media/album/:albumId/access` (not just POST) so share-link generation won’t 404.
- Updated the M-Pesa callback URL generation so it uses the **real host** (or `BASE_URL`) instead of a hardcoded domain.

---

## 🧠 How the download URL is generated
When access is allowed, the backend generates a signed URL that looks like:
```
/api/media/:id/download?token=<base64>&user=<userId>
```
This token is valid for **10 minutes**.

---

## ✅ How to test
1. Log in and obtain a valid JWT.
2. Call `GET /api/media/:id/protected` with header:
   - `Authorization: Bearer <token>`
3. If you get `200`, you will receive `downloadUrl` in the response.
4. Call the returned `downloadUrl` (it should redirect to the actual file or the Cloudinary URL).

### 🖼️ Displaying images in the frontend
If you’re trying to display a protected image in an `<img>` tag, you should **not** point `src` directly at `/api/media/:id/protected` unless you are including a valid JWT.

Instead, do this:
1. Call `/api/media/:id/protected` with auth
2. Take the returned `downloadUrl`
3. Set it as the image source:
   ```js
   <img src={downloadUrl} alt="Protected media" />
   ```

This ensures the browser uses a URL the server has already granted access to.

---

## Notes / Troubleshooting
- Ensure `JWT_SECRET` is set so the `authenticate` middleware works.
- If you still see `403`, inspect the `Payment` collection for a record where:
  - `buyer` matches the request user
  - `media` matches the requested media
  - `status` is `completed`

### � Firebase Auth support (optional)
This backend can verify Firebase ID tokens in addition to the local JWT tokens.

To enable Firebase verification, set the environment variable:
- `FIREBASE_SERVICE_ACCOUNT_KEY` — the full JSON string for a Firebase service account key.

If the env var contains valid JSON, the backend will verify incoming Bearer tokens via Firebase and populate `req.user` with:
- `userId` (Firebase uid)
- `email`
- `role` (from `customClaims.role` or `customClaims.admin`)

This lets your frontend use Firebase Auth tokens to authenticate API requests.

### �🔁 M-Pesa callbacks must reach the right backend
The backend generates the callback URL for M-Pesa (STK push) using `BASE_URL` or the current request host.

- If you deploy to a host like `https://pm-backend-f3b6.onrender.com`, set in your environment:
  - `BASE_URL=https://pm-backend-f3b6.onrender.com`

If `BASE_URL` is wrong (or points at another instance), STK push callbacks may land on the wrong server and payments will never become `completed`.

---
## 🔐 Firebase Auth support (what changed)
The backend now accepts **Firebase ID tokens** as an alternative to the local JWT system.

### What changed in the backend
- `middlewares/auth.js` now attempts to verify the Bearer token in two ways:
  1. Local JWT verification using `JWT_SECRET` (existing behavior)
  2. Firebase ID token verification using `firebase-admin` (new)

### What you must configure to use it
Set one environment variable in your deployment:
- `FIREBASE_SERVICE_ACCOUNT_KEY` — the **full JSON** of your Firebase Service Account key (as a string)

When this is set, the backend will validate incoming Bearer tokens with Firebase and populate `req.user` with:
- `userId` (Firebase uid)
- `email`
- `role` (from custom claims if provided)

### How the frontend should send tokens
Use Firebase Auth to sign in users, then send the ID token as a Bearer token:
```js
const token = await firebaseAuth.currentUser.getIdToken(true);
fetch('/api/media/..', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---
## File location
- Backend logic: `controllers/MediaController.js`
- Routes: `routes/MediaRoutes.js` (uses `authenticate` middleware)

---

## 🧩 CORS / Response headers (what the browser sees)

When requests hit the backend, the server responds with normal headers (and Cloudflare may add additional ones). A typical response includes:

- `Access-Control-Allow-Origin`: the allowed origin (e.g., `http://localhost:3000`)
- `Access-Control-Allow-Credentials`: `true` (allows cookies/credentials)
- `Content-Type`: `application/json; charset=utf-8`
- `Vary`: `Origin` (ensures proper caching of CORS responses)

If you ever see CORS-related failures, confirm the frontend origin is included in the server's `cors(...)` config in `server.js`:
```js
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://pm-frontend-3buw.onrender.com",
      // ...other allowed origins
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
```
