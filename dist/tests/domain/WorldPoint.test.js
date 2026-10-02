"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const WorldPoint_1 = require("../../src/domain/WorldPoint");
(0, vitest_1.describe)("WorldPoint", () => {
    (0, vitest_1.it)("stores world X and Y coordinates", () => {
        const point = new WorldPoint_1.WorldPoint(12.5, 8.25);
        (0, vitest_1.expect)(point.x).toBe(12.5);
        (0, vitest_1.expect)(point.y).toBe(8.25);
    });
    (0, vitest_1.it)("is immutable", () => {
        const point = new WorldPoint_1.WorldPoint(10, 20);
        (0, vitest_1.expect)(point.x).toBe(10);
        (0, vitest_1.expect)(point.y).toBe(20);
    });
});
//# sourceMappingURL=WorldPoint.test.js.map