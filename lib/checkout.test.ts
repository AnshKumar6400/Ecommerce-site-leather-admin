import { expect, it } from "vitest";
import { totalForItems } from "./checkout";

it("calculates a checkout total from item snapshots", () => expect(totalForItems([{ unitPrice: 1689800, quantity: 1 }, { unitPrice: 459900, quantity: 2 }])).toBe(2609600));
it("is zero for an empty bag", () => expect(totalForItems([])).toBe(0));
