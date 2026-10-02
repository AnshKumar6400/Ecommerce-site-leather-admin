import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* Every visible category, including ones with no jackets yet (Wallets, Belts…),
   so the storefront can show their pages and menu entries before stock exists. */
export async function GET() {
  const categories = await prisma.category.findMany({
    where: { visible: true },
    select: { name: true, slug: true, imageUrl: true, description: true, _count: { select: { products: { where: { visible: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(categories.map(({ _count, ...category }) => ({ ...category, productCount: _count.products })));
}
