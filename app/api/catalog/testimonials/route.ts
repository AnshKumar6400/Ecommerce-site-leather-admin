import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPublicReview } from "@/lib/reviews";

/* The homepage's testimonial strip: the newest published 4-5 star reviews
   with real text, from real customers. Nothing here is invented — an empty
   shop simply has an empty strip. */
export async function GET() {
  const rows = await prisma.review.findMany({
    where: { status: "PUBLISHED", rating: { gte: 4 }, body: { not: "" }, product: { visible: true } },
    include: { customer: { select: { name: true } }, product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json(rows.map((row) => ({ ...toPublicReview(row), product: row.product.name })).map(({ id, rating, body, author, product }) => ({ id, rating, body, author, product })));
}
