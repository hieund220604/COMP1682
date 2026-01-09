# Withdrawal Feature - Complete Testing Guide

## Overview
The withdrawal feature allows users to withdraw funds from their balance via simulated bank transfer with OTP verification.

**Key Flow:**
1. User initiates withdrawal → OTP automatically sent to email
2. User enters 6-digit OTP from email
3. After OTP verified → User completes withdrawal
4. Balance deducted atomically

## API Endpoints

### 1. POST /api/withdrawals
**Initiate Withdrawal (Auto-sends OTP)**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 100000,
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "accountName": "Nguyen Van A"
}
```

**Response (201):**
```json
{
  "id": "withdrawal-uuid",
  "userId": "user-uuid",
  "amount": 100000,
  "currency": "VND",
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "accountName": "Nguyen Van A",
  "status": "OTP_SENT",
  "createdAt": "2026-01-09T12:00:00Z",
  "otpExpiresAt": "2026-01-09T12:10:00Z"
}
```

**Notes:**
- OTP automatically sent to user email
- Status immediately becomes OTP_SENT
- OTP valid for 10 minutes
- Check email console for the 6-digit code

**Error Cases:**
- 401: Missing/invalid token
- 400: Insufficient balance
- 400: Invalid amount (≤ 0)
- 404: User not found

---

### 2. POST /api/withdrawals/:withdrawalId/resend-otp
**Resend OTP (If not received)**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "message": "OTP resent to your email. Valid for 10 minutes.",
  "status": "OTP_SENT"
}
```

**Notes:**
- Use only if user didn't receive first OTP
- Generates new OTP code
- Previous OTP becomes invalid
- Valid for 10 minutes from resend

### 3. POST /api/withdrawals/:withdrawalId/verify-otp
**Verify OTP Code**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message": "OTP verified successfully",
  "status": "OTP_VERIFIED"
}
```

**Error Cases:**
- 400: Invalid OTP
- 400: OTP expired (> 10 minutes)
- 400: Withdrawal not in OTP_SENT status

---

### 4. POST /api/withdrawals/:withdrawalId/complete
**Complete Withdrawal & Deduct Balance**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response (200):**
```json
{
  "message": "Withdrawal completed successfully",
  "status": "COMPLETED",
  "amount": 100000,
  "balanceAfter": 900000
}
```

**Process:**
- Validates withdrawal is in OTP_VERIFIED status
- Deducts amount from user.balance (atomic transaction)
- Sets status to COMPLETED
- Records verifiedAt timestamp

---

### 5. GET /api/withdrawals/:withdrawalId
**Get Single Withdrawal Status**

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "id": "withdrawal-uuid",
  "userId": "user-uuid",
  "amount": 100000,
  "currency": "VND",
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "accountName": "Nguyen Van A",
  "status": "COMPLETED",
  "createdAt": "2026-01-09T12:00:00Z",
  "otpExpiresAt": "2026-01-09T12:10:00Z",
  "verifiedAt": "2026-01-09T12:05:00Z"
}
```

---

### 6. GET /api/withdrawals
**List All User Withdrawals**

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
[
  {
    "id": "withdrawal-uuid-1",
    "userId": "user-uuid",
    "amount": 100000,
    "currency": "VND",
    "accountNumber": "1234567890",
    "bankName": "Vietcombank",
    "accountName": "Nguyen Van A",
    "status": "COMPLETED",
    "createdAt": "2026-01-09T12:00:00Z"
  },
  {
    "id": "withdrawal-uuid-2",
    "userId": "user-uuid",
    "amount": 50000,
    "currency": "VND",
    "accountNumber": "0987654321",
    "bankName": "SacomBank",
    "accountName": "Tran Thi B",
    "status": "OTP_SENT",
    "createdAt": "2026-01-09T11:00:00Z"
  }
]
```

---

## Complete Testing Flow

### Step 1: Get User Balance (Optional)
```bash
GET /api/accounts/me
Authorization: Bearer <jwt_token>
```
Note the current balance.

### Step 2: Initiate Withdrawal (OTP auto-sent)
```bash
POST /api/withdrawals
Authorization: Bearer <jwt_token>

{
  "amount": 100000,
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "accountName": "Nguyen Van A"
}
```
**Save the `id` from response** - use as `{{withdrawalId}}`
**OTP automatically sent to email - status is now OTP_SENT**

### Step 3: Get OTP from Email
Check your email or console logs for the 6-digit OTP code.

If OTP not received, you can resend:
```bash
POST /api/withdrawals/{{withdrawalId}}/resend-otp
Authorization: Bearer <jwt_token>

{}
```

### Step 4: Verify OTP
```bash
POST /api/withdrawals/{{withdrawalId}}/verify-otp
Authorization: Bearer <jwt_token>

{
  "otp": "123456"
}
```
Replace 123456 with actual OTP code

### Step 5: Complete Withdrawal
```bash
POST /api/withdrawals/{{withdrawalId}}/complete
Authorization: Bearer <jwt_token>

{}
```

### Step 6: Verify Balance Decreased
```bash
GET /api/accounts/me
Authorization: Bearer <jwt_token>
```
Check that balance = original - withdrawn amount

---

## Withdrawal Status States

| Status | Meaning | How to Reach |
|--------|---------|-----------|
| OTP_SENT | Created + OTP sent to email | Auto-sent when initiating withdrawal |
| OTP_VERIFIED | OTP validated successfully | After verify-otp endpoint succeeds |
| COMPLETED | Balance deducted, done | After complete endpoint succeeds |
| FAILED | Something went wrong | When error occurs during process |

---

## Important Notes

1. **Auto-OTP**: OTP automatically sent when initiating withdrawal
2. **OTP Validity**: 10 minutes from sending
3. **Resend Available**: If user didn't receive first OTP
4. **Balance Check**: User must have sufficient balance at initiation
5. **Atomic Transaction**: Balance deduction and status update happen together
6. **Permission**: Can only manage own withdrawals
7. **Email**: OTP sent via nodemailer (check console in dev mode)

---

## Example Test Data

```json
{
  "amount": 100000,
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "accountName": "Nguyen Van A"
}
```

```json
{
  "amount": 50000,
  "accountNumber": "0987654321",
  "bankName": "SacomBank",
  "accountName": "Tran Thi B"
}
```

```json
{
  "amount": 250000,
  "accountNumber": "5555666677778888",
  "bankName": "TPBank",
  "accountName": "Le Van C"
}
```

---

## Postman Collection

Use `WITHDRAWAL_TEST.postman_collection.json` with these variables:
- `{{access_token}}`: Your JWT token
- `{{withdrawalId}}`: From step 1 response

All endpoints are pre-configured and ready to use!
