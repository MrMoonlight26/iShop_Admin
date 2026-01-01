# Orcish Dashboard

## Development setup (database & admin quick-start) ✅

1. Install dependencies:

   npm install

2. Dev DB: The project uses SQLite for development by default (see `.env`).

3. Generate Prisma client & run migrations:

   npx prisma generate
   npx prisma migrate dev --name init

4. Seed the database (creates a sample admin user and unit types):

   node prisma/seed.js

   - Admin credentials (dev): `admin@example.com` / `admin123`
   - Dev quick-auth header: send `x-dev-secret: dev-secret` on admin API requests (temporary, dev-only)

5. Start dev server:

   npm run dev

---

![orcish-dashboard](https://github.com/user-attachments/assets/cb458deb-9ba3-435e-a39c-7f48095c85c8)

## Overview

The Orcish Dashboard is a sleek and modern dashboard built with Shadcn. It features a responsive design with support for both light and dark modes, along with a customizable theme selector that lets you easily switch between different color schemes.

## Getting Started

### Installation

To begin, install the required dependencies using the following command:

```bash
pnpm i
```

# Development Server

After installing the dependencies run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## Admin features (new)

This project includes a production-ready Admin portal for managing units, categories, vendors, shops, customers, and orders. Key features and usage notes:

- Pagination & search on admin list endpoints: `GET /api/admin/users|shops|customers|orders?page=1&limit=20&q=searchTerm` returns `{ data, total, page, limit }`.
- Shops: `GET /api/admin/shops` returns owner info and counts (`_count.shopProducts`, `_count.orders`). Update with `PUT /api/admin/shops` body `{ id, status?, approval? }` (ADMIN-only).
- Users/customers: `GET /api/admin/users` and `GET /api/admin/customers` support `q`, `page`, `limit`. Update status via `PUT /api/admin/users` or `PUT /api/admin/customers` with `{ id, status }`.
- Orders: `GET /api/admin/orders?page=&limit=&status=&shopId=&pinCode=&q=&since=` supports filtering by status, shop, pin, text search and date since (ISO). Returns paginated `{ data, total, page, limit }`.
- Export orders CSV: `GET /api/admin/orders/export` (ADMIN-only) supports same query params and returns `orders.csv`.

### Admin UI

- Customers link available in the Admin menu.
- Lists include search, filters and pagination controls.

### Notes

- Run migrations after updating schema: `npx prisma migrate dev` and `npx prisma generate`.
- Seed with: `node prisma/seed.js` (creates test admin/vendor/customer and sample orders).

If you'd like, I can add cURL examples and tests for these APIs and a short video/gif demonstrating the flows.
