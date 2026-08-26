import { describe, expect, it } from "vitest";
import "../setup";
import { OpenCvImageLoader } from "../../src/OpenCvImageLoader";
import { OpenCvJsAdapter } from "../../src/application/opencv/OpenCvJsAdapter";
import { openCvRuntime } from "../../src/infrastructure/opencv/OpenCvJsRuntime";
import { FeatureType } from "../../src/domain/FeatureType";

describe("OpenCvJs green detection", () => {
    it("detects a seeded green area in a real OpenCV image", () => {
        const image = createGreenImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);

            const contours = adapter.findContours(
                mat,
                {
                    x: 50,
                    y: 50
                }
            );

            expect(contours.length).toBeGreaterThan(0);

            const largestContour = contours.reduce(
                (largest, current) =>
                    current.points.length > largest.points.length
                        ? current
                        : largest
            );

            expect(
                largestContour.points.length
            ).toBeGreaterThanOrEqual(4);
        } finally {
            mat.delete();
        }
    });

    it("does not detect a green when the seed is on non-green pixels", () => {
        const image = createGreenImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);

            const contours = adapter.findContours(
                mat,
                {
                    x: 5,
                    y: 5
                }
            );

            expect(contours).toEqual([]);
        } finally {
            mat.delete();
        }
    });

    it("detects a green area with modest colour variation", () => {
        const image = createGreenImage(
            40,
            80,
            90,
            150,
            120,
            130,
            70
        );

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);

            const contours = adapter.findContours(
                mat,
                {
                    x: 50,
                    y: 50
                }
            );

            expect(contours.length).toBeGreaterThan(0);
        } finally {
            mat.delete();
        }
    });

    it("keeps the detected green boundary close to the actual boundary", () => {
        const image = createGreenImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);

            const contours = adapter.findContours(
                mat,
                {
                    x: 50,
                    y: 50
                }
            );

            expect(contours.length).toBeGreaterThan(0);

            const contour = contours.reduce(
                (largest, current) =>
                    current.points.length > largest.points.length
                        ? current
                        : largest
            );

            const xs = contour.points.map(
                (point) => point.x
            );

            const ys = contour.points.map(
                (point) => point.y
            );

            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            expect(minX).toBeGreaterThanOrEqual(15);
            expect(maxX).toBeLessThanOrEqual(85);
            expect(minY).toBeGreaterThanOrEqual(15);
            expect(maxY).toBeLessThanOrEqual(85);
        } finally {
            mat.delete();
        }
    });

    it("does not classify a bright non-green region as a green without a seed", () => {
        const image = createGreenAndGreyImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);

            const contours = adapter.findContours(mat);

            expect(contours.length).toBeGreaterThan(0);

            const result = contours.map((contour) => ({
                type: FeatureType.Green,
                points: contour.points
            }));

            console.log(
                "AUTOMATIC GREEN RESULT:",
                JSON.stringify(
                    result,
                    null,
                    2
                )
            );

            expect(result.length).toBe(1);
        } finally {
            mat.delete();
        }
    });
});

function createGreenImage(
    greenR = 40,
    greenG = 180,
    greenB = 60,
    startX = 20,
    endX = 80,
    startY = 20,
    endY = 80
): {
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
            const index =
                (y * width + x) * 4;

            data[index] = 0;
            data[index + 1] = 0;
            data[index + 2] = 0;
            data[index + 3] = 255;

            if (
                x >= startX &&
                x < endX &&
                y >= startY &&
                y < endY
            ) {
                data[index] = greenR;
                data[index + 1] = greenG;
                data[index + 2] = greenB;
            }
        }
    }

    return {
        width,
        height,
        data
    };
}

function createGreenAndGreyImage(): {
    width: number;
    height: number;
    data: Uint8ClampedArray;
} {
    const width = 120;
    const height = 100;

    const data = new Uint8ClampedArray(
        width * height * 4
    );

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index =
                (y * width + x) * 4;

            data[index] = 0;
            data[index + 1] = 0;
            data[index + 2] = 0;
            data[index + 3] = 255;

            if (
                x >= 10 &&
                x < 60 &&
                y >= 20 &&
                y < 80
            ) {
                data[index] = 40;
                data[index + 1] = 180;
                data[index + 2] = 60;
            }

            if (
                x >= 70 &&
                x < 110 &&
                y >= 20 &&
                y < 80
            ) {
                data[index] = 220;
                data[index + 1] = 220;
                data[index + 2] = 220;
            }
        }
    }

    return {
        width,
        height,
        data
    };
}