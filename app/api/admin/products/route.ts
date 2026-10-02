import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { error, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { productFields } from "@/lib/productInput";
import { revalidateStorefront } from "@/lib/revalidateStorefront";

const productInput = z.object({
  ...productFields,
  compareAtPrice: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  hoverImageUrl: z.string().url().optional(),
  visible: productFields.visible.default(true),
  featured: productFields.featured.optional(),
  bestseller: productFields.bestseller.optional(),
  madeToOrder: productFields.madeToOrder.optional(),
  material: productFields.material.optional(),
  gender: productFields.gender.optional(),
  colors: productFields.colors.optional(),
  sizes: productFields.sizes.optional(),
  images: productFields.images.default([]),
});

function skuPrefix(name: string): string {
  const word = name.trim().split(/\s+/)[0]?.toUpperCase().replace(/[^A-Z0-9]/g, "") ?? "";
  return word || "SKU";
}

async function nextSku(name: string): Promise<string> {
  const prefix = skuPrefix(name);
  const existing = await prisma.product.count({ where: { sku: { startsWith: `${prefix}-` } } });
  return `${prefix}-${existing + 1}`;
}

export async function GET(request: NextRequest) { if (!(await requireAdmin(request))) return error("Administrator access required", 401); return NextResponse.json(await prisma.product.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } })); }

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) return error("Administrator access required", 401);
  const parsed = productInput.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);

  for (let attempt = 0; attempt < 5; attempt++) {
    const sku = await nextSku(parsed.data.name);
    try {
      const created = await prisma.product.create({ data: { ...parsed.data, sku } });
      revalidateStorefront();
      return NextResponse.json(created, { status: 201 });
    } catch (cause) {
      const collided = cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002";
      if (collided && (cause.meta?.target as string[] | undefined)?.includes("sku")) continue;
      return error(collided ? "Slug must be unique" : "Could not create that jacket", 409);
    }
  }
  return error("Could not generate a unique SKU — try again", 409);
}
