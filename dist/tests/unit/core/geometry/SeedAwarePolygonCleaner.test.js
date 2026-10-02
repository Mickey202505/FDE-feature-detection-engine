"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SeedAwarePolygonCleaner_1 = require("../../../../src/core/geometry/SeedAwarePolygonCleaner");
(0, vitest_1.describe)("SeedAwarePolygonCleaner", () => {
    const hasPoint = (points, target) => {
        return points.some(point => point.x === target.x &&
            point.y === target.y);
    };
    (0, vitest_1.it)("removes an obvious outward spike", () => {
        const seed = { x: 0, y: 0 };
        const spike = { x: 100, y: 0 };
        const polygon = [
            { x: -150, y: -150 },
            { x: 150, y: -150 },
            { x: 54, y: -45 },
            spike,
            { x: 69, y: 12 },
            { x: 150, y: 150 },
            { x: -150, y: 150 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(cleaned.length).toBeLessThan(polygon.length);
        (0, vitest_1.expect)(hasPoint(cleaned, spike)).toBe(false);
    });
    (0, vitest_1.it)("preserves a legitimate corner", () => {
        const seed = { x: 0, y: 0 };
        const corner = {
            x: 100,
            y: 0
        };
        const polygon = [
            { x: -100, y: -100 },
            { x: 100, y: -100 },
            corner,
            { x: 100, y: 100 },
            { x: -100, y: 100 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(hasPoint(cleaned, corner)).toBe(true);
    });
    (0, vitest_1.it)("works with an off-centre seed", () => {
        const seed = { x: 20, y: 10 };
        const spike = {
            x: 120,
            y: 10
        };
        const polygon = [
            { x: -150, y: -150 },
            { x: 150, y: -150 },
            { x: 74, y: -35 },
            spike,
            { x: 89, y: 22 },
            { x: 150, y: 150 },
            { x: -150, y: 150 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(cleaned.length).toBeLessThan(polygon.length);
        (0, vitest_1.expect)(hasPoint(cleaned, spike)).toBe(false);
    });
    (0, vitest_1.it)("rejects removal when the candidate would change the polygon area too much", () => {
        const seed = { x: 0, y: 0 };
        const largeSpike = {
            x: 250,
            y: 0
        };
        const polygon = [
            { x: -100, y: -100 },
            { x: 100, y: -100 },
            { x: 70, y: -20 },
            largeSpike,
            { x: 70, y: 20 },
            { x: 100, y: 100 },
            { x: -100, y: 100 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(hasPoint(cleaned, largeSpike)).toBe(true);
    });
    (0, vitest_1.it)("keeps a smooth oval green boundary unchanged", () => {
        const seed = { x: 0, y: 0 };
        const polygon = [
            { x: 0, y: -100 },
            { x: 50, y: -87 },
            { x: 87, y: -50 },
            { x: 100, y: 0 },
            { x: 87, y: 50 },
            { x: 50, y: 87 },
            { x: 0, y: 100 },
            { x: -50, y: 87 },
            { x: -87, y: 50 },
            { x: -100, y: 0 },
            { x: -87, y: -50 },
            { x: -50, y: -87 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(cleaned).toEqual(polygon);
    });
    (0, vitest_1.it)("preserves a genuine pronounced corner in an otherwise regular boundary", () => {
        const seed = { x: 0, y: 0 };
        const corner = {
            x: 100,
            y: 0
        };
        const polygon = [
            { x: -70, y: -70 },
            { x: 0, y: -100 },
            { x: 70, y: -70 },
            corner,
            { x: 70, y: 70 },
            { x: 0, y: 100 },
            { x: -70, y: 70 },
            { x: -100, y: 0 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(hasPoint(cleaned, corner)).toBe(true);
    });
    (0, vitest_1.it)("does not modify a polygon when there is nothing suspicious to remove", () => {
        const seed = { x: 0, y: 0 };
        const polygon = [
            { x: -100, y: -100 },
            { x: 100, y: -100 },
            { x: 100, y: 100 },
            { x: -100, y: 100 }
        ];
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const cleaned = cleaner.clean(polygon, seed);
        (0, vitest_1.expect)(cleaned).toEqual(polygon);
    });
});
//# sourceMappingURL=SeedAwarePolygonCleaner.test.js.map