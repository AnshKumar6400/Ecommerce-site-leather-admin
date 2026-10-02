import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: {
    cartItem: {
      findFirst: vi.fn().mockResolvedValue({ id: "ci1", product: { id: "prod1", madeToOrder: false, stockQuantity: 10 } }),
      update: vi.fn().mockResolvedValue({ id: "ci1", quantity: 3 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));
vi.mock("@/lib/auth", () => ({ customerFromRequest: vi.fn().mockResolvedValue({ customerId: "cust1", email: "a@b.com" }) }));
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH, DELETE } from "./route";

const params = { params: Promise.resolve({ itemId: "ci1" }) };
const patch = (quantity: number) => PATCH(new NextRequest("http://localhost/api/customer/cart/ci1", { method: "PATCH", body: JSON.stringify({ quantity }) }), params);

beforeEach(() => vi.clearAllMocks());

it("updates a cart line's quantity", async () => {
  expect((await patch(3)).status).toBe(200);
});

it("rejects a quantity above stock for a ready-made jacket", async () => {
  vi.mocked(prisma.cartItem.findFirst).mockResolvedValueOnce({ id: "ci1", product: { madeToOrder: false, stockQuantity: 1 } } as never);
  expect((await patch(3)).status).toBe(409);
  expect(prisma.cartItem.update).not.toHaveBeenCalled();
});

it("does not enforce stock on a made-to-order jacket", async () => {
  vi.mocked(prisma.cartItem.findFirst).mockResolvedValueOnce({ id: "ci1", product: { madeToOrder: true, stockQuantity: 0 } } as never);
  expect((await patch(3)).status).toBe(200);
});

it("404s for a line that isn't in the caller's bag", async () => {
  vi.mocked(prisma.cartItem.findFirst).mockResolvedValueOnce(null);
  expect((await patch(2)).status).toBe(404);
});

it("removes a cart line", async () => {
  const response = await DELETE(new NextRequest("http://localhost/api/customer/cart/ci1", { method: "DELETE" }), params);
  expect(response.status).toBe(200);
});
