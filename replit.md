# بذور Seeds Store — Workspace

## Overview

Full-stack premium Arabic/English e-commerce website for seeds and plants in Jordan.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **File upload**: Multer + Cloudinary (falls back to base64 if not configured)
- **Payments**: Stripe (optional — configurable via secrets)
- **SMS**: Twilio (optional — configurable via secrets)
- **i18n**: Custom i18n context with Arabic (RTL) / English (LTR) toggle

## Structure

```
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── bazour-store/       # React + Vite frontend (at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Features

### Store Features
- Homepage with hero, featured products, categories, offers section
- Product listing with search, filters (category, price, on-sale), sort
- Product detail page with image gallery, add-to-cart
- Cart drawer (slide-in)
- Checkout with shipping address, shipping zone selector, Stripe or Cash on Delivery
- Order history and tracking
- Arabic RTL + English LTR full toggle

### Admin Dashboard
- Products CRUD with image upload + Excel bulk import
- Categories CRUD
- Orders with status management
- Users list
- Shipping zones (Jordan: Amman, Zarqa, Irbid, Aqaba, etc.)
- Offers/coupon codes
- Store settings

## Database Tables

- `users` — customers + admins (role: admin/customer)
- `categories` — product categories (Arabic + English names)
- `products` — full product data with images array, pricing, SEO
- `orders` — order with JSONB items and shipping address
- `cart_items` — per-user cart
- `shipping_zones` — Jordan shipping areas with prices
- `offers` — coupon/discount codes
- `settings` — store configuration singleton

## Default Credentials

- **Admin**: `admin@bazour.jo` / `admin123`
- **Admin role**: Set via SQL after first registration

## Environment Variables (Optional)

- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image uploads
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS notifications

## API Endpoints

All API routes at `/api/*`:
- `GET/POST /auth/register|login|me`
- `GET/POST/PUT/DELETE /products`
- `GET/POST/PUT/DELETE /categories`
- `GET/POST/PUT/DELETE /cart|cart/:productId`
- `GET/POST /orders`, `PUT /orders/:id/status`
- `POST /payments/stripe/create-intent`, `POST /payments/stripe/webhook`
- `GET/PUT/DELETE /shipping`, `GET/POST/PUT /offers`
- `POST /upload/image`, `POST /upload/bulk`
- `GET/PUT /settings`
