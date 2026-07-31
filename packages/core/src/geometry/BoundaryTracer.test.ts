import { describe, expect, it } from "vitest";
import { BoundaryTracer } from "./BoundaryTracer";

describe("BoundaryTracer", () => {
  it("traces the boundary of a rectangular mask", () => {
    const mask = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ];

    const tracer = new BoundaryTracer();

    const boundary = tracer.trace(mask);

    expect(boundary).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ]);
  });
});