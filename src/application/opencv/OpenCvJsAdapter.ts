import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";
import type { OpenCvAdapter } from "./OpenCvAdapter";

export class OpenCvJsAdapter implements OpenCvAdapter {
    private readonly cv: OpenCvRuntime;

    public constructor(cv: OpenCvRuntime) {
        this.cv = cv;
    }

    public findContours(
        image: OpenCvMat,
        seed?: PixelPoint
    ): readonly OpenCvContour[] {
        this.validateImage(image);

        const contours = new this.cv.MatVector();
        const hierarchy = new this.cv.Mat();

        let binaryImage: OpenCvMat | undefined;

        try {
            binaryImage =
                this.createBinaryImage(
                    image,
                    seed
                );

            this.cv.findContours(
                binaryImage,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE
            );

            const result: OpenCvContour[] = [];

            for (
                let i = 0;
                i < contours.size();
                i += 1
            ) {
                const contour =
                    contours.get(i);

                const approx =
                    new this.cv.Mat();

                try {
                    if (
                        this.cv.approxPolyDP !==
                        undefined
                    ) {
                        const perimeter =
                            this.cv.arcLength !==
                            undefined
                                ? this.cv.arcLength(
                                      contour,
                                      true
                                  )
                                : 0;

                        const epsilon =
                            perimeter > 0
                                ? perimeter * 0.01
                                : 3.0;

                        this.cv.approxPolyDP(
                            contour,
                            approx,
                            epsilon,
                            true
                        );

                        result.push({
                            points:
                                this.readPoints(
                                    approx
                                )
                        });
                    } else {
                        result.push({
                            points:
                                this.readPoints(
                                    contour
                                )
                        });
                    }
                } finally {
                    approx.delete();
                    contour.delete();
                }
            }

            return result;
        } finally {
            if (
                binaryImage !==
                undefined
            ) {
                binaryImage.delete();
            }

            hierarchy.delete();
            contours.delete();
        }
    }

    private createBinaryImage(
        image: OpenCvMat,
        seed?: PixelPoint
    ): OpenCvMat {
        const CV_8U =
            this.cv.CV_8U ?? 0;

        const binary =
            new this.cv.Mat(
                image.rows,
                image.cols,
                CV_8U
            );

        try {
            if (
                image.ucharPtr ===
                    undefined ||
                binary.ucharPtr ===
                    undefined
            ) {
                return binary;
            }

            if (
                seed !== undefined
            ) {
                this.createSeededMask(
                    image,
                    binary,
                    seed
                );

                this.cleanSeededMask(
                    binary
                );
            } else {
                this.createAutomaticMask(
                    image,
                    binary
                );
            }

            return binary;
        } catch (error) {
            binary.delete();
            throw error;
        }
    }

    private createSeededMask(
        image: OpenCvMat,
        binary: OpenCvMat,
        seed: PixelPoint
    ): void {
        if (
            image.ucharPtr ===
                undefined ||
            binary.ucharPtr ===
                undefined
        ) {
            return;
        }

        const seedX =
            Math.round(seed.x);

        const seedY =
            Math.round(seed.y);

        if (
            seedX < 0 ||
            seedX >= image.cols ||
            seedY < 0 ||
            seedY >= image.rows
        ) {
            throw new Error(
                "Seed point is outside the image."
            );
        }

        const seedPixel =
            image.ucharPtr(
                seedY,
                seedX
            );

        const seedR =
            seedPixel[0] ?? 0;

        const seedG =
            seedPixel[1] ?? 0;

        const seedB =
            seedPixel[2] ?? 0;

        const seedDominance =
            seedG -
            Math.max(
                seedR,
                seedB
            );

        const seedIsGreen =
            seedG >= 50 &&
            seedDominance >= 10;

        if (
            !seedIsGreen
        ) {
            this.clearMask(
                binary
            );

            return;
        }

        const tolerance = 35;

        const lowerR =
            Math.max(
                0,
                seedR - tolerance
            );

        const lowerG =
            Math.max(
                0,
                seedG - tolerance
            );

        const lowerB =
            Math.max(
                0,
                seedB - tolerance
            );

        const upperR =
            Math.min(
                255,
                seedR + tolerance
            );

        const upperG =
            Math.min(
                255,
                seedG + tolerance
            );

        const upperB =
            Math.min(
                255,
                seedB + tolerance
            );

        for (
            let y = 0;
            y < image.rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < image.cols;
                x += 1
            ) {
                const pixel =
                    image.ucharPtr(
                        y,
                        x
                    );

                const r =
                    pixel[0] ?? 0;

                const g =
                    pixel[1] ?? 0;

                const b =
                    pixel[2] ?? 0;

                const insideColourRange =
                    r >= lowerR &&
                    r <= upperR &&
                    g >= lowerG &&
                    g <= upperG &&
                    b >= lowerB &&
                    b <= upperB;

                const greenDominance =
                    g -
                    Math.max(
                        r,
                        b
                    );

                const isGreen =
                    insideColourRange &&
                    g >= 50 &&
                    greenDominance >= 10;

                const output =
                    binary.ucharPtr(
                        y,
                        x
                    );

                output[0] =
                    isGreen
                        ? 255
                        : 0;
            }
        }
    }

    private cleanSeededMask(
        binary: OpenCvMat
    ): void {
        if (
            binary.ucharPtr ===
            undefined
        ) {
            return;
        }

        const rows =
            binary.rows;

        const cols =
            binary.cols;

        /*
         * Copy the mask first so that every decision is based on the
         * original mask rather than on pixels modified earlier in the pass.
         *
         * Only remove an isolated foreground pixel when it has no meaningful
         * foreground support around it. In particular, do not erode the
         * boundary of a legitimate green region.
         */
        const values =
            new Uint8Array(
                rows * cols
            );

        for (
            let y = 0;
            y < rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < cols;
                x += 1
            ) {
                const pixel =
                    binary.ucharPtr(
                        y,
                        x
                    );

                values[
                    y * cols + x
                ] =
                    pixel[0] ?? 0;
            }
        }

        for (
            let y = 1;
            y < rows - 1;
            y += 1
        ) {
            for (
                let x = 1;
                x < cols - 1;
                x += 1
            ) {
                const index =
                    y * cols + x;

                if (
                    values[index] === 0
                ) {
                    continue;
                }

                let neighbours = 0;

                for (
                    let dy = -1;
                    dy <= 1;
                    dy += 1
                ) {
                    for (
                        let dx = -1;
                        dx <= 1;
                        dx += 1
                    ) {
                        if (
                            dx === 0 &&
                            dy === 0
                        ) {
                            continue;
                        }

                        if (
                            values[
                                (y + dy) *
                                    cols +
                                    (x + dx)
                            ] > 0
                        ) {
                            neighbours += 1;
                        }
                    }
                }

                /*
                 * A single foreground pixel is noise.
                 *
                 * Two or more neighbouring pixels are enough to preserve
                 * the pixel because it may be part of a thin but legitimate
                 * boundary. This avoids moving the detected contour inward.
                 */
                if (
                    neighbours === 0
                ) {
                    binary.ucharPtr(
                        y,
                        x
                    )[0] = 0;
                }
            }
        }
    }

    private createAutomaticMask(
        image: OpenCvMat,
        binary: OpenCvMat
    ): void {
        if (
            image.ucharPtr ===
                undefined ||
            binary.ucharPtr ===
                undefined
        ) {
            return;
        }

        for (
            let y = 0;
            y < image.rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < image.cols;
                x += 1
            ) {
                const pixel =
                    image.ucharPtr(
                        y,
                        x
                    );

                const r =
                    pixel[0] ?? 0;

                const g =
                    pixel[1] ?? 0;

                const b =
                    pixel[2] ?? 0;

                const greenDominance =
                    g -
                    Math.max(
                        r,
                        b
                    );

                const isGreen =
                    g >= 50 &&
                    greenDominance >= 10;

                const output =
                    binary.ucharPtr(
                        y,
                        x
                    );

                output[0] =
                    isGreen
                        ? 255
                        : 0;
            }
        }
    }

    private clearMask(
        binary: OpenCvMat
    ): void {
        if (
            binary.ucharPtr ===
                undefined
        ) {
            return;
        }

        for (
            let y = 0;
            y < binary.rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < binary.cols;
                x += 1
            ) {
                const pixel =
                    binary.ucharPtr(
                        y,
                        x
                    );

                pixel[0] = 0;
            }
        }
    }

    private validateImage(
        image: OpenCvMat
    ): void {
        if (
            image.rows <= 0 ||
            image.cols <= 0
        ) {
            throw new Error(
                "OpenCV image must have positive dimensions."
            );
        }
    }

    private readPoints(
        contour: OpenCvMat
    ): readonly {
        x: number;
        y: number;
    }[] {
        const data =
            contour.data32S ??
            new Int32Array();

        const points: {
            x: number;
            y: number;
        }[] = [];

        for (
            let i = 0;
            i + 1 < data.length;
            i += 2
        ) {
            points.push({
                x: data[i] ?? 0,
                y: data[i + 1] ?? 0
            });
        }

        return points;
    }
}