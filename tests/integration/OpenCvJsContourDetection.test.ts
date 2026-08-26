import { describe, expect, it } from "vitest";
import "../setup";
import { OpenCvImageLoader } from "../../src/OpenCvImageLoader";
import { GolfGreenDetector } from "../../src/application/detectors/GolfGreenDetector";
import { OpenCvJsAdapter } from "../../src/application/opencv/OpenCvJsAdapter";
import { openCvRuntime } from "../../src/infrastructure/opencv/OpenCvJsRuntime";
import { FeatureType } from "../../src/domain/FeatureType";

describe("OpenCvJs green detection", () => {
    it("detects a seeded green area in a real OpenCV image", () => {
        const image = createGreenTestImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);
            const detector = new GolfGreenDetector(adapter);

            const result = detector.detect({
                image: mat,
                metresPerPixel: 1,
                seed: {
                    x: 50,
                    y: 50
                }
            });

            expect(result).toHaveLength(1);

            const feature = result[0];

            expect(feature).toBeDefined();
            expect(feature?.type).toBe(FeatureType.Green);
            expect(feature?.polygon.points.length).toBeGreaterThanOrEqual(4);
        } finally {
            mat.delete();
        }
    });
});

function createGreenTestImage(): {
    width: number;
    height: number;
    data: Uint8ClampedArray;
} {
    const width = 100;
    const height = 100;

    const data = new Uint8ClampedArray(
        width * height * 4
    );

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;

            if (
                x >= 20 &&
                x < 80 &&
                y >= 20 &&
                y < 80
            ) {
                data[index] = 40;
                data[index + 1] = 160;
                data[index + 2] = 40;
                data[index + 3] = 255;
            } else {
                data[index] = 30;
                data[index + 1] = 30;
                data[index + 2] = 30;
                data[index + 3] = 255;
            }
        }
    }

    return {
        width,
        height,
        data
    };
}