"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const SeedAwarePolygonCleaner_1 = require("../../src/core/geometry/SeedAwarePolygonCleaner");
(0, vitest_1.describe)("SeedAwarePolygonCleaner", () => {
    (0, vitest_1.it)("preserves a valid irregular boundary", () => {
        const cleaner = new SeedAwarePolygonCleaner_1.SeedAwarePolygonCleaner();
        const polygon = [
            { x: 30, y: 84 },
            { x: 99, y: 84 },
            { x: 109, y: 74 },
            { x: 99, y: 25 },
            { x: 40, y: 25 },
            { x: 30, y: 35 },
        ];
        const cleaned = cleaner.clean(polygon, { x: 55, y: 55 });
        (0, vitest_1.expect)(cleaned.length).toBeGreaterThanOrEqual(5);
        const minX = Math.min(...cleaned.map((point) => point.x));
        const maxX = Math.max(...cleaned.map((point) => point.x));
        const minY = Math.min(...cleaned.map((point) => point.y));
        const maxY = Math.max(...cleaned.map((point) => point.y));
        (0, vitest_1.expect)(minX).toBe(30);
        (0, vitest_1.expect)(maxX).toBe(109);
        (0, vitest_1.expect)(minY).toBe(25);
        (0, vitest_1.expect)(maxY).toBe(84);
    });
});
//# sourceMappingURL=SeedAwarePolygonCleaner.test.js.map