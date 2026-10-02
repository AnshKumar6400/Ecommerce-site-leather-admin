import { NextRequest, NextResponse } from "next/server";
import { customerFromRequest } from "@/lib/auth";
import { error } from "@/lib/api";
import { customStart, fullThread, productSummary } from "@/lib/chat";
import { specSummary } from "@/lib/custom";
import { prisma } from "@/lib/prisma";

/* "Customize": the bespoke-jacket request. It opens an ordinary chat thread
   (so replies, photos and the unread badge all work as they do everywhere
   else) but tags it CUSTOM and stores the structured spec on the conversation
   for the admin to quote against. */
export async function POST(request: NextRequest) {
  const session = await customerFromRequest(request);
  if (!session) return error("Sign in required", 401);
  const parsed = customStart.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);
  const { spec, productId } = parsed.data;
  if (productId && !(await prisma.product.findFirst({ where: { id: productId, visible: true } }))) return error("Jacket not found", 404);

  const [firstImage, ...otherImages] = spec.referenceImages;
  const conversation = await prisma.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: { customerId: session.customerId, productId: productId ?? null, kind: "CUSTOM", customSpec: spec, customStage: "NEW" },
    });
    await tx.message.create({ data: { conversationId: created.id, sender: "CUSTOMER", body: specSummary(spec), imageUrl: firstImage ?? null } });
    // One bubble per extra reference photo, so each opens full-size in the thread.
    for (const imageUrl of otherImages) await tx.message.create({ data: { conversationId: created.id, sender: "CUSTOMER", body: "", imageUrl } });
    const last = await tx.message.findFirst({ where: { conversationId: created.id }, orderBy: { createdAt: "desc" } });
    return tx.conversation.update({ where: { id: created.id }, data: { lastMessageAt: last?.createdAt ?? new Date() }, include: { product: productSummary, messages: fullThread } });
  });
  return NextResponse.json(conversation, { status: 201 });
}
