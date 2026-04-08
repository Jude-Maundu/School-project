# M-Pesa Complete Implementation & Debugging Guide

## ✅ State of Implementation

M-Pesa is **fully implemented** with:
- ✅ STK Push for initiating payments
- ✅ Callback handler to receive M-Pesa responses
- ✅ B2C payouts to photographers
- ✅ Retry queue for failed transactions
- ✅ M-Pesa logging for audit
- ✅ Email receipts
- ✅ Wallet integration

## 🔧 Configuration Checklist

### 1. Environment Variables (REQUIRED)

```bash
# Core M-Pesa credentials
MPESA_CONSUMER_KEY=your_consumer_key_from_daraja
MPESA_SECRET_KEY=your_consumer_secret_from_daraja
MPESA_BUSINESS_SHORTCODE=174379          # Your business short code
MPESA_PASSKEY=your_passkey_from_daraja   # For STK Push
MPESA_ENV=sandbox                         # or "production"

# For B2C payouts (payouts to photographers)
MPESA_SECURITY_CREDENTIAL=your_encrypted_credential  # Encrypted initiator password
MPESA_INITIATOR_NAME=testapi             # Your initiator name

# Callback configuration (CRITICAL)
BASE_URL=https://pm-backend-1-0s8f.onrender.com  # Your backend URL
MPESA_CALLBACK_URL=https://pm-backend-1-0s8f.onrender.com/api/payments/callback

# Optional
ADMIN_PHONE_NUMBER=254793945789          # Admin's mpesa phone for testing
```

### 2. Test Credentials for Sandbox

```
Consumer Key:    Generated from Daraja dashboard
Consumer Secret: Generated from Daraja dashboard
Shortcode:       174379
Passkey:         bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

Test Phone:      254708374149 or 254723076072  (Safaricom sandbox numbers)
```

---

## 📞 Phone Number Format

### Requirements
- **Must start with:** 254 (Kenya country code)
- **Total length:** 12 digits (254 + 9 digits)
- **No spaces, dashes, or + signs**

### Valid Formats ✅
```
254712345678   ✅ Correct
254723076072   ✅ Correct
```

### Invalid Formats ❌
```
0712345678     ❌ Leading zero (remove it, add 254)
+254712345678  ❌ Plus sign (remove it)
+254 712 345 678 ❌ Spaces (remove them)
712345678      ❌ Missing country code
```

### Conversion Helper

```javascript
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/[\s\-()]/g, '');  // Remove spaces, dashes, etc
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (cleaned.length === 9) cleaned = '254' + cleaned;
  return cleaned;
}

// Examples
formatPhoneNumber('0712345678')      // → '254712345678' ✅
formatPhoneNumber('+254712345678')   // → '254712345678' ✅
formatPhoneNumber('254 712 345 678') // → '254712345678' ✅
```

---

## 🔄 Payment Flow

### 1. STK Push (Initiate Payment)
```
POST /api/payments/mpesa

Request:
{
  "buyerPhone": "254712345678",    // MUST be 254XXXXXXXXX format
  "buyerId": "user_mongodb_id",
  "mediaId": "media_mongodb_id",   // OR use "amount" for topup
  "amount": 50                      // For wallet topup: required
}

Response:
{
  "success": true,
  "payment": { _id, status: "pending", checkoutRequestID, ... },
  "stkResponse": { CheckoutRequestID, MerchantRequestID, ResponseCode, ... }
}

Expected: User sees STK prompt on phone → enters PIN → completes
```

### 2. M-Pesa Processes (Happens on phone)
- User enters PIN on phone
- Money deducted from account
- M-Pesa server processes

### 3. Callback (Receive Result) - AUTOMATIC
```
M-Pesa →  POST /api/payments/callback

M-Pesa sends:
{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "...",
      "ResultCode": 0,              // 0 = success, non-zero = failure
      "ResultDesc": "The service request...",
      "CallbackMetadata": {
        "Item": [
          { Name: "Amount", Value: 50 },
          { Name: "MpesaReceiptNumber", Value: "QIZ5EUJE7Q" },
          { Name: "TransactionDate", Value: 20260325123456 },
          { Name: "PhoneNumber", Value: 254712345678 }
        ]
      }
    }
  }
}

Backend actions:
- ✅ Parse CheckoutRequestID
- ✅ Find Payment in database
- ✅ Update Payment.status = "completed"
- ✅ Create Receipt
- ✅ Send email to buyer
- ✅ Queue B2C payout to photographer
- ✅ Send notifications
```

### 4. B2C Payout (Send to Photographer) - AUTOMATIC
```
Backend → M-Pesa B2C API

Payload:
{
  "InitiatorName": "testapi",
  "SecurityCredential": "encrypted_password",
  "CommandID": "SalaryPayment",
  "Amount": 45,                    // 90% (10% goes to admin)
  "PartyA": "174379",              // Your business shortcode
  "PartyB": "254712345678",        // Photographer's phone
  "ResultURL": "https://..."       // M-Pesa calls this with result
}

Photographer sees: STK → Money arrives in wallet
```

---

## 🐛 Debugging

### Check Configuration
```bash
curl http://localhost:5000/api/mpesa/config/check
```

Response should show all credentials marked as ✅

### Test Credentials
```bash
curl -X POST http://localhost:5000/api/mpesa/config/test-credentials
```

If credentials work, you'll get an access token.

### View Payment Status
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/mpesa/payments/CHECKOUT_REQUEST_ID
```

### Check M-Pesa Logs
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/mpesa/logs?limit=50&eventType=callback
```

### View Retry Queue
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:5000/api/mpesa/retries
```

---

## ❌ Common Issues & Fixes

### Issue 1: "Invalid phone number format"
**Cause:** Phone is not in 254XXXXXXXXX format

**Fix:**
```javascript
// Frontend should do this before sending
const formatted = formatPhoneNumber(userPhone);
// Then send {buyerPhone: formatted}
```

### Issue 2: "Callback never received"
**Cause:** 
- BASE_URL not set correctly
- Backend not accessible from internet
- Firewall blocking callbacks

**Fix:**
```bash
# Check BASE_URL is set to production URL
echo $BASE_URL  # Should output: https://your-domain.com

# Test endpoint accessibility
curl https://your-domain.com/api/payments/callback -X POST
# Should NOT get connection refused
```

### Issue 3: "Payment stuck in pending"
**Cause:** Callback wasn't processed or payment.checkoutRequestID mismatch

**Fix:**
```bash
# Check logs
curl -H "Authorization: Bearer JWT" \
  http://localhost:5000/api/mpesa/logs?eventType=callback

# Look for: "Payment not found for CheckoutRequestID"
# This means database lookup failed - check IDs in logs

# View database directly
db.payments.findOne({status: "pending"})
```

### Issue 4: "B2C payout fails / goes to retry queue"
**Cause:**
- MPESA_SECURITY_CREDENTIAL not encrypted
- Photographer phone number wrong
- Insufficient balance

**Fix:**
```bash
# Check retry queue
curl -H "Authorization: Bearer JWT" \
  http://localhost:5000/api/mpesa/retries

# View the error in lastError field
# If it's "Invalid Credentials", you need proper encryption

# For MPESA_SECURITY_CREDENTIAL:
# 1. Get from M-Pesa Daraja portal
# 2. It should be a long base64-encoded encrypted string
# 3. NOT a plain password
```

### Issue 5: "ResultCode: 1"
**Cause:** Generic error (many possibilities)

**Fix:** Check ResultDesc in callback
- "Invalid Account" → user account issue
- "Insufficient Funds" → user doesn't have money
- "Expired Transaction" → user took >40 seconds
- "User Cancelled" → user pressed cancel

---

## 📊 Database Queries

### Get all completed payments
```javascript
db.payments.find({status: "completed"}).pretty()
```

### Get pending payments (waiting for callback)
```javascript
db.payments.find({status: "pending", createdAt: {$gt: new Date(Date.now() - 86400000)}})
```

### Get failed payments
```javascript
db.payments.find({status: "failed"})
```

### Get B2C retry attempts
```javascript
db.mpesaretries.find({status: {$in: ["pending", "processing", "failed"]}})
```

### Get M-Pesa audit log
```javascript
db.mpesalogs.find({eventType: "callback"}).sort({createdAt: -1}).limit(20)
```

---

## 🚀 Production Checklist

- [ ] MPESA_ENV set to "production"
- [ ] Real M-Pesa credentials (Consumer Key, Secret, Shortcode, Passkey)
- [ ] BASE_URL points to production backend (HTTPS)
- [ ] MPESA_CALLBACK_URL explicitly set
- [ ] MPESA_SECURITY_CREDENTIAL is properly encrypted
- [ ] Backend is publicly accessible (no firewall blocking /api/payments/callback)
- [ ] Database properly indexes Payment collection on checkoutRequestID
- [ ] Error handling/monitoring in place
- [ ] Test with production test account first
- [ ] Real payment test with small amount (e.g., KES 50)

---

## 🧪 Manual Test Steps

### Step 1: Initiate Payment
```bash
curl -X POST http://localhost:5000/api/payments/mpesa \
  -H "Content-Type: application/json" \
  -d '{
    "buyerPhone": "254708374149",
    "buyerId": "USER_ID",
    "mediaId": "MEDIA_ID"
  }'
```

### Step 2: Check Payment Created
```javascript
db.payments.findOne({checkoutRequestID: "RESPONSE_CHECKOUT_ID"})
// Should show: status: "pending"
```

### Step 3: Complete on Phone (Sandbox)
- Sandbox: Use 123456 as PIN
- Shortcode: 174379
- Amount: From your request

### Step 4: Verify Callback Received
```bash
# Wait 5-10 seconds, then check logs
curl -H "Authorization: Bearer JWT" \
  http://localhost:5000/api/mpesa/logs?eventType=callback
```

### Step 5: Confirm Payment Updated
```javascript
db.payments.findOne({checkoutRequestID: "RESPONSE_CHECKOUT_ID"})
// Should now show: status: "completed", mpesaReceiptNumber: "QIZ5..."
```

---

## 📞 Support Resources

- M-Pesa Daraja Portal: https://developer.safaricom.co.ke
- API Documentation: https://developer.safaricom.co.ke/apis
- Test Credentials: Available in Daraja dashboard
- Support: Safaricom Developer Support

---

## ✨ Next Steps

1. **Verify all environment variables** are set
2. **Test credentials** with `/api/mpesa/config/test-credentials`
3. **Run check** with `/api/mpesa/config/check`
4. **Make test STK Push** with sandbox phone number
5. **Monitor logs** in real-time
6. **Verify callback** is being received
7. **Check B2C retry** queue if payouts fail
