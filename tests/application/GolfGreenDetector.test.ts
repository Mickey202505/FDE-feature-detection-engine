import { describe, expect, it } from "vitest";
import { GolfGreenDetector } from "../../src/application/opencv/detectors/GolfGreenDetector";
import { FeatureType } from "../../src/domain/FeatureType";
import { WorldPoint } from "../../src/domain/WorldPoint";
import type { OpenCvAdapter } from "../../src/application/opencv/OpenCvAdapter";
import type {
    OpenCvContour,
    OpenCvMat
} from "../../src/application/opencv/OpenCvTypes";

describe("GolfGreenDetector", () => {
    const emptyAdapter: OpenCvAdapter = {
        findContours: () => []
    };

    const image: OpenCvMat = {
        rows: 100,
        cols: 100,
        delete: () => undefined
    };

    it("can be created", () => {
        const detector = new GolfGreenDetector(emptyAdapter);

        expect(detector).toBeDefined();
    });

    it("returns no features when there are no contours", () => {
        const detector = new GolfGreenDetector(emptyAdapter);

        const result = detector.detect({
            image,
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

    it("selects the green containing the supplied seed point", () => {
        const leftGreen: OpenCvContour = {
            points: [
                { x: 10, y: 10 },
                { x: 40, y: 10 },
                { x: 40, y: 40 },
                { x: 10, y: 40 }
            ]
        };

        const rightGreen: OpenCvContour = {
            points: [
                { x: 60, y: 10 },
                { x: 90, y: 10 },
                { x: 90, y: 40 },
                { x: 60, y: 40 }
            ]
        };

        const adapter: OpenCvAdapter = {
            findContours: () => [
                leftGreen,
                rightGreen
            ]
        };

        const detector = new GolfGreenDetector(adapter);

        const result = detector.detect({
            image,
            metresPerPixel: 1,
            seed: {
                x: 75,
                y: 25
            }
        });

        expect(result).toHaveLength(1);

        const selected = result[0];

        expect(selected).toBeDefined();
        expect(selected?.type).toBe(FeatureType.Green);
        expect(selected?.polygon.points).toEqual([
            new WorldPoint(60, 10),
            new WorldPoint(90, 10),
            new WorldPoint(90, 40),
            new WorldPoint(60, 40),
            new WorldPoint(60, 10)
        ]);
    });
});