import type { Prisma } from "@prisma/client";

export const publicProductSelect = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  description: true,
  price: true,
  compareAtPrice: true,
  stockQuantity: true,
  imageUrl: true,
  hoverImageUrl: true,
  images: true,
  featured: true,
  bestseller: true,
  material: true,
  gender: true,
  colors: true,
  sizes: true,
  madeToOrder: true,
  updatedAt: true,
  category: { select: { name: true, slug: true, imageUrl: true, description: true } },
} satisfies Prisma.ProductSelect;
