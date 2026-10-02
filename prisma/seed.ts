import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* Demo catalogue so a fresh database has something to show. Prices are in
   paise. Photos are deliberately left empty: the storefront draws a jacket
   placeholder until real photography is uploaded from the admin. */
const CATEGORIES = [
  { key: "leather", name: "Pure Leather Jackets", slug: "pure-leather-jackets", description: "Full-grain nappa leather jackets, handcrafted to last." },
  { key: "suede", name: "Pure Suede Jackets", slug: "pure-suede-jackets", description: "Soft nappa suede, cut sharp." },
  { key: "coats", name: "Pure Leather & Suede Coats", slug: "pure-leather-suede-coats", description: "Longer lines for colder days." },
] as const;
type CategoryKey = (typeof CATEGORIES)[number]["key"];

const BLACK_BROWN = ["Black", "Brown"];
const WIDE = ["Black", "Brown", "Tan", "Green", "Blue"];

type Seed = { sku: string; slug: string; name: string; category: CategoryKey; gender: "MEN" | "WOMEN"; material: string; price: number; colors: string[]; featured?: boolean; bestseller?: boolean; description: string };

const rupees = (value: number) => value * 100;
const copy = "Handcrafted in pure nappa, lined and finished by hand. Inner pockets on both sides, 7 day easy exchange, lifetime warranty on the leather.";

const PRODUCTS: Seed[] = [
  { sku: "MARLOW-1", slug: "marlow-jacket", name: "Marlow Jacket", category: "leather", gender: "MEN", material: "NAPPA LEATHER", price: rupees(16898), colors: BLACK_BROWN, featured: true, bestseller: true, description: `A clean four-pocket biker silhouette. ${copy}` },
  { sku: "HARLAN-1", slug: "harlan-jacket", name: "Harlan Jacket", category: "leather", gender: "MEN", material: "NAPPA LEATHER", price: rupees(16898), colors: WIDE, featured: true, description: `A café-racer cut with a snap collar. ${copy}` },
  { sku: "DUTTON-1", slug: "dutton-jacket", name: "Dutton Jacket", category: "leather", gender: "MEN", material: "NAPPA LEATHER", price: rupees(17898), colors: ["Brown", "Black", "Chocolate"], bestseller: true, description: `A relaxed trucker with a shearling-style collar. ${copy}` },
  { sku: "ROWAN-1", slug: "rowan-bomber", name: "Rowan Bomber", category: "leather", gender: "MEN", material: "NAPPA LEATHER", price: rupees(16898), colors: ["Black", "Tan"], featured: true, description: `A flight-style bomber with ribbed cuffs. ${copy}` },
  { sku: "SABLE-1", slug: "sable-blazer", name: "Sable Blazer", category: "leather", gender: "MEN", material: "NAPPA LEATHER", price: rupees(18898), colors: ["Black", "Chocolate", "Blue"], bestseller: true, description: `A tailored single-breasted blazer in leather. ${copy}` },
  { sku: "CALDER-1", slug: "calder-suede-jacket", name: "Calder Suede Jacket", category: "suede", gender: "MEN", material: "NAPPA SUEDE", price: rupees(16898), colors: ["Tan", "Brown", "Black"], featured: true, bestseller: true, description: `A soft suede trucker. ${copy}` },
  { sku: "BRIAR-1", slug: "briar-suede-bomber", name: "Briar Suede Bomber", category: "suede", gender: "MEN", material: "NAPPA SUEDE", price: rupees(16898), colors: ["Tan", "Black"], featured: true, description: `A suede bomber with a ribbed collar. ${copy}` },
  { sku: "TUCKER-1", slug: "tucker-suede-jacket", name: "Tucker Suede Jacket", category: "suede", gender: "MEN", material: "NAPPA SUEDE", price: rupees(16898), colors: ["Brown", "Green", "Tan"], bestseller: true, description: `A utility-pocket suede jacket. ${copy}` },
  { sku: "ASHER-1", slug: "asher-long-coat", name: "Asher Long Coat", category: "coats", gender: "MEN", material: "NAPPA LEATHER", price: rupees(19898), colors: ["Black", "Brown"], featured: true, bestseller: true, description: `A knee-length leather overcoat. ${copy}` },
  { sku: "NORTH-1", slug: "north-suede-coat", name: "North Suede Coat", category: "coats", gender: "MEN", material: "NAPPA SUEDE", price: rupees(19898), colors: ["Black", "Tan", "Brown"], bestseller: true, description: `A suede coat with a faux-fur-lined collar. ${copy}` },
  { sku: "VESPER-1", slug: "vesper-jacket", name: "Vesper Jacket", category: "leather", gender: "WOMEN", material: "NAPPA LEATHER", price: rupees(16898), colors: ["Black", "Red", "White"], featured: true, bestseller: true, description: `A cropped moto jacket with asymmetric zip. ${copy}` },
  { sku: "ELLIS-1", slug: "ellis-blazer", name: "Ellis Blazer", category: "leather", gender: "WOMEN", material: "NAPPA LEATHER", price: rupees(16898), colors: ["Black", "Chocolate"], description: `A nipped-waist leather blazer. ${copy}` },
  { sku: "WREN-1", slug: "wren-suede-jacket", name: "Wren Suede Jacket", category: "suede", gender: "WOMEN", material: "NAPPA SUEDE", price: rupees(16898), colors: ["Tan", "Brown"], featured: true, description: `A soft suede jacket with a relaxed shoulder. ${copy}` },
  { sku: "IVY-1", slug: "ivy-suede-bomber", name: "Ivy Suede Bomber", category: "suede", gender: "WOMEN", material: "NAPPA SUEDE", price: rupees(16898), colors: ["Tan", "Black"], bestseller: true, description: `A cropped suede bomber. ${copy}` },
  { sku: "LENNOX-1", slug: "lennox-coat", name: "Lennox Coat", category: "coats", gender: "WOMEN", material: "NAPPA LEATHER", price: rupees(19898), colors: ["Black", "Brown", "White"], featured: true, description: `A belted leather trench. ${copy}` },
  { sku: "SIENNA-1", slug: "sienna-suede-coat", name: "Sienna Suede Coat", category: "coats", gender: "WOMEN", material: "NAPPA SUEDE", price: rupees(19898), colors: ["Tan", "Brown"], bestseller: true, description: `A long suede coat with a wide collar. ${copy}` },
];

async function main() {
  const categoryIds = new Map<CategoryKey, string>();
  for (const category of CATEGORIES) {
    const data = { name: category.name, slug: category.slug, description: category.description };
    const row = await prisma.category.upsert({ where: { slug: category.slug }, update: data, create: data });
    categoryIds.set(category.key, row.id);
  }

  for (const { category, ...product } of PRODUCTS) {
    const data = { ...product, categoryId: categoryIds.get(category)!, cost: Math.round(product.price * 0.45), stockQuantity: 0, madeToOrder: true, featured: product.featured ?? false, bestseller: product.bestseller ?? false };
    await prisma.product.upsert({ where: { sku: product.sku }, update: data, create: data });
  }

  await prisma.customer.upsert({
    where: { email: "demo@hidecraft.example" },
    update: {},
    create: { name: "Demo Customer", email: "demo@hidecraft.example", passwordHash: await bcrypt.hash("demo-password", 12), cart: { create: {} } },
  });
}

main().finally(() => prisma.$disconnect());
