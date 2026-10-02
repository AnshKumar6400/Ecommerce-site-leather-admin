import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { error, requireAdmin } from "@/lib/api";
import { fullThread, productSummary } from "@/lib/chat";
import { CUSTOM_STAGES } from "@/lib/custom";
import { prisma } from "@/lib/prisma";

/* Status closes/reopens any thread. customStage and quotedPrice (paise) only
   mean something on a CUSTOM request — they are how the tailor moves a
   bespoke jacket from NEW to QUOTED to IN_PRODUCTION. */
const patchInput = z
  .object({
    status: z.enum(["OPEN", "CLOSED"]),
    customStage: z.enum(CUSTOM_STAGES),
    quotedPrice: z.number().int().nonnegative().nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to change" });

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return error("Administrator access required", 401);
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id }, include: { customer: { select: { id: true, name: true, email: true } }, product: productSummary, messages: fullThread } });
  if (!conversation) return error("Conversation not found", 404);
  await prisma.message.updateMany({ where: { conversationId: id, sender: "CUSTOMER", readByAdmin: false }, data: { readByAdmin: true } });
  return NextResponse.json(conversation);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return error("Administrator access required", 401);
  const { id } = await params;
  const parsed = patchInput.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);
  if ((parsed.data.customStage !== undefined || parsed.data.quotedPrice !== undefined)) {
    const existing = await prisma.conversation.findUnique({ where: { id }, select: { kind: true } });
    if (!existing) return error("Conversation not found", 404);
    if (existing.kind !== "CUSTOM") return error("Only a Customize request has a stage or quote", 400);
  }
  try { return NextResponse.json(await prisma.conversation.update({ where: { id }, data: parsed.data })); } catch { return error("Conversation not found", 404); }
}
