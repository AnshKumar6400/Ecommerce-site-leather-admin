/* One place to rename the shop. Everything user-visible in the admin and in
   transactional email reads from here (or from the matching env vars). */
export const BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "Hidecraft";
export const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3911";
