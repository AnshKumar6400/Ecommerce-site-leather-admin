import { prisma } from "@/lib/prisma";

export const SETTINGS_ID = "store";

export const publicSettingsSelect = {
  accentColor: true,
  announcementText: true,
  tagline: true,
  supportPhone: true,
  supportEmail: true,
  whatsappUrl: true,
  heroImageUrl: true,
  heroImageMobileUrl: true,
} as const;

export type PublicSettings = {
  accentColor: string;
  announcementText: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  whatsappUrl: string;
  heroImageUrl: string | null;
  heroImageMobileUrl: string | null;
};

export async function getStoreSettings(): Promise<PublicSettings> {
  return prisma.storeSettings.upsert({ where: { id: SETTINGS_ID }, create: { id: SETTINGS_ID }, update: {}, select: publicSettingsSelect });
}

export const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isHexColor = (value: string) => HEX.test(value);
