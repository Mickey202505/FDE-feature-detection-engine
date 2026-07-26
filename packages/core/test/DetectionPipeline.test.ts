import { describe, expect, it } from "vitest";

import { DetectionPipeline } from "../src/pipeline/DetectionPipeline";

describe("DetectionPipeline", () => {
  it("returns an empty feature list", async () => {
    const pipeline = new DetectionPipeline();

    const result = await pipeline.run({} as never);

  expect(result.geometry).toEqual([]);
expect(result.confidence).toBe(0);
  });
});