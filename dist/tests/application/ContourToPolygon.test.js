"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ContourToPolygon_1 = require("../../src/application/ContourToPolygon");
const WorldPoint_1 = require("../../src/domain/WorldPoint");
(0, vitest_1.describe)("ContourToPolygon", () => {
    (0, vitest_1.it)("converts pixel coordinates to world coordinates", () => {
        const contour = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
            { x: 0, y: 50 }
        ];
        const polygon = ContourToPolygon_1.ContourToPolygon.convert(contour, 0.1);
        (0, vitest_1.expect)(polygon.points).toEqual([
            new WorldPoint_1.WorldPoint(0, 0),
            new WorldPoint_1.WorldPoint(10, 0),
            new WorldPoint_1.WorldPoint(10, 5),
            new WorldPoint_1.WorldPoint(0, 5),
            new WorldPoint_1.WorldPoint(0, 0)
        ]);
    });
    (0, vitest_1.it)("rejects an invalid scale", () => {
        const contour = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 }
        ];
        (0, vitest_1.expect)(() => ContourToPolygon_1.ContourToPolygon.convert(contour, 0)).toThrow();
    });
    (0, vitest_1.it)("rejects a contour with fewer than three points", () => {
        const contour = [
            { x: 0, y: 0 },
            { x: 10, y: 0 }
        ];
        (0, vitest_1.expect)(() => ContourToPolygon_1.ContourToPolygon.convert(contour, 0.1)).toThrow();
    });
});
//# sourceMappingURL=ContourToPolygon.test.js.map