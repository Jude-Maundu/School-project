# Frontend Codebase Inventory - PM-Frontend/src

**Date:** March 25, 2026  
**Status:** Comprehensive exploration of all components, routes, and capabilities

---

## 1. PAGES & ROUTES SUMMARY

### Public Routes
- `/` → **HomePage** - Landing page
- `/login` → **Login** - Authentication
- `/register` → **Register** - User registration
- `/auth/google/callback` → **AuthCallback** - Google OAuth redirect
- `/explore` → **Explore** - Public media gallery

### Admin Routes
- `/admin/dashboard` → **AdminDash** - Dashboard with stats, revenue, users, media
- `/admin/media` → **AdminMedia** - Media management & moderation
- `/admin/users` → **AdminUser** - User/photographer management
- `/admin/receipts` → **AdminReceipts** - Payment receipts list
- `/admin/refunds` → **AdminRefunds** - Refund management
- `/admin/settings` → **AdminSettings** - Platform settings (fees, payout, maintenance)
- `/admin/audit` → **AdminAudit** - Purchase audit logs
- `/admin/analytics` → **AdminDash** (alias)

### Photographer Routes
- `/photographer/dashboard` → **PhotographerDash** - Dashboard (earnings, sales, stats)
- `/photographer/upload` → **UploadMedia** - Media upload with thumbnail preview
- `/photographer/media` → **MyMedia** - Media management gallery with CRUD
- `/photographer/profile` → **Profile** - Profile editor (bio, website, social, images)
- `/photographer/earnings` → **Earnings** - Earnings breakdown & history
- `/photographer/sales` → **SalesHistory** - Sales transactions list
- `/photographer/withdrawals` → **Withdrawals** - Payout history & withdrawal requests

### Buyer Routes
- `/buyer/dashboard` → **BuyerDash** - Dashboard (purchases, downloads, recommendations)
- `/buyer/explore` → **BuyerExplore** - Media marketplace search & filter
- `/buyer/cart` → **BuyerCart** - Shopping cart with M-Pesa payment
- `/buyer/transaction` → **BuyerTransactions** - Purchase history
- `/buyer/downloads` → **BuyerDownloads** - Downloaded media library
- `/buyer/favorites` → **BuyerFavourite** - Favorite/liked media collection
- `/buyer/wallet` → **BuyerWallet** - Wallet balance & transactions
- `/buyer/profile` → **BuyerProfile** - Profile management
- `/album/:albumId/access/:token` → **BuyerAlbumAccess** - Private share link access

---

## 2. COMPONENTS INVENTORY

### **A. Admin Components** (`Components/Pages/Admin/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| **AdminDash.jsx** | Dashboard with stats cards, revenue, users, pending refunds | ✅ Implemented |
| **AdminMedia.jsx** | Media moderation, upload/delete controls | ✅ Implemented |
| **AdminUser.jsx** | User/photographer management, verification | ✅ Implemented |
| **AdminReceipts.jsx** | Payment receipts list with filters | ✅ Implemented |
| **AdminRefunds.jsx** | Refund requests, approve/reject/process | ✅ Implemented |
| **AdminSettings.jsx** | Platform fee, payout min, maintenance mode, test email | ✅ Implemented |
| **AdminAudit.jsx** | Purchase audit logs & analytics | ✅ Implemented |
| **AdminLayout.jsx** | Layout wrapper with sidebar nav, responsive mobile menu | ✅ Implemented |
| **AdminNavbar.jsx** | Top navbar with notifications, profile menu | ✅ Implemented |
| **AdminSidebar.jsx** | Left sidebar navigation | ✅ Implemented |

**Admin Dashboard Stats Tracked:**
- Total Revenue (KES)
- Photographer Earnings (70% share)
- Platform Fees (30% share)
- Total Media Count
- Total Active Users
- Total Transactions
- Pending Refunds Count

---

### **B. Photographer Components** (`Components/Pages/Photographer/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| **PhotographerDash.jsx** | Dashboard: media count, sales, earnings, views, likes, recent sales | ✅ Implemented |
| **UploadMedia.jsx** | Upload form with file validation, progress tracking, auth check | ✅ Implemented |
| **MyMedia.jsx** | Gallery with edit/delete, album management, share links, QR codes | ✅ Implemented |
| **Profile.jsx** | Profile editor: bio, location, website, social links, cover/profile pics | ✅ Implemented |
| **Earnings.jsx** | Earnings breakdown, time range filter | ❓ Needs verification |
| **SalesHistory.jsx** | Transaction list with filters | ✅ Implemented |
| **Withdrawals.jsx** | Payout history, withdrawal requests | ❓ Needs verification |
| **PhotographerLayout.jsx** | Layout wrapper with sidebar, responsive nav | ✅ Implemented |

**Key Features:**
- ✅ Media upload with validation (max 10MB, image/video only)
- ✅ Share links with expiration & download limits
- ✅ QR code generation for share links
- ✅ Album management (create, update, delete)
- ✅ Media price editing
- ✅ Dashboard statistics

**Missing/Incomplete:**
- ❌ Messaging/Chat UI (backend exists but no frontend)
- ❌ Bulk upload (endpoints in API but no UI)
- ❌ Analytics/performance report
- ❌ Client requests/inquiries feature

---

### **C. Buyer Components** (`Components/Pages/Buyer/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| **BuyerDash.jsx** | Dashboard: recent purchases, downloads, recommendations | ✅ Implemented |
| **BuyerExplore.jsx** | Media search/filter, masonry grid, photographer profiles | ✅ Implemented |
| **BuyerCart.jsx** | Shopping cart with M-Pesa payment integration | ✅ Implemented |
| **BuyerTransactions.jsx** | Purchase history with receipts | ✅ Implemented |
| **BuyerDownloads.jsx** | Downloads library with search/filter | ✅ Implemented |
| **BuyerFavourite.jsx** | Favorite media collection | ✅ Implemented |
| **BuyerWallet.jsx** | Wallet balance, top-up with M-Pesa, transaction history | ✅ Implemented |
| **BuyerProfile.jsx** | Profile editor | ✅ Implemented |
| **BuyerAlbumAccess.jsx** | View shared album (via private share link) | ✅ Implemented |
| **BuyerLayout.jsx** | Layout wrapper with navbar, responsive nav | ✅ Implemented |

**Key Features:**
- ✅ Shopping cart with local fallback storage
- ✅ M-Pesa STK Push payment
- ✅ Auto-download after successful payment
- ✅ Favorites/likes functionality
- ✅ Wallet with top-up capability
- ✅ Share link access control

---

### **D. Global Components** (`Components/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| **AuthCallback.jsx** | Google OAuth callback handler | ✅ Implemented |
| **GoogleAuth.jsx** | Google authentication button | ✅ Implemented |
| **NotificationPanel.jsx** | Fixed notification bell with panel, mark as read | ✅ Implemented |
| **NotificationDropdown.jsx** | Compact notification dropdown | ✅ Implemented |
| **MasonryGrid.jsx** | Responsive masonry layout for media | ✅ Implemented |

### **E. Public Pages** (`Components/Pages/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| **HomePage.jsx** | Landing page | ✅ Implemented |
| **Login.jsx** | Login form with role selection | ✅ Implemented |
| **Register.jsx** | Registration form | ✅ Implemented |
| **Wallet.jsx** | Wallet page (top-level route) | ✅ Implemented |
| **Explore.jsx** | Public explore page | ✅ Implemented |

---

## 3. API INTEGRATION SUMMARY

### **File Structure**
```
src/api/
├── API.js          - Axios instance, all API calls
├── apiConfig.js    - Endpoints configuration
```

### **API Endpoints Implemented**

#### Media (`MEDIA`)
- `GET /media` - Get all public media
- `GET /media/mine` - Get photographer's media
- `GET /media/:id` - Get media details
- `POST /media` - Upload media (multipart)
- `PUT /media/:id` - Update media
- `PUT /media/:id/price` - Update price
- `DELETE /media/:id` - Delete media
- `GET /media/:id/protected` - Protected download
- `POST /media/:id/like` - Like media
- `POST /media/:id/unlike` - Unlike media

#### Albums (`MEDIA.ALBUM`)
- `POST /media/album` - Create album
- `GET /media/albums` - List albums
- `GET /media/album/:id` - Get album
- `PUT /media/album/:id` - Update album
- `DELETE /media/album/:id` - Delete album
- `POST /media/album/:id/access` - Create share link
- `GET /media/album/:id/access/:token` - View shared album
- `POST /media/album/bulk-upload` - Bulk upload (fallback: `/media/bulk-upload`)

#### Authentication (`AUTH`)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/users` - Get all users (admin)
- `GET /auth/users/:id` - Get user details
- `PUT /auth/users/:id` - Update user
- `DELETE /auth/users/:id` - Delete user (admin)
- `POST /auth/users/:id/follow` - Follow user
- `POST /auth/users/:id/unfollow` - Unfollow user
- `GET /auth/users/:id/followers` - Get followers
- `GET /auth/users/:id/following` - Get following
- `GET /auth/users/:id/is-following` - Check follow status

#### Payments (`PAYMENTS`)
- `POST /payments/mpesa` - Initiate M-Pesa STK Push
- `POST /payments/callback` - M-Pesa callback handler
- `POST /payments/buy` - Direct purchase (mock)
- `GET /payments/purchase-history/:userId` - Purchase history
- `GET /payments/earnings/:photographerId` - Photographer earnings
- `GET /payments/earnings-summary/:photographerId` - Earnings summary
- `GET /payments/transactions/:userId` - User transactions
- `GET /payments/admin/dashboard` - Admin dashboard data

#### Cart (`CART`)
- `GET /payments/cart/:userId` - Get cart
- `POST /payments/cart/add` - Add to cart
- `POST /payments/cart/remove` - Remove from cart
- `DELETE /payments/cart/:userId` - Clear cart

#### Wallet (`WALLET`)
- `GET /payments/wallet/:userId` - Get wallet balance
- `GET /payments/transactions/:userId` - Get transactions
- `POST /payments/wallet/add` - Top up wallet (M-Pesa)

#### Receipts (`RECEIPTS`)
- `POST /payments/receipt/create` - Create receipt
- `GET /payments/receipt/:id` - Get receipt
- `GET /payments/receipts/:userId` - User receipts
- `GET /payments/admin/receipts` - All receipts (admin)

#### Refunds (`REFUNDS`)
- `POST /payments/refund/request` - Request refund
- `GET /payments/refunds/:userId` - User refunds
- `POST /payments/refund/approve` - Approve refund (admin)
- `POST /payments/refund/reject` - Reject refund (admin)
- `POST /payments/refund/process` - Process refund (admin)
- `GET /payments/admin/refunds` - All refunds (admin)

#### Share Links (`SHARE`)
- `POST /share/generate` - Generate share link
- `GET /share/:token` - Access shared content
- `GET /share/:token/download` - Download via share link
- `GET /share/list` - List active share links
- `GET /share/:token/stats` - Share statistics
- `POST /share/:token/revoke` - Revoke share link

#### Notifications (`NOTIFICATIONS`)
- `GET /notifications` - Get notifications (with pagination)
- `GET /notifications?unreadOnly=true` - Get unread only
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read/all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `POST /notifications/share/send` - Send share notification
- `GET /notifications/share/search-recipients` - Search users
- `GET /notifications/admin/shares` - Admin shares view
- `GET /notifications/admin/stats` - Share statistics

#### Admin (`ADMIN`)
- `GET /admin/settings` - Get platform settings
- `PUT /admin/settings` - Update settings
- `PUT /admin/settings/platform-fee` - Update fee
- `PUT /admin/settings/payout` - Update min payout
- `POST /admin/settings/test-email` - Test email
- `POST /admin/clear-cache` - Clear cache
- `POST /admin/maintenance-mode` - Toggle maintenance mode
- `GET /admin/audit/purchases` - Purchase audit

#### Favorites (`USERS`)
- `GET /users/favorites/:userId` - Get favorites
- `POST /users/favorites/add` - Add favorite
- `DELETE /users/favorites/:userId/:mediaId` - Remove favorite

### **API Configuration**
- **Base URL:** `https://pm-backend-f3b6.onrender.com/api` (deployments) or `process.env.REACT_APP_API_URL`
- **Auth Method:** Bearer token in `Authorization` header
- **Timeout:** 60 seconds for requests
- **Error Handling:** 401 redirects to login, 403 shows permission denied

### **Missing API Calls on Frontend**
- ❌ Messaging endpoints (backend exists, no frontend UI)
  - `/api/messages/conversations`
  - `/api/messages/messages`
  - `/api/messages/messages/:id/reactions`

---

## 4. M-PESA PAYMENT IMPLEMENTATION

### **Frontend Flow - BuyerCart.jsx**

```
1. User adds items to cart
2. Clicks "Checkout" → Payment method selection (M-Pesa/Wallet)
3. For M-Pesa:
   - Validates phone: 254XXXXXXXXX format
   - Calls POST /api/payments/mpesa with:
     {
       buyerId: user._id,
       buyerPhone: "254712345678",
       mediaId: (single item) or array (multiple items),
       amount: calculateTotal(),
       walletTopup: false (or true if topup)
     }
4. Backend initiates M-Pesa STK Push
5. User enters PIN on phone
6. STK Push result → Backend callback
7. Auto-download triggered after success
```

### **Implementation Details**

**Phone Number Validation:**
```javascript
// Frontend validates: /^254\d{9}$/
// Must be: 254XXXXXXXXX (Kenya country code + 9 digits)
```

**Cart State Management:**
- Local storage fallback if API unavailable
- `getLocalCart()`, `removeFromLocalCart()`, `clearLocalCart()`
- API-first strategy with offline mode

**Post-Payment:**
- ✅ Auto-download files after successful payment
- ✅ Clear cart
- ✅ Show success notification
- ✅ Update wallet balance

**Status:** ✅ **Fully Implemented**

---

## 5. MESSAGING / CHAT IMPLEMENTATION

### Current Status: ❌ **NOT IMPLEMENTED ON FRONTEND**

**Backend Status:** ✅ Fully implemented
- `Backend/models/Message.js` - Message schema
- `Backend/models/Conversation.js` - Conversation schema
- `Backend/controllers/messagingController.js` - 11 functions
- `Backend/routes/messagingRoutes.js` - 11 endpoints

**Backend Features:**
- ✅ 1-1 messaging (no group yet)
- ✅ Read receipts
- ✅ Emoji reactions
- ✅ Edit/delete messages
- ✅ Archive conversations
- ✅ Unread count tracking
- ✅ Reply threading
- ✅ Message history

**Missing on Frontend:**
- ❌ Conversation list component
- ❌ Chat UI component
- ❌ Message input form
- ❌ Real-time message updates (no WebSocket)
- ❌ Notification for new messages
- ❌ Archive/unarchive UI
- ❌ Reaction picker UI

### **What Would Be Needed:**

**New Components:**
```
Components/Pages/Messaging/
├── ConversationList.jsx      - List of conversations
├── ChatUI.jsx                - Chat window
├── MessageInput.jsx          - Message composer
├── ReactionPicker.jsx        - Emoji reactions
└── ArchiveModal.jsx          - Archive conversation
```

**API Calls (Already in backend):**
```javascript
// Get conversations
GET /api/messages/conversations

// Send message
POST /api/messages/messages
{ conversationId, text, replyTo }

// Get messages
GET /api/messages/conversations/:id/messages?limit=50&skip=0

// Mark as read
PUT /api/messages/conversations/:id/read

// Add reaction
POST /api/messages/messages/:id/reactions
{ emoji }

// Edit message
PUT /api/messages/messages/:id
{ text }

// Delete message
DELETE /api/messages/messages/:id
```

---

## 6. ADMIN DASHBOARD IMPLEMENTATION

### Current Status: ✅ **Partially Implemented**

### **AdminDash.jsx Features:**
- ✅ Revenue card with KES formatting
- ✅ Photographer earnings (70% share)
- ✅ Platform fees (30% share)
- ✅ Total media count
- ✅ Total active users
- ✅ Total transactions
- ✅ Pending refunds count
- ✅ Recent receipts (last 5)
- ✅ Recent refunds (pending only)
- ✅ Top photographers list (currently empty - unstable endpoint)
- ✅ Popular media (by likes)
- ✅ Time range selector (day/week/month/year)

### **Admin Pages Implemented:**
- ✅ Dashboard with stats
- ✅ Media management (view, delete)
- ✅ User management
- ✅ Receipt management
- ✅ Refund management
- ✅ Settings (fees, payout, maintenance mode)
- ✅ Audit logs (purchase audit)

### **Missing Admin Features:**
- ❌ Messaging moderation
- ❌ User verification/KYC
- ❌ Content reporting system
- ❌ Advanced analytics charts
- ❌ Custom report generation
- ❌ Bulk user actions
- ❌ API key management
- ❌ Support tickets view
- ❌ System logs viewer

---

## 7. FILE STRUCTURE SUMMARY

```
PM-Frontend/src/
├── App.js                      - Main routing
├── App.css                     - Global styles
├── index.js                    - Entry point
├── api/
│   ├── API.js                  - All API calls
│   └── apiConfig.js            - Endpoint configuration
├── utils/
│   ├── auth.js                 - Auth utilities (tokens, headers)
│   ├── imageUrl.js             - Image URL resolution
│   ├── localStore.js           - Local storage fallbacks
│   └── placeholders.js         - Placeholder images
├── styles/
│   └── mobileStyles.css        - Mobile-specific CSS
├── Components/
│   ├── AuthCallback.jsx        - Google OAuth
│   ├── GoogleAuth.jsx          - Google button
│   ├── NotificationPanel.jsx   - Notification panel
│   ├── NotificationDropdown.jsx- Notification dropdown
│   ├── MasonryGrid.jsx         - Media grid layout
│   └── Pages/
│       ├── HomePage.jsx
│       ├── Login.jsx
│       ├── Register.jsx
│       ├── Wallet.jsx
│       ├── Explore.jsx
│       ├── Admin/
│       │   ├── AdminDash.jsx
│       │   ├── AdminMedia.jsx
│       │   ├── AdminUser.jsx
│       │   ├── AdminReceipts.jsx
│       │   ├── AdminRefunds.jsx
│       │   ├── AdminSettings.jsx
│       │   ├── AdminAudit.jsx
│       │   ├── AdminLayout.jsx
│       │   ├── AdminNavbar.jsx
│       │   └── AdminSidebar.jsx
│       ├── Photographer/
│       │   ├── PhotographerDash.jsx
│       │   ├── UploadMedia.jsx
│       │   ├── MyMedia.jsx
│       │   ├── Profile.jsx
│       │   ├── Earnings.jsx
│       │   ├── SalesHistory.jsx
│       │   ├── Withdrawals.jsx
│       │   └── PhotographerLayout.jsx
│       └── Buyer/
│           ├── BuyerDash.jsx
│           ├── BuyerExplore.jsx
│           ├── BuyerCart.jsx
│           ├── BuyerTransactions.jsx
│           ├── BuyerDownloads.jsx
│           ├── BuyerFavourite.jsx
│           ├── BuyerWallet.jsx
│           ├── BuyerProfile.jsx
│           ├── BuyerAlbumAccess.jsx
│           └── BuyerLayout.jsx
└── public/
    └── [static assets]
```

---

## 8. AUTHENTICATION & AUTHORIZATION

### **Implementation:**
- ✅ Token stored in `localStorage.token`
- ✅ User data stored in `localStorage.user` (JSON)
- ✅ Role stored in `localStorage.role` (admin/photographer/buyer)
- ✅ Auth interceptor in API.js adds Bearer token to all requests
- ✅ 401 responses redirect to `/login`
- ✅ Protected routes check auth token and role

### **Utilities:**
- `auth.js` - `getAuthToken()`, `getAuthHeaders()`, `getCurrentUserId()`, `getStoredUser()`, `getDisplayName()`
- `localStore.js` - Fallback storage for cart, purchases, wallet when API unavailable

---

## 9. CAPABILITIES MATRIX

| Feature | Status | Component | Notes |
|---------|--------|-----------|-------|
| **PHOTOGRAPHER CRUD** | | | |
| Media Upload | ✅ | UploadMedia.jsx | File validation, multipart upload |
| Media Edit/Delete | ✅ | MyMedia.jsx | Inline edit, soft delete |
| Profile Management | ✅ | Profile.jsx | Bio, website, social links |
| Album Management | ✅ | MyMedia.jsx | Create, edit, delete, bulk upload ready |
| Earnings Dashboard | ✅ | PhotographerDash.jsx | Stats, views, likes, sales |
| Sales History | ✅ | SalesHistory.jsx | Transaction list |
| Withdrawals | ✅ | Withdrawals.jsx | Payout history |
| Share Links | ✅ | MyMedia.jsx | QR code, expiration, download limits |
| **MESSAGING** | | | |
| Conversations List | ❌ | (Missing) | Backend ready, no UI |
| Send/Receive Messages | ❌ | (Missing) | Backend ready, no UI |
| Read Receipts | ❌ | (Missing) | Backend ready, no UI |
| Reactions | ❌ | (Missing) | Backend ready, no UI |
| **ADMIN STATS** | | | |
| Revenue Dashboard | ✅ | AdminDash.jsx | Total, photographer %, platform % |
| User Management | ✅ | AdminUser.jsx | CRUD operations |
| Media Moderation | ✅ | AdminMedia.jsx | View, delete |
| Receipt Tracking | ✅ | AdminReceipts.jsx | Payment receipts |
| Refund Management | ✅ | AdminRefunds.jsx | Approve, reject, process |
| Settings | ✅ | AdminSettings.jsx | Fees, payout, maintenance |
| Audit Logs | ✅ | AdminAudit.jsx | Purchase history |
| **M-PESA PAYMENTS** | | | |
| STK Push | ✅ | BuyerCart.jsx | Phone validation, error handling |
| Callback Handling | ✅ | Backend | Auto-download after success |
| Phone Validation | ✅ | BuyerCart.jsx | 254XXXXXXXXX format |
| Wallet Top-up | ✅ | BuyerWallet.jsx | M-Pesa integration |
| Receipt Generation | ✅ | BuyerTransactions.jsx | Payment receipts |
| Refund Flow | ✅ | Admin UI | Request, approve, process |

---

## 10. MISSING / TODO ITEMS

### **High Priority (Core Features)**
- ❌ **Messaging UI** - 1-1 chat, notifications, real-time updates
- ❌ **WebSocket Support** - Real-time notifications & messages
- ❌ **Bulk Media Upload** - UI for album batch import
- ❌ **Search & Filter** - Advanced search on explore page

### **Medium Priority**
- ❌ **Client Requests/Inquiries** - Direct communication without messages
- ❌ **Review/Rating System** - User reviews for media & photographers
- ❌ **Advanced Analytics** - Charts, graphs, trend analysis
- ❌ **Content Reporting** - Abuse/DMCA reporting UI
- ❌ **Photographer Verification** - KYC/identity verification flow

### **Low Priority**
- ❌ **Mobile App** - Native mobile clients
- ❌ **Offline Mode** - Full offline capability
- ❌ **Dark/Light Theme Toggle** - User preference persistence
- ❌ **Localization** - Multi-language support
- ❌ **PWA Features** - Service workers, app installation

---

## 11. TECHNOLOGY STACK

- **Framework:** React.js
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **UI Framework:** Bootstrap 5
- **Icons:** FontAwesome
- **State Management:** React hooks (useState, useEffect, useCallback)
- **Form Handling:** Native HTML forms
- **Image Optimization:** URL-based lazy loading
- **Local Storage:** Browser localStorage API

---

## 12. KEY IMPLEMENTATION NOTES

### **API Fallback Strategy**
- Cart, wallet use local storage fallback if API unavailable
- `localStore.js` provides offline support
- API availability tracked per feature

### **Image Handling**
- Protected image URLs for private content
- Different placeholders based on size (small, medium, large)
- URL resolution helpers for various data structures

### **Authentication Flow**
- Token-based (JWT stored in localStorage)
- Role-based access control (photographer, buyer, admin)
- Auto-redirect on 401/403

### **Error Handling**
- Graceful API failures with user-friendly messages
- Fallback to local data when APIs unavailable
- Form validation before submission

---

## 13. DEPLOYMENT NOTES

**API Configuration:**
```javascript
// Check for custom API URL via env variable
// Fallback: https://pm-backend-f3b6.onrender.com/api
process.env.REACT_APP_API_URL or DEFAULT_API_BASE_URL
```

**Build Process:**
```bash
npm run build
# Output: PM-Frontend/build/
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Pages | 21 |
| Admin Pages | 9 |
| Photographer Pages | 7 |
| Buyer Pages | 9 |
| Public Pages | 5 |
| API Endpoints Called | 80+ |
| Backend Routes Available | 11 (messaging - not used) |
| Components | 32+ |
| Implemented Features | 45+ |
| Missing Features | 8+ |

---

## Recommendations

1. **Implement Messaging UI** - Backend is ready; create React components
2. **Add WebSocket Support** - For real-time notifications & messages
3. **Implement Search** - Filter media by category, price, photographer
4. **Add Review System** - User ratings for quality & trust
5. **Create Mobile Optimizations** - Current UI is responsive but mobile-specific enhancements needed
6. **Add Analytics Dashboard** - For photographers to track performance

