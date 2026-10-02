import type { Prisma, PaymentStatus } from "@prisma/client";
import { totalForItems } from "@/lib/checkout";
import { findActiveCoupon, discountFor, couponErrorMessage } from "@/lib/coupon";

export type OrderPayment = { method: string; note?: string };

export async function pricedCart(client: Prisma.TransactionClient, customerId: string, couponCode?: string) {
  const cart = await client.cart.findUnique({ where: { customerId }, include: { items: { include: { product: true } } } });
  if (!cart?.items.length) throw new Error("CART");
  for (const item of cart.items) {
    if (!item.product.visible) throw new Error("STOCK");
    if (!item.product.madeToOrder && item.product.stockQuantity < item.quantity) throw new Error("STOCK");
    // A size/colour the product doesn't offer can only come from a stale or tampered cart.
    if (item.size && item.product.sizes.length && !item.product.sizes.includes(item.size)) throw new Error("OPTION");
    if (item.color && item.product.colors.length && !item.product.colors.includes(item.color)) throw new Error("OPTION");
  }

  const priced = cart.items.map((item) => ({ productId: item.productId, unitPrice: item.product.price, quantity: item.quantity }));
  const subtotal = totalForItems(priced);

  let discount = 0;
  let appliedCouponCode: string | null = null;
  if (couponCode?.trim()) {
    const coupon = await findActiveCoupon(client, couponCode);
    discount = discountFor(coupon, subtotal);
    appliedCouponCode = coupon.code;
  }

  return { cart, priced, subtotal, discount, total: subtotal - discount, couponCode: appliedCouponCode };
}

export async function createOrderFromCart(
  tx: Prisma.TransactionClient,
  args: { customerId: string; addressId: string; paymentStatus: PaymentStatus; recordPayment?: OrderPayment; couponCode?: string },
) {
  const address = await tx.address.findFirst({ where: { id: args.addressId, customerId: args.customerId } });
  if (!address) throw new Error("ADDRESS");

  const { cart, subtotal, discount, total, couponCode } = await pricedCart(tx, args.customerId, args.couponCode);

  const order = await tx.order.create({
    data: {
      number: `HC-${Date.now().toString().slice(-8)}`,
      customerId: args.customerId,
      subtotal,
      discountCode: couponCode,
      discountAmount: discount,
      total,
      paymentStatus: args.paymentStatus,
      ...(args.recordPayment ? { amountPaid: total } : {}),
      status: "CONFIRMED",
      addressSnapshot: address,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          sku: item.product.sku,
          unitPrice: item.product.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          note: item.note,
        })),
      },
    },
  });

  if (args.recordPayment) await tx.payment.create({ data: { orderId: order.id, amount: total, method: args.recordPayment.method, note: args.recordPayment.note } });
  if (couponCode) await tx.coupon.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } });

  for (const item of cart.items) if (!item.product.madeToOrder) await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity } } });
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  return order;
}

export function checkoutErrorResponse(caught: unknown): { message: string; status: number } {
  const code = caught instanceof Error ? caught.message : "";
  if (code === "STOCK") return { message: "One or more items are no longer available", status: 409 };
  if (code === "OPTION") return { message: "A size or colour in your bag is no longer offered - please re-add that jacket", status: 409 };
  if (code === "CART") return { message: "Your bag is empty", status: 400 };
  if (code === "ADDRESS") return { message: "Delivery address not found", status: 400 };
  const couponMessage = couponErrorMessage(code);
  if (couponMessage) return { message: couponMessage, status: 400 };
  return { message: "Could not place your order", status: 500 };
}
