import { describe, expect, it } from "vitest";
import type { DetectionRequest } from "../../src/api/DetectionRequest";

describe("DetectionRequest", () => {
    it("can represent an image detection request", () => {
        const request: DetectionRequest = {
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1
        };

        expect(request.metresPerPixel).toBe(0.1);
    });

    it("can represent an image-space seed point", () => {
        const request: DetectionRequest = {
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1,
            seed: {
                x: 50,
                y: 40
            }
        };

        expect(request.seed).toEqual({
            x: 50,
            y: 40
        });
    });
});