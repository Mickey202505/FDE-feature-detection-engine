import { describe, expect, it } from "vitest";
import { DetectionPipeline } from "../../src/application/pipeline/DetectionPipeline";
import type { FeatureDetector } from "../../src/application/detectors/FeatureDetector";
import { FeatureType } from "../../src/domain/FeatureType";

describe("DetectionPipeline", () => {
    it("runs all detectors", () => {
        const detector: FeatureDetector = {
            detect: () => []
        };

        const pipeline = new DetectionPipeline([detector]);

        const result = pipeline.detect({
            featureType: FeatureType.Green,
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1
        });

        expect(result).toEqual([]);
    });
});