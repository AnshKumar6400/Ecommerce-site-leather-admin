import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customerFromRequest } from "@/lib/auth";
import { error } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const itemInclude = { product: { include: { category: true } } } as const;
const input = z.object({ productId: z.string() });

async function ownedWishlist(customerId: string) { return prisma.wishlist.upsert({ where: { customerId }, create: { customerId }, update: {} }); }

export async function GET(request: NextRequest) { const session = await customerFromRequest(request); if (!session) return error("Sign in required", 401); const wishlist = await ownedWishlist(session.customerId); return NextResponse.json(await prisma.wishlist.findUnique({ where: { id: wishlist.id }, include: { items: { include: itemInclude, orderBy: { createdAt: "desc" } } } })); }

export async function POST(request: NextRequest) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return error("Choose a jacket to save", 400);
  const { productId } = parsed.data;
  if (!(await prisma.product.findFirst({ where: { id: productId, visible: true } }))) return error("Jacket not found", 404);
  const wishlist = await ownedWishlist(session.customerId);
  const existing = await prisma.wishlistItem.findFirst({ where: { wishlistId: wishlist.id, productId } });
  if (existing) return NextResponse.json({ ok: true, id: existing.id });
  const created = await prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  return NextResponse.json({ ok: true, id: created.id });
}
