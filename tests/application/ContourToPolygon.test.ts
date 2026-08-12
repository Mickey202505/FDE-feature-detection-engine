import { describe, expect, it } from "vitest";
import { ContourToPolygon } from "../../src/application/ContourToPolygon";
import { WorldPoint } from "../../src/domain/WorldPoint";

describe("ContourToPolygon", () => {
    it("converts pixel coordinates to world coordinates", () => {
        const contour = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 50 },
            { x: 0, y: 50 }
        ];

        const polygon = ContourToPolygon.convert(contour, 0.1);

        expect(polygon.points).toEqual([
            new WorldPoint(0, 0),
            new WorldPoint(10, 0),
            new WorldPoint(10, 5),
            new WorldPoint(0, 5),
            new WorldPoint(0, 0)
        ]);
    });

    it("rejects an invalid scale", () => {
        const contour = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 }
        ];

        expect(() => ContourToPolygon.convert(contour, 0)).toThrow();
    });

    it("rejects a contour with fewer than three points", () => {
        const contour = [
            { x: 0, y: 0 },
            { x: 10, y: 0 }
        ];

        expect(() => ContourToPolygon.convert(contour, 0.1)).toThrow();
    });
});