import { describe, expect, it } from "vitest";

import type { Geometry } from "../../domain/src";

describe("Geometry", () => {
  it("stores a collection of points", () => {
    const geometry: Geometry = {
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    };

    expect(geometry.points).toHaveLength(2);
    expect(geometry.points[0]).toEqual({ x: 10, y: 20 });
    expect(geometry.points[1]).toEqual({ x: 30, y: 40 });
  });
});