import { expect, it } from "vitest";
import { customSpec, hasSubstance, specSummary } from "./custom";

it("rejects a request with nothing to quote against", () => {
  expect(hasSubstance(customSpec.parse({}))).toBe(false);
});

it("accepts a reference photo alone", () => {
  expect(hasSubstance(customSpec.parse({ referenceImages: ["https://example.com/a.webp"] }))).toBe(true);
});

it("rejects a non-http image link and more than five photos", () => {
  expect(customSpec.safeParse({ referenceImages: ["javascript:alert(1)"] }).success).toBe(false);
  expect(customSpec.safeParse({ referenceImages: Array(6).fill("https://example.com/a.webp") }).success).toBe(false);
});

it("summarises the spec as the first chat bubble", () => {
  const text = specSummary(customSpec.parse({ jacketType: "Biker", color: "Oxblood", size: "M", notes: "Slim sleeves" }));
  expect(text.split("\n")).toEqual(["Custom jacket request", "Jacket Type: Biker", "Color: Oxblood", "Size: M", "Notes: Slim sleeves"]);
});
