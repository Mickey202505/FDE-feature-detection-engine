import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { OpenCvJsAdapter, BUNKER_MASK_OPTIONS } from "../../src/application/opencv/OpenCvJsAdapter";
import openCvRuntime from "../../src/infrastructure/opencv/OpenCvJsRuntime";
import type { OpenCvImageData, OpenCvMat } from "../../src/application/opencv/OpenCvTypes";

function writeMaskImage(
    mask: OpenCvMat,
    outputPath: string,
): void {
    const png = new PNG({
        width: mask.cols,
        height: mask.rows,
    });

    for (let y = 0; y < mask.rows; y += 1) {
        for (let x = 0; x < mask.cols; x += 1) {
            const value = mask.ucharPtr!(y, x)[0];
            const offset = (y * mask.cols + x) * 4;

            png.data[offset] = value;
            png.data[offset + 1] = value;
            png.data[offset + 2] = value;
            png.data[offset + 3] = 255;
        }
    }

    writeFileSync(outputPath, PNG.sync.write(png));

    let whiteCount = 0;
    for (let y = 0; y < mask.rows; y += 1) {
        for (let x = 0; x < mask.cols; x += 1) {
            const value = mask.ucharPtr!(y, x)[0];
            if (value !== 0) whiteCount += 1;
        }
    }
    console.log(
        "[MaskWrite] white pixels:",
        whiteCount,
        "of",
        mask.rows * mask.cols,
    );

    writeFileSync(outputPath, PNG.sync.write(png));
}

function loadBunkerImage(): OpenCvImageData {
    const file = readFileSync("tests/fixtures/bunker.png");
    const png = PNG.sync.read(file);

    return {
        width: png.width,
        height: png.height,
        data: new Uint8ClampedArray(png.data)
    };
}

function writeOverlay(
    imageData: OpenCvImageData,
    points: readonly { x: number; y: number }[],
    outputPath: string
): void {
    const png = new PNG({
        width: imageData.width,
        height: imageData.height
    });

    png.data.set(imageData.data);

    const setPixel = (x: number, y: number): void => {
        if (x < 0 || x >= imageData.width) return;
        if (y < 0 || y >= imageData.height) return;
        const i = (y * imageData.width + x) * 4;
        png.data[i] = 255;
        png.data[i + 1] = 0;
        png.data[i + 2] = 0;
        png.data[i + 3] = 255;
    };

    const drawLine = (
        x0: number,
        y0: number,
        x1: number,
        y1: number
    ): void => {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x0;
        let y = y0;

        while (true) {
            setPixel(x, y);
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    };

    const n = points.length;
    for (let i = 0; i < n; i += 1) {
        const a = points[i];
        const b = points[(i + 1) % n];
        drawLine(
            Math.round(a.x),
            Math.round(a.y),
            Math.round(b.x),
            Math.round(b.y)
        );
    }

    writeFileSync(outputPath, PNG.sync.write(png));
}

describe("BunkerDetector", () => {
    it("detects a bunker from a seed on sand", () => {
        const adapter = new OpenCvJsAdapter(openCvRuntime);
        const imageData = loadBunkerImage();

        const seed = { x: 269, y: 415 };

        const rawMask =
            adapter.createSeedGuidedRegionMaskForDiagnostics(
                imageData,
                seed,
                BUNKER_MASK_OPTIONS,
            );

        writeMaskImage(
            rawMask,
            "tests/fixtures/bunker-mask.png",
        );

        const points = adapter.detectBunkerBoundary(imageData, seed);

        console.log("[Polygon]", points);
        
        console.log(
            "[BunkerTest] point count:",
            points.length
        );

        if (points.length > 0) {
            const xs = points.map((p) => p.x);
            const ys = points.map((p) => p.y);
            console.log(
                "[BunkerTest] bounds:",
                Math.min(...xs),
                Math.max(...xs),
                Math.min(...ys),
                Math.max(...ys)
            );

            writeOverlay(
                imageData,
                points,
                "tests/fixtures/bunker-detected.png"
            );

            const maskBoundary =
            adapter.extractBoundaryByRaysForDiagnostics(
                rawMask,
                seed,
            );

            writeOverlay(
                imageData,
                maskBoundary,
                "tests/fixtures/bunker-mask-boundary.png"
            );
        }
            rawMask.delete();
        expect(points.length).toBeGreaterThanOrEqual(3);
    }, 30000);
});