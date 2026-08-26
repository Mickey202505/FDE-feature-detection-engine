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

    it("does not detect a green when the seed is on non-green pixels", () => {
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
                    x: 10,
                    y: 10
                }
            });

            expect(result).toEqual([]);
        } finally {
            mat.delete();
        }
    });

    it("detects a green area with modest colour variation", () => {
        const image = createVariableGreenTestImage();

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

    it("keeps the detected green boundary close to the actual boundary", () => {
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

            const points = feature?.polygon.points ?? [];

            expect(points.length).toBeGreaterThanOrEqual(4);

            const xs = points.map((point) => point.x);
            const ys = points.map((point) => point.y);

            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);

            expect(minX).toBeGreaterThanOrEqual(19);
            expect(minX).toBeLessThanOrEqual(21);

            expect(maxX).toBeGreaterThanOrEqual(78);
            expect(maxX).toBeLessThanOrEqual(80);

            expect(minY).toBeGreaterThanOrEqual(19);
            expect(minY).toBeLessThanOrEqual(21);

            expect(maxY).toBeGreaterThanOrEqual(78);
            expect(maxY).toBeLessThanOrEqual(80);
        } finally {
            mat.delete();
        }
    });

    it("does not classify a bright non-green region as a green without a seed", () => {
        const image = createGreenAndNonGreenTestImage();

        const loader = new OpenCvImageLoader(openCvRuntime);
        const mat = loader.fromImageData(image);

        try {
            const adapter = new OpenCvJsAdapter(openCvRuntime);
            const detector = new GolfGreenDetector(adapter);

            const result = detector.detect({
                image: mat,
                metresPerPixel: 1
            });

            expect(
                result.some(
                    (feature) =>
                        feature.type === FeatureType.Green
                )
            ).toBe(true);
            
            console.log(
                "AUTOMATIC GREEN RESULT:",
                result.map((feature) => ({
                    type: feature.type,
                    points: feature.polygon.points.map(
                        (point) => ({
                            x: point.x,
                            y: point.y
                        })
                    )
                }))
            );
        
            expect(result.length).toBe(1);
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

function createVariableGreenTestImage(): {
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
                const variation = (x + y) % 3;

                data[index] = 40 + variation * 5;
                data[index + 1] = 160 + variation * 5;
                data[index + 2] = 40 + variation * 5;
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

function createGreenAndNonGreenTestImage(): {
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
            const index = (y * width + x) * 4;

            if (
                x >= 10 &&
                x < 50 &&
                y >= 20 &&
                y < 80
            ) {
                data[index] = 40;
                data[index + 1] = 160;
                data[index + 2] = 40;
                data[index + 3] = 255;
            } else if (
                x >= 70 &&
                x < 110 &&
                y >= 20 &&
                y < 80
            ) {
                data[index] = 160;
                data[index + 1] = 160;
                data[index + 2] = 160;
                data[index + 3] = 255;
            } else {
                data[index] = 20;
                data[index + 1] = 20;
                data[index + 2] = 20;
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