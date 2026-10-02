"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Feature_1 = require("../../src/domain/Feature");
const FeatureType_1 = require("../../src/domain/FeatureType");
const Polygon_1 = require("../../src/domain/Polygon");
const WorldPoint_1 = require("../../src/domain/WorldPoint");
(0, vitest_1.describe)("Feature", () => {
    (0, vitest_1.it)("stores its type, polygon and confidence", () => {
        const polygon = new Polygon_1.Polygon([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 10)
        ]);
        const feature = new Feature_1.Feature(FeatureType_1.FeatureType.Green, polygon, 0.92);
        (0, vitest_1.expect)(feature.type).toBe(FeatureType_1.FeatureType.Green);
        (0, vitest_1.expect)(feature.polygon).toBe(polygon);
        (0, vitest_1.expect)(feature.confidence).toBe(0.92);
    });
    (0, vitest_1.it)("rejects confidence below zero", () => {
        const polygon = new Polygon_1.Polygon([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 10)
        ]);
        (0, vitest_1.expect)(() => {
            new Feature_1.Feature(FeatureType_1.FeatureType.Green, polygon, -0.1);
        }).toThrow();
    });
    (0, vitest_1.it)("rejects confidence above one", () => {
        const polygon = new Polygon_1.Polygon([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 10)
        ]);
        (0, vitest_1.expect)(() => {
            new Feature_1.Feature(FeatureType_1.FeatureType.Green, polygon, 1.1);
        }).toThrow();
    });
});
//# sourceMappingURL=Feature.test.js.map