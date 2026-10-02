"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const node_fs_1 = require("node:fs");
const pngjs_1 = require("pngjs");
const OpenCvJsAdapter_1 = require("../../src/application/opencv/OpenCvJsAdapter");
const OpenCvJsRuntime_1 = __importDefault(require("../../src/infrastructure/opencv/OpenCvJsRuntime"));
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
    let whiteCount = 0;
    for (let y = 0; y < mask.rows; y += 1) {
        for (let x = 0; x < mask.cols; x += 1) {
            const value = mask.ucharPtr(y, x)[0];
            if (value !== 0)
                whiteCount += 1;
        }
    }
    console.log("[MaskWrite] white pixels:", whiteCount, "of", mask.rows * mask.cols);
    (0, node_fs_1.writeFileSync)(outputPath, pngjs_1.PNG.sync.write(png));
}
function loadBunkerImage() {
    const file = (0, node_fs_1.readFileSync)("tests/fixtures/bunker-norim-1.png");
    const png = pngjs_1.PNG.sync.read(file);
    return {
        width: png.width,
        height: png.height,
        data: new Uint8ClampedArray(png.data)
    };
}
function writeOverlay(imageData, points, outputPath) {
    const png = new pngjs_1.PNG({
        width: imageData.width,
        height: imageData.height
    });
    png.data.set(imageData.data);
    const setPixel = (x, y) => {
        if (x < 0 || x >= imageData.width)
            return;
        if (y < 0 || y >= imageData.height)
            return;
        const i = (y * imageData.width + x) * 4;
        png.data[i] = 255;
        png.data[i + 1] = 0;
        png.data[i + 2] = 0;
        png.data[i + 3] = 255;
    };
    const drawLine = (x0, y0, x1, y1) => {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        let x = x0;
        let y = y0;
        while (true) {
            setPixel(x, y);
            if (x === x1 && y === y1)
                break;
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
        drawLine(Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y));
    }
    // Yellow markers at every vertex
    for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        for (let dx = -1; dx <= 1; dx += 1) {
            for (let dy = -1; dy <= 1; dy += 1) {
                const px = Math.round(p.x) + dx;
                const py = Math.round(p.y) + dy;
                if (px < 0 || px >= imageData.width)
                    continue;
                if (py < 0 || py >= imageData.height)
                    continue;
                const i2 = (py * imageData.width + px) * 4;
                png.data[i2] = 255;
                png.data[i2 + 1] = 255;
                png.data[i2 + 2] = 0;
                png.data[i2 + 3] = 255;
            }
        }
    }
    const buffer = pngjs_1.PNG.sync.write(png);
    // --- Delete the previous file first. If it is locked, fall back to a
    // --- timestamped filename so the output is always fresh.
    const fs = require("node:fs");
    const path = require("node:path");
    const absoluteOutput = path.isAbsolute(outputPath)
        ? outputPath
        : path.resolve(process.cwd(), outputPath);
    let finalPath = absoluteOutput;
    let deletedOldFile = false;
    if (fs.existsSync(finalPath)) {
        try {
            fs.unlinkSync(finalPath);
            deletedOldFile = true;
            console.log("[WriteOverlay] deleted old file:", finalPath);
        }
        catch (unlinkErr) {
            console.warn("[WriteOverlay] could not delete old file (locked by another process?)", finalPath);
            console.warn(unlinkErr);
            // Fall back to a timestamped filename.
            const dir = path.dirname(absoluteOutput);
            const ext = path.extname(absoluteOutput);
            const base = path.basename(absoluteOutput, ext);
            const stamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-");
            finalPath = path.join(dir, `${base}-${stamp}${ext}`);
            console.warn("[WriteOverlay] writing to fallback path instead:", finalPath);
        }
    }
    console.log("[WriteOverlay] attempting ->", finalPath);
    console.log("[WriteOverlay] cwd:", process.cwd());
    console.log("[WriteOverlay] buffer bytes:", buffer.length);
    try {
        (0, node_fs_1.writeFileSync)(finalPath, buffer);
    }
    catch (err) {
        console.error("[WriteOverlay] FAILED to write", finalPath);
        console.error(err);
        throw err;
    }
    const stat = (0, node_fs_1.statSync)(finalPath);
    console.log("[WriteOverlay] SUCCESS", finalPath, "| bytes:", stat.size, "| mtime:", stat.mtime.toISOString(), "| deletedOldFile:", deletedOldFile);
}
(0, vitest_1.describe)("BunkerDetector", () => {
    (0, vitest_1.it)("detects a bunker from a seed on sand", () => {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(OpenCvJsRuntime_1.default);
        const imageData = loadBunkerImage();
        const seed = { x: 620, y: 638 };
        const rawMask = adapter.createSeedGuidedRegionMaskForDiagnostics(imageData, seed, OpenCvJsAdapter_1.BUNKER_MASK_OPTIONS);
        writeMaskImage(rawMask, "tests/fixtures/bunker-mask.png");
        // Use the perfect mask we already generated, not a new ray-cast attempt
        const points = adapter.extractBoundaryFromMask(rawMask, 14);
        let totalPerim = 0;
        for (let i = 0; i < points.length; i += 1) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            totalPerim += Math.hypot(b.x - a.x, b.y - a.y);
        }
        console.log("[BunkerTest] polygon perimeter:", Math.round(totalPerim));
        console.log("[BunkerTest] polygon point count:", points.length);
        if (points.length > 0) {
            const xs = points.map((p) => p.x);
            const ys = points.map((p) => p.y);
            console.log("[BunkerTest] bounds:", Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys));
            writeOverlay(imageData, points, "tests/fixtures/bunker-norim-1-detected.png");
        }
        rawMask.delete();
        (0, vitest_1.expect)(points.length).toBeGreaterThanOrEqual(3);
    }, 30000);
});
//# sourceMappingURL=BunkerDetection.test.js.map