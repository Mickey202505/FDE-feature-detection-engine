import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { PNG } from "pngjs";
import { loadOpenCV } from "@opencvjs/node";
import { OpenCvJsAdapter } from "./src/application/opencv/OpenCvJsAdapter";

describe("RealImageAdapter diagnostic", () => {
    it("runs the diagnostic", async () => {
        const imagePath =
            "C:\\Users\\Mickey\\Downloads\\hole 2.png";

        const png =
            PNG.sync.read(
                fs.readFileSync(imagePath)
            );

        const cv =
            await loadOpenCV();

        const mat =
            cv.matFromImageData({
                width: png.width,
                height: png.height,
                data: new Uint8ClampedArray(png.data)
            });

        try {
            const adapter =
                new OpenCvJsAdapter(cv);

            const seed = {
                x: 235,
                y: 350
            };

            console.log(
                "Image:",
                png.width,
                "x",
                png.height
            );

            console.log(
                "Seed:",
                seed
            );

            console.log(
                "Seed RGB:",
                {
                    r: png.data[
                        (seed.y * png.width + seed.x) * 4
                    ],
                    g: png.data[
                        (seed.y * png.width + seed.x) * 4 + 1
                    ],
                    b: png.data[
                        (seed.y * png.width + seed.x) * 4 + 2
                    ]
                }
            );

            const contours =
                adapter.findContours(
                    mat,
                    seed
                );

            console.log(
                "Contours found:",
                contours.length
            );

            contours.forEach(
                (contour, index) => {
                    console.log(
                        `Contour ${index}:`,
                        "points =",
                        contour.points.length
                    );

                    if (
                        contour.points.length === 0
                    ) {
                        return;
                    }

                    const xs =
                        contour.points.map(
                            point => point.x
                        );

                    const ys =
                        contour.points.map(
                            point => point.y
                        );

                    console.log({
                        minX: Math.min(...xs),
                        maxX: Math.max(...xs),
                        minY: Math.min(...ys),
                        maxY: Math.max(...ys)
                    });

                    console.log(
                        "First 20 points:",
                        contour.points.slice(0, 20)
                    );
                }
            );

            // The diagnostic completed successfully.
            expect(contours).toBeDefined();

        } finally {
            mat.delete();
        }
    });
});