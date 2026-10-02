import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { error, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { productFields } from "@/lib/productInput";
import { revalidateStorefront } from "@/lib/revalidateStorefront";

const productUpdate = z.object({
  ...Object.fromEntries(Object.entries(productFields).map(([key, schema]) => [key, schema.optional()])),
  sku: z.string().min(2).optional(),
  compareAtPrice: z.number().int().nonnegative().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  hoverImageUrl: z.string().url().nullable().optional(),
}).partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return error("Administrator access required", 401);
  const { id } = await params;
  const parsed = productUpdate.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);
  try {
    const updated = await prisma.product.update({ where: { id }, data: parsed.data });
    revalidateStorefront();
    return NextResponse.json(updated);
  } catch { return error("Jacket not found or SKU/slug already in use", 409); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return error("Administrator access required", 401);
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    revalidateStorefront();
    return NextResponse.json({ ok: true });
  } catch { return error("Jacket not found or still referenced by an order", 409); }
}
