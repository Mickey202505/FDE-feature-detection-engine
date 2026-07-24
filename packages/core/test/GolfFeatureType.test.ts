import { describe, expect, it } from "vitest";
import { GolfFeatureType } from "../../domain/src";

describe("GolfFeatureType", () => {
  it("contains the core golf features", () => {
    expect(GolfFeatureType.TeeBox).toBe("tee-box");
    expect(GolfFeatureType.Green).toBe("green");
    expect(GolfFeatureType.Bunker).toBe("bunker");
  });
});