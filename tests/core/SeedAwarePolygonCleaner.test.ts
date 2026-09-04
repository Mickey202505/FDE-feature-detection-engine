import { describe, expect, it } from "vitest";

import type { PixelPoint } from "../../src/application/opencv/PixelPoint";
import { SeedAwarePolygonCleaner } from "../../src/core/geometry/SeedAwarePolygonCleaner";

describe("SeedAwarePolygonCleaner", () => {
    it("preserves a valid irregular boundary", () => {
        const cleaner = new SeedAwarePolygonCleaner();

        const polygon: readonly PixelPoint[] = [
            { x: 30, y: 84 },
            { x: 99, y: 84 },
            { x: 109, y: 74 },
            { x: 99, y: 25 },
            { x: 40, y: 25 },
            { x: 30, y: 35 },
        ];

        const cleaned = cleaner.clean(
            polygon,
            { x: 55, y: 55 },
        );

        expect(cleaned.length).toBeGreaterThanOrEqual(5);

        const minX = Math.min(...cleaned.map((point) => point.x));
        const maxX = Math.max(...cleaned.map((point) => point.x));
        const minY = Math.min(...cleaned.map((point) => point.y));
        const maxY = Math.max(...cleaned.map((point) => point.y));

        expect(minX).toBe(30);
        expect(maxX).toBe(109);
        expect(minY).toBe(25);
        expect(maxY).toBe(84);
    });
});