# Finance Dashboard Backend

A secure, role-based backend API for a finance dashboard, built with Node.js, Express, better-sqlite3 (raw SQL), and Joi for validation.

## Prerequisites

- Node.js (v18+)
- npm

## Setup & Running

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Setup environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Run migrations and seed database:
   \`\`\`bash
   npm run db:migrate
   npm run db:seed
   \`\`\`

4. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Default Seeded Users (Password: `password123`)

- Admin: `admin@example.com`
- Analyst: `analyst@example.com`
- Viewer: `viewer@example.com`

## Core Features Implemented

1. **User and Role Management**: Roles (ADMIN, ANALYST, VIEWER) restrict endpoint access.
2. **Financial Records Management**: CRUD for income/expenses with pagination and filtering.
3. **Dashboard Summary APIs**: Endpoints for totals, category breakdowns, trends, and recent activity.
4. **Access Control**: Guards against unauthorized access via JWT and Role verifications.
5. **Validation and Error Handling**: Used `Joi` for input validation and structured global error handling.
6. **Data Persistence**: `better-sqlite3` is used with raw SQL queries for efficiency and direct database control.

## Documentation

Once the server is running, visit `http://localhost:3000/api/docs` to view the Swagger UI.

## Assumptions & Decisions

- No ORM was used directly to demonstrate proficiency in raw SQL queries and schema design.
- Soft deletes are implemented using a `deleted_at` column across both users and financial_records to ensure data is not permanently lost.
- Axios is not included since this application serves data as an API and does not need an HTTP client for consuming external endpoints.
