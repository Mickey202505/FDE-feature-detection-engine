"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Polygon_1 = require("../../src/domain/Polygon");
const WorldPoint_1 = require("../../src/domain/WorldPoint");
(0, vitest_1.describe)("Polygon", () => {
    (0, vitest_1.it)("closes an open polygon", () => {
        const polygon = new Polygon_1.Polygon([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 10),
            new WorldPoint_1.WorldPoint(0, 10)
        ]);
        (0, vitest_1.expect)(polygon.points.length).toBe(5);
        (0, vitest_1.expect)(polygon.points[0]).toEqual(polygon.points[4]);
    });
    (0, vitest_1.it)("does not add a duplicate point to an already closed polygon", () => {
        const polygon = new Polygon_1.Polygon([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 10),
            new WorldPoint_1.WorldPoint(0, 10),
            new WorldPoint_1.WorldPoint(0, 0)
        ]);
        (0, vitest_1.expect)(polygon.points.length).toBe(5);
    });
    (0, vitest_1.it)("rejects fewer than three points", () => {
        (0, vitest_1.expect)(() => new Polygon_1.Polygon([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0)
        ])).toThrow();
    });
});
//# sourceMappingURL=Polygon.test.js.map