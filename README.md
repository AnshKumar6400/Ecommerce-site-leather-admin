# Malhotra Leather House — Admin

The commerce authority for the Malhotra Leather House store: jackets, categories, orders, customers, coupons, reviews, and **Customize requests** (bespoke jackets). The storefront lives in `Ecommerce-site-leather`.

Forked from the collectibles admin (`Ecommerce-site-admin`) — same architecture (Next.js 15 + Prisma/Postgres + Razorpay + Supabase Storage), re-modelled for jackets.

## What changed from the collectibles admin

| Collectibles | Leather |
| --- | --- |
| Franchise / character / edition / variant / condition / preorder | `material` (Nappa Leather / Suede), `gender`, `colors[]`, `sizes[]`, `madeToOrder` |
| Bundles ("Collections") | Removed — Devoted-style "collections" are just categories |
| Cart line = product | Cart line = product + **size** + **colour** + tailor note |
| 3D hero box / paint studio | Hero image + announcement bar + contact details (Settings) |
| **ISO** ("in search of") chat | **Customize**: structured bespoke request (type, material, colour, size/measurements, lining, monogram, notes, up to 5 reference photos) with a stage (New → Quoted → Confirmed → In production → Shipped) and a quote, over the same chat thread |

## Run locally

1. `cp .env.example .env` and set `AUTH_SECRET` and `ADMIN_API_KEY`.
2. `npm run db:up` (Postgres in Docker, port 5435) — or point `DATABASE_URL`/`DIRECT_URL` at any Postgres.
3. `npm install && npx prisma migrate deploy && npm run db:seed`.
4. `npm run dev` → http://localhost:3910 (sign in at `/admin/login`).

Public catalog: `/api/catalog/products`, `/api/catalog/products/[slug]`, `/api/catalog/settings`. Admin mutations need the `x-admin-key` header or an admin session. Customer session cookies are HTTP-only (`SameSite=None; Secure` in production, since storefront and admin sit on different origins).

## Customize flow

1. Customer fills the storefront's Customize form → `POST /api/customer/custom-requests` (spec validated in `lib/custom.ts`). A `CUSTOM` conversation is created; its first chat bubble is a readable summary and each reference photo is its own bubble.
2. Admin opens **Customize requests**, reads the spec card, chats, sets a **Quote** (₹) and **Stage** (`PATCH /api/admin/conversations/[id]`).
3. Once agreed, raise the order from **Orders → Manual order** (per-line size, colour and the agreed price are supported) and move the request to *Confirmed → In production → Shipped*.

## Tests

`npm test` (Vitest) · `npx tsc --noEmit`.
