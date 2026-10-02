"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GolfGreenDetector_1 = require("../../src/application/detectors/GolfGreenDetector");
const FeatureType_1 = require("../../src/domain/FeatureType");
const WorldPoint_1 = require("../../src/domain/WorldPoint");
(0, vitest_1.describe)("GolfGreenDetector", () => {
    const emptyAdapter = {
        findContours: () => [],
        detectGreenBoundary: () => [],
        detectBunkerBoundary: () => []
    };
    const image = {
        rows: 100,
        cols: 100,
        delete: () => undefined
    };
    (0, vitest_1.it)("can be created", () => {
        const detector = new GolfGreenDetector_1.GolfGreenDetector(emptyAdapter);
        (0, vitest_1.expect)(detector).toBeDefined();
    });
    (0, vitest_1.it)("returns no features when there are no contours", () => {
        const detector = new GolfGreenDetector_1.GolfGreenDetector(emptyAdapter);
        const result = detector.detect({
            featureType: FeatureType_1.FeatureType.Green,
            image,
            metresPerPixel: 0.1
        });
        (0, vitest_1.expect)(result).toEqual([]);
    });
    (0, vitest_1.it)("creates a golf green feature from points", () => {
        const result = GolfGreenDetector_1.GolfGreenDetector.fromPoints([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 5)
        ], 0.92);
        (0, vitest_1.expect)(result.type).toBe(FeatureType_1.FeatureType.Green);
        (0, vitest_1.expect)(result.confidence).toBe(0.92);
    });
    (0, vitest_1.it)("converts contour pixels into world coordinates", () => {
        const contour = {
            points: [
                { x: 10, y: 20 },
                { x: 30, y: 20 },
                { x: 30, y: 40 }
            ]
        };
        const adapter = {
            findContours: () => [contour],
            detectGreenBoundary: () => [],
            detectBunkerBoundary: () => []
        };
        const detector = new GolfGreenDetector_1.GolfGreenDetector(adapter);
        const result = detector.detect({
            featureType: FeatureType_1.FeatureType.Green,
            image,
            metresPerPixel: 0.1
        });
        (0, vitest_1.expect)(result).toHaveLength(1);
        const feature = result[0];
        (0, vitest_1.expect)(feature?.type).toBe(FeatureType_1.FeatureType.Green);
        (0, vitest_1.expect)(feature?.polygon.points).toEqual([
            new WorldPoint_1.WorldPoint(1, 2),
            new WorldPoint_1.WorldPoint(3, 2),
            new WorldPoint_1.WorldPoint(3, 4),
            new WorldPoint_1.WorldPoint(1, 2)
        ]);
    });
    (0, vitest_1.it)("rejects a non-positive metresPerPixel value", () => {
        const contour = {
            points: [
                { x: 10, y: 10 },
                { x: 20, y: 10 },
                { x: 20, y: 20 }
            ]
        };
        const adapter = {
            findContours: () => [contour],
            detectGreenBoundary: () => [],
            detectBunkerBoundary: () => []
        };
        const detector = new GolfGreenDetector_1.GolfGreenDetector(adapter);
        (0, vitest_1.expect)(() => detector.detect({
            featureType: FeatureType_1.FeatureType.Green,
            image,
            metresPerPixel: 0
        })).toThrow("metresPerPixel must be greater than zero.");
    });
});
//# sourceMappingURL=GolfGreenDetector.test.js.map