# Finance Data Processing and Access Control Backend

A production-grade RESTful API for managing financial records, user roles, and dashboard analytics — built with **Node.js**, **Express**, **SQLite**, and **JWT authentication**.

---

## Features

- **Role-Based Access Control** — Three-tier permission system (Admin, Analyst, Viewer)
- **Financial Records CRUD** — Create, read, update, soft-delete, and restore transactions
- **Dashboard Analytics** — Income/expense summaries, category breakdowns, monthly trends
- **JWT Authentication** — Short-lived access tokens (15 min) + refresh token rotation (7 days)
- **Input Validation** — Schema-strict payload validation on every endpoint via Joi
- **Soft Deletes** — Data is never permanently lost; restore endpoints available
- **Structured Logging** — Pino logger with pretty dev output and JSON production logs
- **API Documentation** — Auto-generated Swagger UI at `/api/docs`
- **Rate Limiting** — Brute-force protection on login endpoint
- **Versioned Migrations** — Tracked, idempotent database schema changes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (>=18) + JavaScript ES Modules |
| Framework | Express.js |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | Joi |
| Logging | Pino + pino-http |
| API Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Security | Helmet, CORS, express-rate-limit |

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd finance-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

### Database Setup

```bash
# Run migrations (creates tables)
npm run db:migrate

# Seed sample data
npm run db:seed
```

### Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000` by default.

---

## Default Seeded Users

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `password123` | ADMIN |
| `analyst@example.com` | `password123` | ANALYST |
| `viewer@example.com` | `password123` | VIEWER |

---

## API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login, receive access + refresh tokens |
| `POST` | `/api/auth/register` | Admin | Create a new user account |
| `POST` | `/api/auth/refresh` | Public | Refresh an expired access token |
| `POST` | `/api/auth/logout` | Public | Revoke a refresh token |

### User Management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all users |
| `GET` | `/api/users/:id` | Admin | Get user by ID |
| `PATCH` | `/api/users/:id` | Admin | Update user role or status |
| `DELETE` | `/api/users/:id` | Admin | Soft delete a user |
| `PATCH` | `/api/users/:id/restore` | Admin | Restore a soft-deleted user |

### Financial Records

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/records` | Admin | Create a financial record |
| `GET` | `/api/records` | Admin, Analyst | List records (filter, paginate, search) |
| `GET` | `/api/records/:id` | Admin, Analyst | Get a single record |
| `PATCH` | `/api/records/:id` | Admin | Update a record |
| `DELETE` | `/api/records/:id` | Admin | Soft delete a record |
| `PATCH` | `/api/records/:id/restore` | Admin | Restore a soft-deleted record |

### Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | All authenticated | Income, expense, net balance |
| `GET` | `/api/dashboard/recent-activity` | All authenticated | Recent N transactions |
| `GET` | `/api/dashboard/category-breakdown` | Admin, Analyst | Category-wise totals |
| `GET` | `/api/dashboard/trends` | Admin, Analyst | Monthly income/expense trends |

### Health Check

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Server status |

---

## Interactive API Documentation

Once the server is running, visit:

```
http://localhost:3000/api/docs
```

Use the **Authorize** button to paste your JWT Bearer token and test endpoints directly.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | No | `finance.db` | SQLite database file path |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWTs |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |
| `ALLOWED_ORIGINS` | No | `localhost` | Comma-separated CORS origins (production) |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed sample data |
| `npm test` | Run tests (Jest) |

---

## Assumptions & Design Decisions

1. **SQLite with raw SQL** was chosen over an ORM to demonstrate direct SQL proficiency and schema design.
2. **Soft deletes** are implemented using `deleted_at` timestamps — data is never permanently destroyed. Dedicated restore endpoints exist for recovery.
3. **Access tokens expire in 15 minutes** with a 7-day refresh token flow stored in the database, enabling secure token revocation.
4. **No external HTTP client** (e.g., axios) is needed since this is a pure API server.
5. **Versioned migrations** are tracked in a `_migrations` table to ensure schema changes are idempotent and auditable.
6. **Admin self-deletion is blocked** to prevent accidental system lockout.

---

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of the project's architecture and module design.

---

## License

This project is for evaluation purposes.
