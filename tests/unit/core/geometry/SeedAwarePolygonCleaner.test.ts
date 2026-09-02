import { describe, expect, it } from "vitest";

import {
    SeedAwarePolygonCleaner,
    SeedAwarePolygonPoint
} from "../../../../src/core/geometry/SeedAwarePolygonCleaner";

describe("SeedAwarePolygonCleaner", () => {

    const hasPoint = (
        points: SeedAwarePolygonPoint[],
        target: SeedAwarePolygonPoint
    ): boolean => {
        return points.some(
            point =>
                point.x === target.x &&
                point.y === target.y
        );
    };

    it("removes an obvious outward spike", () => {
        const seed = {
            x: 0,
            y: 0
        };

        const spike: SeedAwarePolygonPoint = {
            x: 100,
            y: 0
        };

        const polygon: SeedAwarePolygonPoint[] = [
            { x: -150, y: -150 },
            { x: 150, y: -150 },
            { x: 54, y: -45 },
            spike,
            { x: 69, y: 12 },
            { x: 150, y: 150 },
            { x: -150, y: 150 }
        ];

        const cleaner = new SeedAwarePolygonCleaner();

        const cleaned = cleaner.clean(
            polygon,
            seed
        );

        expect(cleaned.length).toBeLessThan(
            polygon.length
        );

        expect(
            hasPoint(cleaned, spike)
        ).toBe(false);
    });

    it("preserves a legitimate corner", () => {
        const seed = {
            x: 0,
            y: 0
        };

        const corner: SeedAwarePolygonPoint = {
            x: 100,
            y: 0
        };

        const polygon: SeedAwarePolygonPoint[] = [
            { x: -100, y: -100 },
            { x: 100, y: -100 },
            corner,
            { x: 100, y: 100 },
            { x: -100, y: 100 }
        ];

        const cleaner = new SeedAwarePolygonCleaner();

        const cleaned = cleaner.clean(
            polygon,
            seed
        );

        expect(
            hasPoint(cleaned, corner)
        ).toBe(true);
    });

    it("works with an off-centre seed", () => {
        const seed = {
            x: 20,
            y: 10
        };

        const spike: SeedAwarePolygonPoint = {
            x: 120,
            y: 10
        };

        const polygon: SeedAwarePolygonPoint[] = [
            { x: -150, y: -150 },
            { x: 150, y: -150 },
            { x: 74, y: -35 },
            spike,
            { x: 89, y: 22 },
            { x: 150, y: 150 },
            { x: -150, y: 150 }
        ];

        const cleaner = new SeedAwarePolygonCleaner();

        const cleaned = cleaner.clean(
            polygon,
            seed
        );

        expect(cleaned.length).toBeLessThan(
            polygon.length
        );

        expect(
            hasPoint(cleaned, spike)
        ).toBe(false);
    });

    it("rejects removal when the candidate would change the polygon area too much", () => {
        const seed = {
            x: 0,
            y: 0
        };

        const largeSpike: SeedAwarePolygonPoint = {
            x: 250,
            y: 0
        };

        const polygon: SeedAwarePolygonPoint[] = [
            { x: -100, y: -100 },
            { x: 100, y: -100 },
            { x: 70, y: -20 },
            largeSpike,
            { x: 70, y: 20 },
            { x: 100, y: 100 },
            { x: -100, y: 100 }
        ];

        const cleaner = new SeedAwarePolygonCleaner();

        const cleaned = cleaner.clean(
            polygon,
            seed
        );

        expect(
            hasPoint(cleaned, largeSpike)
        ).toBe(true);
    });

    it("does not modify a polygon when there is nothing suspicious to remove", () => {
        const seed = {
            x: 0,
            y: 0
        };

        const polygon: SeedAwarePolygonPoint[] = [
            { x: -100, y: -100 },
            { x: 100, y: -100 },
            { x: 100, y: 100 },
            { x: -100, y: 100 }
        ];

        const cleaner = new SeedAwarePolygonCleaner();

        const cleaned = cleaner.clean(
            polygon,
            seed
        );

        expect(cleaned).toEqual(
            polygon
        );
    });
});