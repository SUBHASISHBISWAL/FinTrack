# Architecture

This document describes the project's technical architecture, module design, and data flow.

---

## High-Level Overview

```
Client Request
     │
     ▼
┌─────────────────────────────────────────┐
│              Express Server             │
│                                         │
│  ┌─────────┐  ┌──────┐  ┌───────────┐  │
│  │ Helmet   │  │ CORS │  │ Rate Limit│  │
│  └────┬────┘  └──┬───┘  └─────┬─────┘  │
│       └──────────┼────────────┘         │
│                  ▼                      │
│          ┌──────────────┐               │
│          │  pino-http   │  (Request Log) │
│          └──────┬───────┘               │
│                 ▼                       │
│     ┌───────────────────────┐           │
│     │   Route Matching      │           │
│     │  /api/auth             │           │
│     │  /api/users            │           │
│     │  /api/records          │           │
│     │  /api/dashboard        │           │
│     └───────────┬───────────┘           │
│                 ▼                       │
│  ┌─────────────────────────────────┐    │
│  │     Middleware Pipeline         │    │
│  │                                 │    │
│  │  authenticate ──► authorize     │    │
│  │       │               │         │    │
│  │       ▼               ▼         │    │
│  │     validate ──► controller     │    │
│  └─────────────────┬───────────────┘    │
│                    ▼                    │
│             ┌────────────┐              │
│             │  Service    │              │
│             │  Layer      │              │
│             └──────┬─────┘              │
│                    ▼                    │
│             ┌────────────┐              │
│             │ better-     │              │
│             │ sqlite3     │              │
│             └─────────────┘              │
│                                         │
│          ┌──────────────┐               │
│          │ Error Handler │  (Global)     │
│          └──────────────┘               │
└─────────────────────────────────────────┘
```

---

## Directory Structure

```
src/
├── config/
│   ├── database.js          # SQLite connection singleton (WAL mode)
│   └── environment.js       # Env validation via Joi, exports config object
│
├── database/
│   ├── migrate.js           # Versioned schema migrations with tracking
│   └── seed.js              # Sample data seeder (transactional)
│
├── middleware/
│   ├── authenticate.js      # JWT verification, attaches user to req
│   ├── authorize.js         # Role-based access guard factory
│   ├── error-handler.js     # Global error handler with structured logging
│   └── validate.js          # Generic Joi validation middleware
│
├── modules/
│   ├── auth/                # Authentication (login, register, refresh, logout)
│   │   ├── auth.controller.js
│   │   ├── auth.router.js
│   │   ├── auth.schema.js
│   │   └── auth.service.js
│   │
│   ├── dashboard/           # Analytics (summary, trends, category breakdown)
│   │   ├── dashboard.controller.js
│   │   ├── dashboard.router.js
│   │   └── dashboard.service.js
│   │
│   ├── records/             # Financial records CRUD + restore
│   │   ├── record.controller.js
│   │   ├── record.router.js
│   │   ├── record.schema.js
│   │   └── record.service.js
│   │
│   └── users/               # User management + restore
│       ├── user.controller.js
│       ├── user.router.js
│       ├── user.schema.js
│       └── user.service.js
│
├── utils/
│   ├── app-error.js         # Custom error hierarchy (AppError base class)
│   ├── logger.js            # Pino structured logger
│   └── response.js          # Standardized response helpers
│
└── server.js                # App bootstrap, middleware registration, route mounting
```

---

## Module Pattern

Each feature module follows a consistent **Router → Controller → Service** pattern:

| Layer | Responsibility |
|---|---|
| **Router** | Route definitions, middleware chaining, Swagger annotations |
| **Controller** | Thin HTTP adapter — extracts request data, calls service, sends response |
| **Service** | Pure business logic — database queries, validation rules, computations |
| **Schema** | Joi validation schemas for request payloads and query parameters |

This separation ensures:
- Controllers never touch the database directly
- Services are framework-agnostic and independently testable
- Schemas are reusable across routes

---

## Database Schema

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `email` | TEXT | UNIQUE, NOT NULL |
| `password_hash` | TEXT | NOT NULL |
| `name` | TEXT | NOT NULL |
| `role` | TEXT | CHECK(VIEWER, ANALYST, ADMIN), DEFAULT VIEWER |
| `is_active` | BOOLEAN | DEFAULT 1 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `deleted_at` | DATETIME | NULL (soft delete) |

### `financial_records`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `amount` | REAL | NOT NULL |
| `type` | TEXT | CHECK(INCOME, EXPENSE), NOT NULL |
| `category` | TEXT | NOT NULL |
| `date` | DATETIME | NOT NULL |
| `description` | TEXT | Nullable |
| `user_id` | INTEGER | FK → users(id) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `deleted_at` | DATETIME | NULL (soft delete) |

**Indexes:** `type`, `category`, `date`, `user_id`

### `refresh_tokens`

| Column | Type | Constraints |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `user_id` | INTEGER | FK → users(id) |
| `token` | TEXT | UNIQUE, NOT NULL |
| `expires_at` | DATETIME | NOT NULL |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `_migrations`

| Column | Type | Constraints |
|---|---|---|
| `version` | INTEGER | PRIMARY KEY |
| `name` | TEXT | NOT NULL |
| `applied_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## Authentication Flow

```
1. Login
   POST /api/auth/login { email, password }
        │
        ▼
   Verify credentials (bcrypt.compare)
        │
        ▼
   Generate access token (JWT, 15 min)
   Generate refresh token (random, 7 days, stored in DB)
        │
        ▼
   Return { accessToken, refreshToken, user }

2. Authenticated Request
   GET /api/records
   Authorization: Bearer <accessToken>
        │
        ▼
   authenticate middleware → verify JWT → load user from DB
        │
        ▼
   authorize middleware → check role permissions
        │
        ▼
   Controller → Service → Response

3. Token Refresh
   POST /api/auth/refresh { refreshToken }
        │
        ▼
   Lookup token in DB → verify expiry → check user active
        │
        ▼
   Return new { accessToken }

4. Logout
   POST /api/auth/logout { refreshToken }
        │
        ▼
   Delete refresh token from DB
```

---

## Access Control Matrix

| Endpoint | VIEWER | ANALYST | ADMIN |
|---|---|---|---|
| `POST /api/auth/login` | ✅ | ✅ | ✅ |
| `POST /api/auth/register` | ❌ | ❌ | ✅ |
| `GET /api/users` | ❌ | ❌ | ✅ |
| `PATCH /api/users/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/users/:id` | ❌ | ❌ | ✅ |
| `POST /api/records` | ❌ | ❌ | ✅ |
| `GET /api/records` | ❌ | ✅ | ✅ |
| `PATCH /api/records/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/records/:id` | ❌ | ❌ | ✅ |
| `GET /api/dashboard/summary` | ✅ | ✅ | ✅ |
| `GET /api/dashboard/recent-activity` | ✅ | ✅ | ✅ |
| `GET /api/dashboard/category-breakdown` | ❌ | ✅ | ✅ |
| `GET /api/dashboard/trends` | ❌ | ✅ | ✅ |

---

## Error Handling Strategy

All errors flow through a single global error handler (`middleware/error-handler.js`).

Custom error classes extend a base `AppError`:

```
AppError (base)
├── ValidationError    → 400
├── UnauthorizedError  → 401
├── ForbiddenError     → 403
├── NotFoundError      → 404
└── ConflictError      → 409
```

### Response Format

**Success:**
```json
{
  "status": "success",
  "message": "Record created successfully",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Validation Error: \"amount\" is required"
}
```

**Paginated:**
```json
{
  "status": "success",
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt with 10 salt rounds |
| JWT tokens | Short-lived (15 min) access + DB-backed refresh tokens |
| Token revocation | Refresh tokens deleted on logout; bulk revoke per user |
| SQL injection | Parameterized queries + column allowlists |
| CORS | Origin-locked in production via ALLOWED_ORIGINS |
| Payload limits | 10kb max request body size |
| HTTP headers | Helmet with CSP configuration |
| Rate limiting | 10 attempts per 15 min on login |
| Soft deletes | Data preserved with deleted_at timestamps |
| Admin self-protection | Cannot delete own account |
