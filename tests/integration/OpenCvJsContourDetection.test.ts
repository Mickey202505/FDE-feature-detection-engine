import { describe, expect, it } from "vitest";
import "../setup"; // Execute OpenCV setup before importing runtime
import { OpenCvImageLoader } from "../../src/OpenCvImageLoader";
import { OpenCvJsAdapter } from "../../src/application/opencv/OpenCvJsAdapter";
import { openCvRuntime } from "../../src/infrastructure/opencv/OpenCvJsRuntime";

describe("OpenCvJs contour detection", () => {
    it("finds a simple rectangle in a real OpenCV image", () => {
        const image = createTestImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);

            const contours = adapter.findContours(mat);

            expect(contours.length).toBeGreaterThan(0);

            const largestContour = contours.reduce(
                (largest, current) =>
                    current.points.length > largest.points.length
                        ? current
                        : largest
            );

            expect(largestContour.points.length).toBeGreaterThanOrEqual(4);
        } finally {
            mat.delete();
        }
    });
});

function createTestImage(): {
    width: number;
    height: number;
    data: Uint8ClampedArray;
} {
    const width = 100;
    const height = 100;

    const data = new Uint8ClampedArray(
        width * height * 4
    );

    for (let y = 20; y < 80; y += 1) {
        for (let x = 20; x < 80; x += 1) {
            const index = (y * width + x) * 4;

            data[index] = 255;
            data[index + 1] = 255;
            data[index + 2] = 255;
            data[index + 3] = 255;
        }
    }

    return {
        width,
        height,
        data
    };
}