import { describe, expect, it } from "vitest";
import { Polygon } from "../../src/domain/Polygon";
import { WorldPoint } from "../../src/domain/WorldPoint";

describe("Polygon", () => {
    it("closes an open polygon", () => {
        const polygon = new Polygon([
            new WorldPoint(0, 0),
            new WorldPoint(10, 0),
            new WorldPoint(10, 10),
            new WorldPoint(0, 10)
        ]);

        expect(polygon.points.length).toBe(5);
        expect(polygon.points[0]).toEqual(polygon.points[4]);
    });

    it("does not add a duplicate point to an already closed polygon", () => {
        const polygon = new Polygon([
            new WorldPoint(0, 0),
            new WorldPoint(10, 0),
            new WorldPoint(10, 10),
            new WorldPoint(0, 10),
            new WorldPoint(0, 0)
        ]);

        expect(polygon.points.length).toBe(5);
    });

    it("rejects fewer than three points", () => {
        expect(() =>
            new Polygon([
                new WorldPoint(0, 0),
                new WorldPoint(10, 0)
            ])
        ).toThrow();
    });
});