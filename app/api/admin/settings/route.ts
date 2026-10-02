import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { error, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getStoreSettings, isHexColor, publicSettingsSelect, SETTINGS_ID } from "@/lib/storeSettings";
import { revalidateStorefront } from "@/lib/revalidateStorefront";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return error("Administrator access required", 401);
  return NextResponse.json(await getStoreSettings());
}

const input = z.object({
  accentColor: z.string().refine(isHexColor, "Enter a colour as a hex value, like #FFFFFF").optional(),
  announcementText: z.string().max(200).optional(),
  tagline: z.string().max(80).optional(),
  supportPhone: z.string().max(40).optional(),
  supportEmail: z.string().max(120).optional(),
  whatsappUrl: z.string().max(300).optional(),
  heroImageUrl: z.string().url().nullable().optional(),
  heroImageMobileUrl: z.string().url().nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) return error("Administrator access required", 401);
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);

  const saved = await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...parsed.data },
    update: parsed.data,
    select: publicSettingsSelect,
  });
  revalidateStorefront();
  return NextResponse.json(saved);
}
