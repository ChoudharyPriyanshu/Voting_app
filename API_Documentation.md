# VotoSphere API Documentation (v1)

All endpoints are prefixed with `/api/v1`.

## 🔐 Authentication

### Signup
- **URL**: `/user/signup`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "aadharCardNumber": "123456789012",
  "age": 25,
  "role": "voter"
}
```
- **Response**: `200 OK` (Sends OTP to email)

### Verify OTP
- **URL**: `/user/verify-otp`
- **Method**: `POST`
- **Body**: `{ "email": "john@example.com", "otp": "123456" }`
- **Response**: `{ "token": "JWT_TOKEN", "message": "..." }`

### Login
- **URL**: `/user/login`
- **Method**: `POST`
- **Body**: `{ "aadharCardNumber": "123456789012", "password": "password123" }`
- **Response**: `{ "token": "JWT_TOKEN" }`

---

## 🗳️ Elections & Candidates

### Create Election (Admin)
- **URL**: `/election`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "title": "General Election 2026",
  "description": "Annual student council election",
  "startDate": "2026-04-01",
  "endDate": "2026-04-02"
}
```

### Add Candidate (Admin)
- **URL**: `/candidate`
- **Method**: `POST`
- **Type**: `multipart/form-data`
- **Fields**: `name`, `party`, `age`, `election` (ID), `photo` (file), `symbol` (file)

### Vote (Voter)
- **URL**: `/candidate/vote/:candidateId`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "message": "vote recorded", "receiptHash": "SHA256_HASH" }`

---

## 📊 Statistics & Exports

### Get Election Stats
- **URL**: `/election/:id/stats`
- **Method**: `GET`

### Export Results (PDF)
- **URL**: `/election/:id/export/pdf`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### Audit Logs (Admin)
- **URL**: `/audit`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
