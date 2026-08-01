import { describe, expect, it } from "vitest";
import { GeometryMapper } from "./GeometryMapper";

describe("GeometryMapper", () => {
  it("returns an empty geometry collection when given no polygons", () => {
    const mapper = new GeometryMapper();

    expect(mapper.map([])).toEqual([]);
  });
});