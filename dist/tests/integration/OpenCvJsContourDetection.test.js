"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const maskAscii_1 = require("../helpers/maskAscii");
const node_fs_1 = require("node:fs");
const vitest_1 = require("vitest");
const pngjs_1 = require("pngjs");
const OpenCvJsAdapter_1 = require("../../src/application/opencv/OpenCvJsAdapter");
const OpenCvJsRuntime_1 = __importDefault(require("../../src/infrastructure/opencv/OpenCvJsRuntime"));
function createRgbaImage(width, height, pixel) {
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
function loadRealGolfGreenImage() {
    const file = (0, node_fs_1.readFileSync)("tests/fixtures/Green_2.png");
    const png = pngjs_1.PNG.sync.read(file);
    return {
        width: png.width,
        height: png.height,
        data: new Uint8ClampedArray(png.data),
    };
}
function largestContour(contours) {
    return contours.reduce((largest, contour) => {
        if (!largest || contour.points.length > largest.points.length) {
            return contour;
        }
        return largest;
    }, undefined);
}
function getBounds(points) {
    return points.reduce((bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        maxX: Math.max(bounds.maxX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxY: Math.max(bounds.maxY, point.y),
    }), {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
    });
}
function writeMaskImage(mask, outputPath) {
    const png = new pngjs_1.PNG({
        width: mask.cols,
        height: mask.rows,
    });
    for (let y = 0; y < mask.rows; y += 1) {
        for (let x = 0; x < mask.cols; x += 1) {
            const value = mask.ucharPtr(y, x)[0];
            const offset = (y * mask.cols + x) * 4;
            png.data[offset] = value;
            png.data[offset + 1] = value;
            png.data[offset + 2] = value;
            png.data[offset + 3] = 255;
        }
    }
    (0, node_fs_1.writeFileSync)(outputPath, pngjs_1.PNG.sync.write(png));
}
function drawLine(png, x0, y0, x1, y1) {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx - dy;
    while (true) {
        if (x >= 0 &&
            x < png.width &&
            y >= 0 &&
            y < png.height) {
            const offset = (y * png.width + x) * 4;
            png.data[offset] = 255;
            png.data[offset + 1] = 0;
            png.data[offset + 2] = 0;
            png.data[offset + 3] = 255;
        }
        if (x === x1 && y === y1) {
            break;
        }
        const doubleError = 2 * error;
        if (doubleError > -dy) {
            error -= dy;
            x += sx;
        }
        if (doubleError < dx) {
            error += dx;
            y += sy;
        }
    }
}
function writeContourOverlay(imageData, points, outputPath) {
    const png = new pngjs_1.PNG({
        width: imageData.width,
        height: imageData.height,
    });
    png.data.set(imageData.data);
    for (let i = 0; i < points.length; i += 1) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        drawLine(png, current.x, current.y, next.x, next.y);
    }
    (0, node_fs_1.writeFileSync)(outputPath, pngjs_1.PNG.sync.write(png));
}
(0, vitest_1.describe)("OpenCvJs green detection", () => {
    (0, vitest_1.it)("detects a seeded green area in a real OpenCV image", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(100, 100, (x, y) => {
            if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                return [40, 180, 40, 255];
            }
            return [220, 220, 220, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 50, y: 50 });
            (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
            const contour = largestContour(contours);
            (0, vitest_1.expect)(contour).toBeDefined();
            const bounds = getBounds(contour.points);
            (0, vitest_1.expect)(bounds.minX).toBeLessThanOrEqual(20);
            (0, vitest_1.expect)(bounds.maxX).toBeGreaterThanOrEqual(79);
            (0, vitest_1.expect)(bounds.minY).toBeLessThanOrEqual(20);
            (0, vitest_1.expect)(bounds.maxY).toBeGreaterThanOrEqual(79);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("returns no contours when the seed is not green", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(100, 100, (x, y) => {
            if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                return [40, 180, 40, 255];
            }
            return [220, 220, 220, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 5, y: 5 });
            (0, vitest_1.expect)(contours).toHaveLength(0);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("detects a green area with modest colour variation", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(100, 100, (x, y) => {
            if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                const variation = (x + y) % 10;
                return [
                    40 + variation,
                    180 + variation,
                    40 + variation,
                    255,
                ];
            }
            return [220, 220, 220, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 50, y: 50 });
            (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
            const contour = largestContour(contours);
            (0, vitest_1.expect)(contour).toBeDefined();
            const bounds = getBounds(contour.points);
            (0, vitest_1.expect)(bounds.minX).toBeLessThanOrEqual(22);
            (0, vitest_1.expect)(bounds.maxX).toBeGreaterThanOrEqual(78);
            (0, vitest_1.expect)(bounds.minY).toBeLessThanOrEqual(22);
            (0, vitest_1.expect)(bounds.maxY).toBeGreaterThanOrEqual(78);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("keeps the detected green boundary close to the actual boundary", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(120, 100, (x, y) => {
            if (x >= 30 && x <= 89 && y >= 20 && y <= 79) {
                return [40, 180, 40, 255];
            }
            return [220, 220, 220, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 60, y: 50 });
            (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
            const contour = largestContour(contours);
            (0, vitest_1.expect)(contour).toBeDefined();
            const bounds = getBounds(contour.points);
            (0, vitest_1.expect)(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.maxX - 89)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.minY - 20)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.maxY - 79)).toBeLessThanOrEqual(2);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("returns no contours when there is no green area and no seed", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(100, 100, (x, y) => {
            if (x >= 20 && x <= 79 && y >= 20 && y <= 79) {
                return [230, 230, 230, 255];
            }
            return [40, 40, 40, 255];
        }));
        try {
            const contours = adapter.findContours(image);
            (0, vitest_1.expect)(contours).toHaveLength(0);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("follows a gradual colour transition away from the seed", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(120, 100, (x, y) => {
            if (x >= 20 && x <= 99 && y >= 20 && y <= 79) {
                const variation = Math.round((x - 20) * 0.4);
                return [
                    40 + variation,
                    160 + variation,
                    40 + variation,
                    255,
                ];
            }
            return [80, 80, 80, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 30, y: 50 });
            (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
            const contour = largestContour(contours);
            (0, vitest_1.expect)(contour).toBeDefined();
            const bounds = getBounds(contour.points);
            (0, vitest_1.expect)(bounds.minX).toBeLessThanOrEqual(20);
            (0, vitest_1.expect)(bounds.maxX).toBeGreaterThanOrEqual(80);
            (0, vitest_1.expect)(bounds.minY).toBeLessThanOrEqual(20);
            (0, vitest_1.expect)(bounds.maxY).toBeGreaterThanOrEqual(79);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("stops at a sustained colour transition into similar surrounding turf", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(140, 120, (x, y) => {
            if (x >= 30 && x <= 99 && y >= 25 && y <= 84) {
                return [40, 180, 40, 255];
            }
            return [60, 150, 60, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 60, y: 55 });
            (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
            const contour = largestContour(contours);
            (0, vitest_1.expect)(contour).toBeDefined();
            const bounds = getBounds(contour.points);
            (0, vitest_1.expect)(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.maxX - 99)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.minY - 25)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.maxY - 84)).toBeLessThanOrEqual(2);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("follows an irregular green boundary instead of assuming a rectangle", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const image = OpenCvJsRuntime_1.default.matFromImageData(createRgbaImage(140, 120, (x, y) => {
            const insideGreen = (x >= 30 &&
                x <= 99 &&
                y >= 35 &&
                y <= 84) ||
                (x >= 40 &&
                    x <= 89 &&
                    y >= 25 &&
                    y <= 34) ||
                (x >= 40 &&
                    x <= 109 &&
                    y >= 45 &&
                    y <= 74);
            if (insideGreen) {
                return [40, 180, 40, 255];
            }
            return [60, 150, 60, 255];
        }));
        try {
            const contours = adapter.findContours(image, { x: 55, y: 55 });
            (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
            const contour = largestContour(contours);
            (0, vitest_1.expect)(contour).toBeDefined();
            const bounds = getBounds(contour.points);
            (0, vitest_1.expect)(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.maxX - 109)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.minY - 25)).toBeLessThanOrEqual(2);
            (0, vitest_1.expect)(Math.abs(bounds.maxY - 84)).toBeLessThanOrEqual(2);
        }
        finally {
            image.delete();
        }
    });
    (0, vitest_1.it)("diagnoses the detector on the real golf green image", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const imageData = loadRealGolfGreenImage();
        console.log("[RealImageDimensions]", {
            width: imageData.width,
            height: imageData.height,
        });
        const image = OpenCvJsRuntime_1.default.matFromImageData(imageData);
        try {
            const seed = {
                x: 491,
                y: 364,
            };
            const mask = adapter.createSeedGuidedRegionMaskForDiagnostics(imageData, seed);
            console.log("[AsciiMask]\n" +
                (0, maskAscii_1.maskToAscii)(mask, 120, 45));
            const rayPoints = adapter.extractBoundaryByRaysForDiagnostics(mask, seed);
            console.log("[RayCast] count:", rayPoints.length);
            console.log("[RayCastAscii]\n" +
                (0, maskAscii_1.maskToRayAscii)(rayPoints, imageData.width, imageData.height, 120, 45));
            const smoothedPoints = adapter.smoothBoundaryForDiagnostics(rayPoints);
            console.log("[SmoothedAscii]\n" +
                (0, maskAscii_1.maskToRayAscii)(smoothedPoints, imageData.width, imageData.height));
            const segmentedPoints = adapter.segmentBoundaryForDiagnostics(smoothedPoints);
            console.log("[SegmentedCount]", smoothedPoints.length, "->", segmentedPoints.length);
            console.log("[SegmentedAscii]\n" +
                (0, maskAscii_1.maskToRayAscii)(segmentedPoints, imageData.width, imageData.height));
            const finalPoints = adapter.subsampleToCountForDiagnostics(segmentedPoints, 45);
            console.log("[FinalCount]", segmentedPoints.length, "->", finalPoints.length);
            console.log("[FinalAscii]\n" +
                (0, maskAscii_1.maskToRayAscii)(finalPoints, imageData.width, imageData.height));
            // ← INSERT THE ASCII DUMP HERE
            writeContourOverlay(imageData, finalPoints, "tests/fixtures/golf-green-raycast.png");
            try {
                writeMaskImage(mask, "tests/fixtures/golf-green-growth-mask.png");
            }
            finally {
                mask.delete();
            }
            // ... rest of the test ...
        }
        finally {
            image.delete();
        }
    }, 30000);
    (0, vitest_1.it)("produces a similar real-green boundary from another interior seed", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const imageData = loadRealGolfGreenImage();
        const image = OpenCvJsRuntime_1.default.matFromImageData(imageData);
        try {
            const seeds = [
                { x: 450, y: 350 },
                { x: 520, y: 300 },
            ];
            const boundsBySeed = seeds.map((seed) => {
                const contours = adapter.findContours(image, seed);
                (0, vitest_1.expect)(contours.length).toBeGreaterThan(0);
                const contour = largestContour(contours);
                (0, vitest_1.expect)(contour).toBeDefined();
                const bounds = getBounds(contour.points);
                console.log("[RealGreenSeedComparison]", { seed, bounds });
                return bounds;
            });
            const first = boundsBySeed[0];
            const second = boundsBySeed[1];
            (0, vitest_1.expect)(Math.abs(first.minX - second.minX)).toBeLessThanOrEqual(30);
            (0, vitest_1.expect)(Math.abs(first.maxX - second.maxX)).toBeLessThanOrEqual(30);
            (0, vitest_1.expect)(Math.abs(first.minY - second.minY)).toBeLessThanOrEqual(30);
            (0, vitest_1.expect)(Math.abs(first.maxY - second.maxY)).toBeLessThanOrEqual(180);
        }
        finally {
            image.delete();
        }
    });
});
//# sourceMappingURL=OpenCvJsContourDetection.test.js.map