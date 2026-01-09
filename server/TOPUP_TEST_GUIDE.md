# TopUp VNPay Test Guide - Simplified (No Account Required)

## Flow Test TopUp

### Bước 1: Login lấy Token
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "alice@test.com",
  "password": "Test@123456"
}
```
**Response:** Lấy `token` từ response, gán vào biến `TOKEN` trong Postman

---

### Bước 2: Tạo TopUp Request (Không cần Account, returnUrl tự động từ env)
```
POST http://localhost:8080/api/payments/topup
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "amount": 500000
}
```

**Response example:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paygate?...",
    "settlementId": "topup-uuid",
    "txnRef": "TU_abc12345_1673456789",
    "amount": 500000
  }
}
```

**Lấy `txnRef` gán vào `TXN_REF`**

> Bình thường bạn sẽ click vào `paymentUrl` để thanh toán trên VNPay.
> VNPay sẽ redirect về `http://localhost:8080/api/payments/vnpay-return` (từ env `VNPAY_RETURN_URL`)

---

### Bước 3: VNPay Redirect Return (Automatic)
Khi thanh toán xong, VNPay tự động redirect:

```
GET http://localhost:8080/api/payments/vnpay-return?vnp_TxnRef=TU_xxx&vnp_ResponseCode=00&vnp_Amount=50000000&...
```

**Response:**
```json
{
  "success": true,
  "message": "Top-up successful",
  "data": {
    "settlementId": "topup-uuid"
  }
}
```

Khi `TopUp` status = `COMPLETED`:
- **User.balance tăng** 500,000 VND ✓
- TopUp record status = COMPLETED

---

### Bước 4: Kiểm tra User Balance
```
GET http://localhost:8080/api/accounts/me
Authorization: Bearer {{TOKEN}}
```

**Xem User.balance có tăng không**

---

## Các Biến Postman Cần Lưu

| Biến | Giá trị | Lấy từ đâu |
|------|--------|-----------|
| `TOKEN` | JWT token | Login response |
| `TXN_REF` | TU_xxx_timestamp | Create TopUp response |

---

## Flow Chi Tiết - Code

### 1. Client gọi `/api/payments/topup` (Đơn giản hơn!)
```typescript
// vnpayController.createTopUp()
- Validate: amount, returnUrl
- Lấy userId từ token (req.user.userId)
- Gọi accountService.createTopUp(userId, amount)
  - Tạo TopUp record (status = PENDING)
  - Return topUpId
- Gọi vnpayService.createTopUpUrl(topUpId, amount, ...)
  - Tạo URL VNPay
  - Update TopUp.vnpayTxnRef = "TU_xxx"
  - Return paymentUrl
```

### 2. Client click paymentUrl → VNPay thanh toán → Redirect returnUrl
```
VNPay → http://localhost:3000/vnpay-return?vnp_TxnRef=TU_xxx&vnp_ResponseCode=00&...
```

### 3. Backend nhận callback (returnUrl or IPN)
```typescript
// vnpayService.verifyReturnUrl()
- Verify signature với VNPay
- Nếu valid & success:
  - Lấy txnRef (TU_xxx → TopUp)
  - Gọi accountService.completeTopUp(topUpId, txnRef)
    - Prisma transaction:
      - Update TopUp: status = COMPLETED, vnpayTxnRef
      - Update User: balance += amount ✓✓✓
  - Return success
```

---

## Test Scenario

### Success Scenario
1. Login → Token = `abc123`
2. TopUp 500,000 → TxnRef = `TU_xxx_123`
3. VNPay Return Success → User.balance +500,000
4. Check User → balance = 500,000 ✓

### Failure Scenario
1. TopUp 500,000 → TxnRef = `TU_xxx_123`
2. VNPay Return Fail (ResponseCode != 00)
3. TopUp.status = COMPLETED but failed
4. User.balance NOT changed ✗

---

## CURL Test Commands

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"Test@123456"}'

# 2. TopUp (No returnUrl needed - from env!)
curl -X POST http://localhost:8080/api/payments/topup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":500000}'

# 3. Simulate VNPay Return (VNPay redirects here automatically)
curl "http://localhost:8080/api/payments/vnpay-return?vnp_TxnRef=TU_xxx_123&vnp_ResponseCode=00"
```

---

## .env Setup Required

**Thêm vào `.env`:**
```dotenv
SERVER_URL="http://localhost:8080"
VNPAY_RETURN_URL="http://localhost:8080/api/payments/vnpay-return"
VNPAY_IPN_URL="http://localhost:8080/api/payments/vnpay-ipn"
```

Hoặc cho production:
```dotenv
SERVER_URL="https://api.yourdomain.com"
VNPAY_RETURN_URL="https://api.yourdomain.com/api/payments/vnpay-return"
VNPAY_IPN_URL="https://api.yourdomain.com/api/payments/vnpay-ipn"
```

---

## Postman Environment Setup

```json
{
  "name": "Local Dev",
  "values": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:8080",
      "enabled": true
    },
    {
      "key": "TOKEN",
      "value": "",
      "enabled": true
    },
    {
      "key": "TXN_REF",
      "value": "",
      "enabled": true
    }
  ]
}
```

---

## Database Schema - TopUp

**Trước (Sai):**
```sql
top_ups (id, accountId, amount, currency, status, vnpayTxnRef, createdAt, updatedAt)
  FK: accountId → accounts.id
```

**Sau (Đúng - Simplify):**
```sql
top_ups (id, userId, amount, currency, status, vnpayTxnRef, createdAt, updatedAt)
  FK: userId → users.id
```

Logic:
- Nạp tiền: TopUp.userId → User.balance += amount
- Rút tiền: Settlement → User.balance -= amount

