import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { loadOpenCV } from "@opencvjs/node";
import { OpenCvJsAdapter } from "../../src/application/opencv/OpenCvJsAdapter";

describe("RealImageAdapter diagnostic", () => {
    it("detects the seeded green area in the real image", async () => {
        const imagePath = path.join(
            process.env.USERPROFILE ?? "",
            "Downloads",
            "hole 2.png"
        );

        expect(fs.existsSync(imagePath)).toBe(true);

        const png = PNG.sync.read(
            fs.readFileSync(imagePath)
        );

        const cv = await loadOpenCV();

        const mat = cv.matFromImageData({
            width: png.width,
            height: png.height,
            data: new Uint8ClampedArray(png.data)
        });

        try {
            const adapter = new OpenCvJsAdapter(cv);

            const seed = {
                x: 235,
                y: 350
            };

            const seedOffset =
                (seed.y * png.width + seed.x) * 4;

            const seedR =
                png.data[seedOffset] ?? 0;

            const seedG =
                png.data[seedOffset + 1] ?? 0;

            const seedB =
                png.data[seedOffset + 2] ?? 0;

            expect(seedG).toBeGreaterThanOrEqual(50);
            expect(
                seedG - Math.max(seedR, seedB)
            ).toBeGreaterThanOrEqual(10);

            const contours =
                adapter.findContours(
                    mat,
                    seed
                );

            expect(contours.length).toBeGreaterThan(0);

            const containingContours =
                contours.filter(
                    contour => {
                        if (
                            contour.points.length === 0
                        ) {
                            return false;
                        }

                        const xs =
                            contour.points.map(
                                point => point.x
                            );

                        const ys =
                            contour.points.map(
                                point => point.y
                            );

                        return (
                            seed.x >= Math.min(...xs) &&
                            seed.x <= Math.max(...xs) &&
                            seed.y >= Math.min(...ys) &&
                            seed.y <= Math.max(...ys)
                        );
                    }
                );

            expect(
                containingContours.length
            ).toBeGreaterThan(0);
        } finally {
            mat.delete();
        }
    });
});