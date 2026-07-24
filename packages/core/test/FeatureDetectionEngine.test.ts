import { describe, expect, it } from "vitest";
import { FeatureDetectionEngine } from "../src";

describe("FeatureDetectionEngine", () => {
  it("can be created", () => {
    const engine = new FeatureDetectionEngine();

    expect(engine).toBeDefined();
  });
});