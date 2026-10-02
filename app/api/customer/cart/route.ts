import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { customerFromRequest } from "@/lib/auth";
import { error } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const input = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(99),
  size: z.string().trim().max(20).default(""),
  color: z.string().trim().max(40).default(""),
  note: z.string().trim().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const cart = await prisma.cart.findUnique({ where: { customerId: session.customerId }, include: { items: { include: { product: true }, orderBy: { id: "asc" } } } });
  return NextResponse.json(cart);
}

export async function POST(request: NextRequest) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);
  const { productId, quantity, size, color, note } = parsed.data;

  const product = await prisma.product.findFirst({ where: { id: productId, visible: true } });
  if (!product) return error("Jacket not found", 404);
  if (product.sizes.length && !size) return error("Choose a size", 400);
  if (product.colors.length && !color) return error("Choose a colour", 400);
  if (size && product.sizes.length && !product.sizes.includes(size)) return error("That size isn't offered", 400);
  if (color && product.colors.length && !product.colors.includes(color)) return error("That colour isn't offered", 400);
  if (!product.madeToOrder && product.stockQuantity < quantity) return error("Not enough stock", 409);

  const cart = await prisma.cart.upsert({ where: { customerId: session.customerId }, create: { customerId: session.customerId }, update: {} });
  const item = await prisma.cartItem.upsert({
    where: { cartId_productId_size_color: { cartId: cart.id, productId: product.id, size, color } },
    create: { cartId: cart.id, productId: product.id, quantity, size, color, note: note ?? null },
    update: { quantity, ...(note !== undefined ? { note } : {}) },
  });
  return NextResponse.json({ ok: true, id: item.id });
}

export async function DELETE(request: NextRequest) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const cart = await prisma.cart.findUnique({ where: { customerId: session.customerId } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return NextResponse.json({ ok: true });
}
