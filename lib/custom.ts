import { z } from "zod";

/* The structured half of a "Customize" request — what the storefront's
   customize form collects, and what the tailor quotes against. It replaces the
   free-text ISO ("in search of") message the previous shop used: a
   bespoke jacket needs size, material and reference pictures in fields, not
   buried in a chat line. */
const text = (max: number) => z.string().trim().max(max).optional();

export const customSpec = z.object({
  jacketType: text(80),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  material: text(60),
  color: text(60),
  /* A standard size ("M") or "Custom" when measurements are given. */
  size: text(20),
  /* Free text: "chest 40in, shoulder 18in, sleeve 25in, length 27in". */
  measurements: text(600),
  lining: text(80),
  monogram: text(40),
  notes: text(2000),
  referenceImages: z.array(z.string().url().refine((value) => /^https?:\/\//i.test(value), "That image link isn't valid")).max(5).default([]),
});
export type CustomSpec = z.infer<typeof customSpec>;

/* A request with nothing to go on can't be quoted. */
export const hasSubstance = (spec: CustomSpec) => Boolean(spec.jacketType || spec.notes || spec.referenceImages.length);

export const CUSTOM_STAGES = ["NEW", "QUOTED", "CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DECLINED"] as const;

const label = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

/* The first chat bubble for a custom request, so the thread reads on its own
   even in an inbox view that doesn't know about customSpec. */
export function specSummary(spec: CustomSpec): string {
  const lines = (Object.entries(spec) as [string, unknown][])
    .filter(([key, value]) => key !== "referenceImages" && key !== "notes" && typeof value === "string" && value)
    .map(([key, value]) => `${label(key)}: ${value}`);
  if (spec.notes) lines.push(`Notes: ${spec.notes}`);
  return ["Custom jacket request", ...lines].join("\n");
}
