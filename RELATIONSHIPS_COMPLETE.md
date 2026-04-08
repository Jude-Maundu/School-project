# Database Model Relationships - Complete Guide

## Model Structure & Relationships

### 1. **User Model** ⭐ (Central User Hub)
- **refs TO:** `followers[]`, `following[]` (self-referential)
- **has:** Profile, earnings tracking, uploads tracking
- **new fields:** `totalEarnings`, `totalUploads`, `totalDownloads`
- **indexes:** email, username, role, createdAt

### 2. **Media Model** (Content)
```
Media
├── photographer → User (photographer who uploaded)
├── album → Album (optional, can be standalone)
├── purchasedBy[] → User[] (users who bought this)
├── comments[] → Comment[] (comments on media)
└── metadata: views, likes, downloads, rating
```

### 3. **Album Model** (Media Collection)
```
Album
├── photographer → User (photographer who owns)
├── media[] → Media[] (all media in album)
├── purchasedBy[] → User[] (users who bought album)
└── metadata: mediaCount, views
```

### 4. **Comment Model** (NEW - Media Feedback)
```
Comment
├── media → Media (commented on)
├── author → User (who commented)
├── likedBy[] → User[] (who liked this comment)
├── replies[] → [{author: User, text}]
└── isVerifiedPurchase (boolean)
```

### 5. **Cart Model** (Shopping)
```
Cart (unique: one per User)
├── user → User (owner, unique)
└── items[]
    ├── media → Media
    └── price, addedAt
```

### 6. **Payment Model** (Transactions)
```
Payment
├── buyer → User
├── photographer → User (who gets paid)
├── media → Media (optional, if single item)
├── album → Album (optional, if album purchase)
├── cartItems[] → Media[]
├── receipt → Receipt
└── status: pending, completed, failed, refunded
```

### 7. **Receipt Model** (Purchase History)
```
Receipt (unique: one per Payment)
├── buyer → User
├── payment → Payment (unique link)
└── items[]
    ├── media → Media
    ├── album → Album
    └── photographer → User
```

### 8. **Refund Model** (Returns)
```
Refund
├── payment → Payment
├── buyer → User
├── media → Media (optional)
├── album → Album (optional)
├── receipt → Receipt
└── status: pending, approved, rejected, processed
```

### 9. **Favorite Model** (Wishlist)
```
Favorite (unique: user+media combo)
├── user → User
└── media → Media
```

### 10. **Wallet Model** (Money Account)
```
Wallet (unique: one per User)
├── user → User (unique link)
├── balance, totalReceived, totalWithdrawn
└── transactions[] → WalletTransaction[]
```

### 11. **WalletTransaction Model** (NEW - Money Trail)
```
WalletTransaction
├── wallet → Wallet
├── user → User (who owns wallet)
├── type: credit, debit, refund, topup
├── payment → Payment (if from sale)
├── refund → Refund (if from refund)
├── photographer → User (if paid to photographer)
├── media → Media (what was sold)
├── album → Album (what was sold)
└── status: pending, completed, failed
```

### 12. **ShareToken Model** (Link Sharing)
```
ShareToken
├── media → Media (optional)
├── album → Album (optional, NEW - can share albums)
├── createdBy → User
├── sentTo[] → [{userId: User, sentAt}]
└── accessLog[] → analytics
```

### 13. **EventAccess Model** (Album Access Control)
```
EventAccess
├── album → Album
├── photographer → User
├── buyer → User
├── token, expiresAt, isActive
```

### 14. **Notification Model** (Alerts)
```
Notification
├── recipient → User
├── sender → User
└── data
    ├── mediaId → Media
    ├── paymentId → Payment
    ├── shareToken
    ├── albumId → Album
```

### 15. **MpesaLog Model** (Payment Audit)
```
MpesaLog (audit trail)
├── payment → Payment
└── eventType: request, response, callback, b2c, error
```

### 16. **MpesaRetry Model** (Retry Queue)
```
MpesaRetry (retry mechanism)
├── payment → Payment
├── user → User
└── status: pending, processing, success, failed
```

### 17. **Settings Model** (Singleton)
- Only one document
- Platform-wide configuration

---

## Purchase Flow (Relationships in Action)

```
User (buyer) 
  ↓ adds to Cart
  ├→ Cart.items[] → Media
  ↓ proceeds to checkout
  ├→ Payment (buyer, photographer, media/album, cartItems[])
  ├→ Backend updates: Media.purchasedBy[], Album.purchasedBy[]
  ↓ M-Pesa callback
  ├→ Payment.status = completed
  ├→ Wallet transaction created → WalletTransaction
  ├→ Wallet balance updated
  ├→ Receipt created
  ↓ download/share
  ├→ ShareToken created
  ├→ Notification sent to buyer
  └→ Media.downloads++
```

---

## Query Optimization (Indexes Added)

### Fast Lookups
- `User`: email, username, role, createdAt
- `Media`: photographer+createdAt, album, createdAt, rating
- `Album`: photographer+createdAt, createdAt
- `Payment`: buyer+createdAt, status, checkoutRequestID
- `Cart`: user (unique)
- `Favorite`: user+media (unique)
- `Receipt`: buyer+createdAt, status, transactionId, receiptNumber
- `Wallet`: user (unique)
- `Notification`: recipient+createdAt, recipient+isRead
- `Comment`: media+createdAt, author+createdAt

---

## Key Features

✅ Denormalized data for performance (photographer name, media count in albums)
✅ Unique constraints prevent duplicates (User.email, Cart.user, Wallet.user)
✅ TTL indexes auto-delete expired tokens (ShareToken, EventAccess)
✅ Audit trails (MpesaLog, WalletTransaction)
✅ Flexible purchasing (single media, albums, or cart)
✅ Refund tracking separate from payments
✅ Comment system with ratings
✅ Wallet transactions fully tracked

---

## Migration Notes

If updating existing database:
1. Run: `db.createCollection("comments")` → Comment model
2. Run: `db.createCollection("wallettransactions")` → WalletTransaction model
3. Add indexes with: `db.media.createIndex({...})`
4. Update existing Media/Album/Payment documents with new fields
