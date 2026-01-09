# Hướng Dẫn Rút Tiền - Withdrawal Feature

## Tổng Quan

Tính năng rút tiền cho phép người dùng rút tiền từ số dư của mình thông qua chuyển tiền ngân hàng mô phỏng với xác minh OTP qua email.

**Quy Trình:**
1. Người dùng bắt đầu rút tiền → OTP tự động gửi qua email
2. Người dùng nhập mã OTP 6 chữ số
3. Hoàn tất rút tiền → Số dư bị trừ ngay lập tức

---

## API Endpoints

### 1️⃣ POST /api/withdrawals
**Khởi Tạo Rút Tiền (Tự động gửi OTP)**

Tạo yêu cầu rút tiền mới. OTP sẽ tự động gửi đến email người dùng.

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

**Mô Tả Các Trường:**
- `amount` (number): Số tiền cần rút (phải ≤ số dư hiện tại)
- `accountNumber` (string): Số tài khoản ngân hàng
- `bankName` (string): Tên ngân hàng (Vietcombank, SacomBank, TPBank, ...)
- `accountName` (string): Tên chủ tài khoản

**Response (201):**
```json
{
  "success": true,
  "data": {
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
}
```

**Lưu Ý:**
- OTP tự động gửi đến email của người dùng
- Trạng thái ngay lập tức là `OTP_SENT`
- OTP có hiệu lực trong 10 phút
- Kiểm tra email hoặc console để nhận mã OTP 6 chữ số

**Lỗi Có Thể Xảy Ra:**
```json
{
  "success": false,
  "error": {
    "message": "Insufficient balance. Available: 500000, Requested: 1000000",
    "code": "INITIATE_WITHDRAWAL_ERROR"
  }
}
```
- 401: Token không hợp lệ hoặc thiếu
- 400: Số dư không đủ
- 400: Số tiền không hợp lệ (≤ 0)
- 400: Các trường bắt buộc bị thiếu
- 404: Người dùng không tồn tại

---

### 2️⃣ POST /api/withdrawals/:withdrawalId/verify-otp
**Xác Minh Mã OTP & Hoàn Tất Rút Tiền**

Xác minh mã OTP 6 chữ số được gửi đến email. **Sau khi OTP hợp lệ, rút tiền sẽ hoàn tất ngay lập tức và số dư bị trừ.**

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
  "success": true,
  "message": "Withdrawal completed successfully",
  "withdrawal": {
    "id": "withdrawal-uuid",
    "userId": "user-uuid",
    "amount": 100000,
    "currency": "VND",
    "accountNumber": "1234567890",
    "bankName": "Vietcombank",
    "accountName": "Nguyen Van A",
    "status": "COMPLETED",
    "createdAt": "2026-01-09T12:00:00Z",
    "verifiedAt": "2026-01-09T12:05:00Z"
  },
  "user": {
    "id": "user-uuid",
    "balance": 900000
  }
}
```

**Lưu Ý:**
- Mã OTP phải đúng và còn hiệu lực (< 10 phút)
- **OTP hợp lệ = Rút tiền hoàn tất ngay lập tức**
- **Số dư được trừ ngay lập tức** từ `User.balance`
- Trạng thái thay đổi thành `COMPLETED` (không cần bước separate)
- Trừ tiền và cập nhật trạng thái xảy ra cùng một transaction (atomic)

**Response trả về:**
- `withdrawal`: Chi tiết yêu cầu rút tiền đã hoàn tất
- `user.balance`: Số dư mới sau khi trừ

**Lỗi Có Thể Xảy Ra:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid OTP",
    "code": "VERIFY_OTP_ERROR"
  }
}
```
- 400: Mã OTP không đúng
- 400: Mã OTP đã hết hạn (> 10 phút)
- 400: Yêu cầu rút tiền không ở trạng thái OTP_SENT
- 404: Yêu cầu rút tiền không tồn tại

---

### 3️⃣ POST /api/withdrawals/:withdrawalId/resend-otp
**Gửi Lại OTP (Nếu Không Nhận Được)**

Gửi lại mã OTP nếu người dùng không nhận được email. **Mã OTP cũ sẽ không còn hợp lệ.**

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
  "success": true,
  "message": "OTP resent to your email. Valid for 10 minutes.",
  "data": {
    "status": "OTP_SENT",
    "otpExpiresAt": "2026-01-09T12:15:00Z"
  }
}
```

**Lưu Ý:**
- Tạo mã OTP mới hoàn toàn
- Mã OTP cũ trở nên không hợp lệ
- Có hiệu lực trong 10 phút từ lúc gửi lại
- Chỉ sử dụng nếu không nhận được email lần đầu

---

### 5️⃣ GET /api/withdrawals/:withdrawalId
**Kiểm Tra Trạng Thái Rút Tiền**

Lấy thông tin chi tiết của một yêu cầu rút tiền.

**Headers:**
```
Authorization: Bearer <jwt_token>
---

### 4️⃣ GET /api/withdrawals/:withdrawalId
**Kiểm Tra Trạng Thái Yêu Cầu Rút Tiền**

Lấy thông tin chi tiết của một yêu cầu rút tiền.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
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
}
```

---

### 5️⃣ GET /api/withdrawals
**Danh Sách Tất Cả Yêu Cầu Rút Tiền**

Lấy tất cả yêu cầu rút tiền của người dùng hiện tại, sắp xếp từ mới nhất.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
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
}
```

---

## Quy Trình Rút Tiền Chi Tiết

### Bước 1: Kiểm Tra Số Dư (Tùy Chọn)
```bash
GET /api/accounts/me
Authorization: Bearer <jwt_token>
```

Ghi nhớ số dư hiện tại.

---

### Bước 2: Khởi Tạo Rút Tiền
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

**Phản Hồi:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123-def",
    "status": "OTP_SENT",
    ...
  }
}
```

**Lưu ý:** Lưu giữ `id` từ phản hồi (sử dụng làm `{{withdrawalId}}` trong các bước tiếp theo)

⚠️ **OTP đã tự động gửi đến email của bạn!**

---

### Bước 3: Lấy Mã OTP từ Email

Kiểm tra email hoặc console logs để nhận mã OTP 6 chữ số.

**Nếu không nhận được email:**
```bash
POST /api/withdrawals/{{withdrawalId}}/resend-otp
Authorization: Bearer <jwt_token>

{}
```

Mã OTP mới sẽ được gửi, mã cũ không còn hợp lệ.

---

### Bước 4: Xác Minh Mã OTP & Hoàn Tất Rút Tiền
```bash
POST /api/withdrawals/{{withdrawalId}}/verify-otp
Authorization: Bearer <jwt_token>

{
  "otp": "123456"
}
```

Thay `123456` bằng mã OTP thực tế từ email.

**Phản Hồi Thành Công:**
```json
{
  "success": true,
  "message": "Withdrawal completed successfully",
  "withdrawal": {
    "id": "abc-123-def",
    "amount": 100000,
    "status": "COMPLETED",
    "accountNumber": "1234567890",
    "bankName": "Vietcombank",
    "accountName": "Nguyen Van A",
    "verifiedAt": "2026-01-09T12:05:00Z"
  },
  "user": {
    "id": "user-uuid",
    "balance": 900000
  }
}
```

⚠️ **Số dư đã bị trừ ngay lập tức!**
- Số tiền rút: 100,000 VND
- Số dư mới: 900,000 VND ✓

---

### Bước 5: Xác Minh Số Dư Giảm (Tùy Chọn)
```bash
GET /api/accounts/me
Authorization: Bearer <jwt_token>
```

Kiểm tra `balance` để xác nhận đã giảm đúng.

---

## Trạng Thái Rút Tiền

| Trạng Thái | Ý Nghĩa | Cách Đạt Được |
|-----------|---------|-----------|
| **OTP_SENT** | Yêu cầu tạo + OTP gửi đến email | Tự động khi khởi tạo |
| **COMPLETED** | Rút tiền hoàn tất, OTP xác minh, số dư đã bị trừ | Sau khi verify-otp thành công |

**Ghi Chú:** Không còn trạng thái `OTP_VERIFIED` - quá trình xác minh OTP sẽ trực tiếp hoàn tất rút tiền.

---

## Dữ Liệu Mẫu

### Ví Dụ 1: Vietcombank
```json
{
  "amount": 100000,
  "accountNumber": "1234567890",
  "bankName": "Vietcombank",
  "accountName": "Nguyen Van A"
}
```

### Ví Dụ 2: SacomBank
```json
{
  "amount": 50000,
  "accountNumber": "0987654321",
  "bankName": "SacomBank",
  "accountName": "Tran Thi B"
}
```

### Ví Dụ 3: TPBank
```json
{
  "amount": 250000,
  "accountNumber": "5555666677778888",
  "bankName": "TPBank",
  "accountName": "Le Van C"
}
```

---

## Yêu Cầu Quan Trọng

| Yêu Cầu | Chi Tiết |
|--------|---------|
| **Token JWT** | Bắt buộc trong Header `Authorization: Bearer <token>` |
| **Số Dư Đủ** | Tài khoản phải có đủ tiền tại lúc khởi tạo |
| **Email Hợp Lệ** | OTP được gửi qua email đăng ký |
| **OTP Hợp Lệ** | Mã OTP phải còn hiệu lực (< 10 phút) |
| **Ownership** | Chỉ có thể quản lý yêu cầu rút tiền của chính mình |

---

## Postman Collection

Sử dụng `WITHDRAWAL_TEST.postman_collection.json` để test với các biến:
- `{{access_token}}`: JWT token của bạn
- `{{withdrawalId}}`: ID từ bước khởi tạo rút tiền

Tất cả endpoints đã được cấu hình sẵn và sẵn sàng sử dụng!

---

## Các Lỗi Thường Gặp

### ❌ "Insufficient balance"
**Nguyên Nhân:** Số dư không đủ  
**Giải Pháp:** Kiểm tra số dư hiện tại, giảm số tiền rút

### ❌ "Invalid OTP"
**Nguyên Nhân:** Nhập sai mã OTP hoặc hết hạn  
**Giải Pháp:** Kiểm tra email lại, gửi lại OTP nếu cần

### ❌ "Withdrawal not found"
**Nguyên Nhân:** ID không hợp lệ hoặc không thuộc về bạn  
**Giải Pháp:** Kiểm tra ID, chắc chắn bạn đang dùng token đúng

### ❌ "Unauthorized"
**Nguyên Nhân:** Token bị thiếu hoặc hết hạn  
**Giải Pháp:** Đăng nhập lại, cấp token JWT mới

---

## Lưu Ý Bảo Mật

✅ OTP được mã hóa lưu trong database  
✅ OTP chỉ gửi qua email, không bao giờ hiển thị trong API response  
✅ OTP hết hạn sau 10 phút  
✅ Chỉ chủ sở hữu yêu cầu mới có thể thực hiện  
✅ Balance deduction là atomic (không thể bị mất dữ liệu)

---

## Support

Nếu gặp vấn đề:
1. Kiểm tra console logs để xem chi tiết lỗi
2. Xác minh token JWT còn hợp lệ
3. Đảm bảo email cấu hình đúng trong `.env`
4. Thử gửi lại OTP nếu không nhận được
