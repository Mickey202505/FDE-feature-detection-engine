import { describe, expect, it } from "vitest";

import type {
    OpenCvImageData,
} from "../../src/application/opencv/OpenCvTypes";
import type { PixelPoint } from "../../src/application/opencv/PixelPoint";
import { OpenCvJsAdapter } from "../../src/application/opencv/OpenCvJsAdapter";
import openCvRuntime from "../../src/infrastructure/opencv/OpenCvJsRuntime";

function createRgbaImage(
    width: number,
    height: number,
    pixel: (x: number, y: number) => [number, number, number, number],
): OpenCvImageData {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * 4;
            const [r, g, b, a] = pixel(x, y);

            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
            data[offset + 3] = a;
        }
    }

    return {
        width,
        height,
        data,
    };
}

function largestContour(
    contours: readonly { points: readonly PixelPoint[] }[],
) {
    return contours.reduce<(typeof contours)[number] | undefined>(
        (largest, contour) => {
            if (!largest || contour.points.length > largest.points.length) {
                return contour;
            }

            return largest;
        },
        undefined,
    );
}

function getBounds(points: readonly PixelPoint[]) {
    return points.reduce(
        (bounds, point) => ({
            minX: Math.min(bounds.minX, point.x),
            maxX: Math.max(bounds.maxX, point.x),
            minY: Math.min(bounds.minY, point.y),
            maxY: Math.max(bounds.maxY, point.y),
        }),
        {
            minX: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
        },
    );
}

describe("OpenCvJs green detection", () => {
    it("detects a seeded green area in a real OpenCV image", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(100, 100, (x, y) => {
                if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                    return [40, 180, 40, 255];
                }

                return [220, 220, 220, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 50, y: 50 });

            expect(contours.length).toBeGreaterThan(0);

            const contour = largestContour(contours);
            expect(contour).toBeDefined();

            const bounds = getBounds(contour!.points);

            expect(bounds.minX).toBeLessThanOrEqual(20);
            expect(bounds.maxX).toBeGreaterThanOrEqual(79);
            expect(bounds.minY).toBeLessThanOrEqual(20);
            expect(bounds.maxY).toBeGreaterThanOrEqual(79);
        } finally {
            image.delete();
        }
    });

    it("returns no contours when the seed is not green", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(100, 100, (x, y) => {
                if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                    return [40, 180, 40, 255];
                }

                return [220, 220, 220, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 5, y: 5 });

            expect(contours).toHaveLength(0);
        } finally {
            image.delete();
        }
    });

    it("detects a green area with modest colour variation", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(100, 100, (x, y) => {
                if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                    const variation = (x + y) % 10;

                    return [40 + variation, 180 + variation, 40 + variation, 255];
                }

                return [220, 220, 220, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 50, y: 50 });

            expect(contours.length).toBeGreaterThan(0);

            const contour = largestContour(contours);
            expect(contour).toBeDefined();

            const bounds = getBounds(contour!.points);

            expect(bounds.minX).toBeLessThanOrEqual(20);
            expect(bounds.maxX).toBeGreaterThanOrEqual(79);
            expect(bounds.minY).toBeLessThanOrEqual(20);
            expect(bounds.maxY).toBeGreaterThanOrEqual(79);
        } finally {
            image.delete();
        }
    });

    it("keeps the detected green boundary close to the actual boundary", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(120, 100, (x, y) => {
                if (x >= 30 && x <= 89 && y >= 20 && y <= 79) {
                    return [40, 180, 40, 255];
                }

                return [220, 220, 220, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 60, y: 50 });

            expect(contours.length).toBeGreaterThan(0);

            const contour = largestContour(contours);
            expect(contour).toBeDefined();

            const bounds = getBounds(contour!.points);

            expect(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.maxX - 89)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.minY - 20)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.maxY - 79)).toBeLessThanOrEqual(2);
        } finally {
            image.delete();
        }
    });

    it("returns no contours when there is no green area and no seed", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(100, 100, (x, y) => {
                if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                    return [230, 230, 230, 255];
                }

                return [40, 40, 40, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image);

            expect(contours).toHaveLength(0);
        } finally {
            image.delete();
        }
    });

    it("follows a gradual colour transition away from the seed", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(120, 100, (x, y) => {
                if (x >= 20 && x <= 99 && y >= 20 && y <= 79) {
                    const variation = Math.round((x - 20) * 0.4);

                    return [40 + variation, 160 + variation, 40 + variation, 255];
                }

                return [80, 80, 80, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 30, y: 50 });

            expect(contours.length).toBeGreaterThan(0);

            const contour = largestContour(contours);
            expect(contour).toBeDefined();

            const bounds = getBounds(contour!.points);

            expect(bounds.minX).toBeLessThanOrEqual(20);
            expect(bounds.maxX).toBeGreaterThanOrEqual(97);
            expect(bounds.minY).toBeLessThanOrEqual(20);
            expect(bounds.maxY).toBeGreaterThanOrEqual(79);
        } finally {
            image.delete();
        }
    });

    it("stops at a sustained colour transition into similar surrounding turf", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(140, 120, (x, y) => {
                if (x >= 30 && x <= 99 && y >= 25 && y <= 84) {
                    return [40, 180, 40, 255];
                }

                return [60, 150, 60, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 60, y: 55 });

            expect(contours.length).toBeGreaterThan(0);

            const contour = largestContour(contours);
            expect(contour).toBeDefined();

            const bounds = getBounds(contour!.points);

            expect(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.maxX - 99)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.minY - 25)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.maxY - 84)).toBeLessThanOrEqual(2);
        } finally {
            image.delete();
        }
    });

    it("follows an irregular green boundary instead of assuming a rectangle", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);

        const image = openCvRuntime.matFromImageData!(
            createRgbaImage(140, 120, (x, y) => {
                const insideGreen =
                    (
                        x >= 30 &&
                        x <= 99 &&
                        y >= 35 &&
                        y <= 84
                    ) ||
                    (
                        x >= 40 &&
                        x <= 89 &&
                        y >= 25 &&
                        y <= 34
                    ) ||
                    (
                        x >= 40 &&
                        x <= 109 &&
                        y >= 45 &&
                        y <= 74
                    );

                if (insideGreen) {
                    return [40, 180, 40, 255];
                }

                return [60, 150, 60, 255];
            }),
        );

        try {
            const contours = adapter.findContours(image, { x: 55, y: 55 });

            expect(contours.length).toBeGreaterThan(0);

            const contour = largestContour(contours);
            expect(contour).toBeDefined();

            const bounds = getBounds(contour!.points);

            expect(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.maxX - 109)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.minY - 25)).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.maxY - 84)).toBeLessThanOrEqual(2);
        } finally {
            image.delete();
        }
    });
});