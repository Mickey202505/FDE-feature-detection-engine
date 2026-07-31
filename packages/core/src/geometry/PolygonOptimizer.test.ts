import { describe, expect, it } from "vitest";
import { PolygonOptimizer } from "./PolygonOptimizer";

describe("PolygonOptimizer", () => {
  it("returns the same polygon when no optimisation is needed", () => {
    const polygon = [
      { x: 1, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 4 },
      { x: 1, y: 4 },
    ];

    const optimizer = new PolygonOptimizer();

    expect(optimizer.optimize(polygon)).toEqual(polygon);
  });
});