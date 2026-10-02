import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customerFromRequest } from "@/lib/auth";
import { error } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const input = z.object({ quantity: z.number().int().min(1).max(99).optional(), note: z.string().trim().max(500).nullable().optional() });

/* Cart lines are addressed by their own id, not by product: the same jacket in
   two sizes is two lines. Ownership is checked through the cart. */
async function ownedItem(customerId: string, itemId: string) {
  return prisma.cartItem.findFirst({ where: { id: itemId, cart: { customerId } }, include: { product: true } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const { itemId } = await params;
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return error("Enter a valid quantity", 400);
  const item = await ownedItem(session.customerId, itemId);
  if (!item) return error("Item not in your bag", 404);
  const { quantity, note } = parsed.data;
  if (quantity !== undefined && !item.product.madeToOrder && item.product.stockQuantity < quantity) return error("Not enough stock", 409);
  return NextResponse.json(await prisma.cartItem.update({ where: { id: itemId }, data: { ...(quantity !== undefined ? { quantity } : {}), ...(note !== undefined ? { note } : {}) } }));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const { itemId } = await params;
  const { count } = await prisma.cartItem.deleteMany({ where: { id: itemId, cart: { customerId: session.customerId } } });
  if (count === 0) return error("Item not in your bag", 404);
  return NextResponse.json({ ok: true });
}
