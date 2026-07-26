import { describe, expect, it } from "vitest";

import { PolygonBuilder } from "../src/pipeline/PolygonBuilder";

describe("PolygonBuilder", () => {
  it("creates an empty polygon", () => {
    const builder = new PolygonBuilder();

    const geometry = builder.build({} as never);

    expect(geometry.points).toEqual([]);
  });
});