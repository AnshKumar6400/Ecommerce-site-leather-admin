import { z } from "zod";

export const GENDERS = ["MEN", "WOMEN", "UNISEX"] as const;
export const MATERIALS = ["NAPPA LEATHER", "NAPPA SUEDE", "NAPPA LEATHER & SUEDE"] as const;

const names = (max: number) => z.array(z.string().trim().min(1).max(max)).max(24);

/* Fields shared by create (POST) and update (PATCH). Money is in paise. */
export const productFields = {
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  price: z.number().int().nonnegative(),
  cost: z.number().int().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  categoryId: z.string(),
  visible: z.boolean(),
  featured: z.boolean(),
  bestseller: z.boolean(),
  madeToOrder: z.boolean(),
  material: z.enum(MATERIALS),
  gender: z.enum(GENDERS),
  colors: names(40),
  sizes: names(20),
  images: z.array(z.string().url()),
};
