import { describe, expect, it } from "vitest";
import { Feature } from "../../src/domain/Feature";
import { FeatureType } from "../../src/domain/FeatureType";
import { Polygon } from "../../src/domain/Polygon";
import { WorldPoint } from "../../src/domain/WorldPoint";

describe("Feature", () => {
    it("stores its type, polygon and confidence", () => {
        const polygon = new Polygon([
            new WorldPoint(0, 0),
            new WorldPoint(10, 0),
            new WorldPoint(10, 10)
        ]);

        const feature = new Feature(
            FeatureType.Green,
            polygon,
            0.92
        );

        expect(feature.type).toBe(FeatureType.Green);
        expect(feature.polygon).toBe(polygon);
        expect(feature.confidence).toBe(0.92);
    });

    it("rejects confidence below zero", () => {
        const polygon = new Polygon([
            new WorldPoint(0, 0),
            new WorldPoint(10, 0),
            new WorldPoint(10, 10)
        ]);

        expect(() => {
            new Feature(FeatureType.Green, polygon, -0.1);
        }).toThrow();
    });

    it("rejects confidence above one", () => {
        const polygon = new Polygon([
            new WorldPoint(0, 0),
            new WorldPoint(10, 0),
            new WorldPoint(10, 10)
        ]);

        expect(() => {
            new Feature(FeatureType.Green, polygon, 1.1);
        }).toThrow();
    });
});