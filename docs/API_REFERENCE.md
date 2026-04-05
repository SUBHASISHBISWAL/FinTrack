# API Reference

Complete endpoint reference for the Finance Dashboard API.
All endpoints return JSON. Protected endpoints require `Authorization: Bearer <token>` header.

---

## Authentication

### Login

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6..."
  }
}
```

---

### Register (Admin Only)

```
POST /api/auth/register
Authorization: Bearer <admin_access_token>
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepass",
  "name": "New User",
  "role": "ANALYST"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": 4,
    "email": "newuser@example.com",
    "name": "New User",
    "role": "ANALYST",
    "is_active": 1,
    "created_at": "2024-01-15 10:30:00"
  }
}
```

---

### Refresh Token

```
POST /api/auth/refresh
```

**Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Logout

```
POST /api/auth/logout
```

**Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully",
  "data": {
    "loggedOut": true
  }
}
```

---

## Users

### List All Users

```
GET /api/users
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": [
    {
      "id": 1,
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "is_active": 1,
      "created_at": "2024-01-15 10:00:00",
      "updated_at": "2024-01-15 10:00:00"
    }
  ]
}
```

---

### Update User

```
PATCH /api/users/:id
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "role": "ADMIN",
  "is_active": false
}
```

**Response (200):** Updated user object.
**Response (409):** No changes detected.

---

### Delete User (Soft)

```
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "User deleted successfully",
  "data": { "id": 3, "deleted": true }
}
```

**Response (409):** Cannot delete your own account.

---

### Restore User

```
PATCH /api/users/:id/restore
Authorization: Bearer <admin_token>
```

**Response (200):** Restored user object.
**Response (409):** User is not deleted.

---

## Financial Records

### Create Record

```
POST /api/records
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2024-01-15",
  "description": "January salary"
}
```

**Response (201):** Created record object.

---

### List Records (with Filters)

```
GET /api/records?type=EXPENSE&category=Rent&dateFrom=2024-01-01&dateTo=2024-12-31&search=office&page=1&limit=10
Authorization: Bearer <admin_or_analyst_token>
```

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `type` | string | Filter by `INCOME` or `EXPENSE` |
| `category` | string | Filter by category name |
| `dateFrom` | date | Records from this date |
| `dateTo` | date | Records up to this date |
| `search` | string | Search in description and category |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |

**Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Update Record

```
PATCH /api/records/:id
Authorization: Bearer <admin_token>
```

**Body (all fields optional, at least one required):**
```json
{
  "amount": 5500,
  "category": "Bonus"
}
```

---

### Delete Record (Soft)

```
DELETE /api/records/:id
Authorization: Bearer <admin_token>
```

---

### Restore Record

```
PATCH /api/records/:id/restore
Authorization: Bearer <admin_token>
```

---

## Dashboard

### Summary

```
GET /api/dashboard/summary
Authorization: Bearer <any_authenticated_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "totalIncome": 13000,
    "totalExpenses": 2750,
    "netBalance": 10250
  }
}
```

---

### Category Breakdown

```
GET /api/dashboard/category-breakdown
Authorization: Bearer <admin_or_analyst_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    { "category": "Salary", "type": "INCOME", "total": 9800 },
    { "category": "Rent", "type": "EXPENSE", "total": 1500 }
  ]
}
```

---

### Monthly Trends

```
GET /api/dashboard/trends
Authorization: Bearer <admin_or_analyst_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    { "month": "2024-01", "income": 6200, "expense": 2000 },
    { "month": "2024-02", "income": 5000, "expense": 1750 }
  ]
}
```

---

### Recent Activity

```
GET /api/dashboard/recent-activity?limit=5
Authorization: Bearer <any_authenticated_token>
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Human-readable error description"
}
```

| Status Code | Meaning |
|---|---|
| `400` | Validation error — malformed or missing fields |
| `401` | Unauthorized — missing, invalid, or expired token |
| `403` | Forbidden — insufficient role permissions |
| `404` | Not found — resource doesn't exist or was soft-deleted |
| `409` | Conflict — duplicate email, no changes detected, or resource state mismatch |
| `429` | Too many requests — rate limit exceeded on login |
| `500` | Internal server error — unexpected failure |
