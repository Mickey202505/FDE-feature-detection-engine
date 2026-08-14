import { describe, expect, it } from "vitest";
import { GolfGreenDetector } from "../../src/application/detectors/GolfGreenDetector";
import { FeatureType } from "../../src/domain/FeatureType";
import { WorldPoint } from "../../src/domain/WorldPoint";
import type { OpenCvAdapter } from "../../src/application/opencv/OpenCvAdapter";

describe("GolfGreenDetector", () => {
    const emptyAdapter: OpenCvAdapter = {
        findContours: () => []
    };

    it("can be created", () => {
        const detector = new GolfGreenDetector(emptyAdapter);

        expect(detector).toBeDefined();
    });

    it("returns no features when there are no contours", () => {
        const detector = new GolfGreenDetector(emptyAdapter);

        const result = detector.detect({
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1
        });

        expect(result).toEqual([]);
    });

    it("creates a golf green feature from points", () => {
        const result = GolfGreenDetector.fromPoints(
            [
                new WorldPoint(0, 0),
                new WorldPoint(10, 0),
                new WorldPoint(10, 5)
            ],
            0.92
        );

        expect(result.type).toBe(FeatureType.Green);
        expect(result.confidence).toBe(0.92);
    });
});