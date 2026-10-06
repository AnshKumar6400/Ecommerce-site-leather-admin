import { expect, it } from "vitest";
import { z } from "zod";
import { MATERIALS, productFields } from "./productInput";

const material = z.object({ material: productFields.material });

it("accepts the nappa types and the accessory leathers", () => {
  for (const value of ["NAPPA LEATHER", "NAPPA SUEDE", "REAL LEATHER", "CRUNCH LEATHER"]) expect(material.safeParse({ material: value }).success).toBe(true);
});

it("rejects a material the shop does not stock", () => {
  expect(material.safeParse({ material: "PU" }).success).toBe(false);
  expect(MATERIALS).toContain("CRUNCH LEATHER");
});

it("allows a one-size product (no sizes) so bags and wallets need no size picker", () => {
  expect(productFields.sizes.safeParse([]).success).toBe(true);
});
