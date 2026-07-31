import { describe, expect, it } from "vitest";
import { DetectionPipeline } from "./DetectionPipeline";
import { ImageData } from "../image/ImageData";

describe("DetectionPipeline", () => {
  it("runs the GreenDetector", () => {
    const pipeline = new DetectionPipeline();

    const image = new ImageData([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ]);

    const result = pipeline.run(image);

    expect(result).toHaveLength(1);
  });
});