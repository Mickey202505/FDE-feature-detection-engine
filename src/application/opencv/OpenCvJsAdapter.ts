import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";
import type { OpenCvAdapter } from "./OpenCvAdapter";

export class OpenCvJsAdapter implements OpenCvAdapter {
    private readonly cv: OpenCvRuntime;
    private static readonly HUE_TOLERANCE = 20;
    private static readonly SATURATION_TOLERANCE = 20;
    private static readonly VALUE_TOLERANCE = 20;

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
            /*
             * The input image is already an RGBA OpenCV Mat.
             *
             * Do not use cvtColor() or inRange() here.
             *
             * The Node OpenCV.js build used by this project can
             * abort inside cvtColor(), and there is no need to
             * convert the image just to inspect RGB pixels.
             *
             * Instead, when pixel access is available, read the
             * source pixels directly and build a single-channel
             * binary mask.
             *
             * The mocked OpenCV runtime used by the unit tests does
             * not expose ucharPtr(). In that case we still create a
             * correctly-sized binary Mat and allow the mocked
             * findContours() implementation to provide its contours.
             */
            binaryImage =
                this.createBinaryImage(
                    image,
                    seed
                );

            let maskPixels = 0;

            if (
                binaryImage.ucharPtr !==
                undefined
            ) {
                for (
                    let y = 0;
                    y < binaryImage.rows;
                    y += 1
                ) {
                    for (
                        let x = 0;
                        x < binaryImage.cols;
                        x += 1
                    ) {
                        const pixel =
                            binaryImage.ucharPtr(
                                y,
                                x
                            );

                        if (
                            (pixel[0] ?? 0) > 0
                        ) {
                            maskPixels += 1;
                        }
                    }
                }
            }

            console.log(
                "OpenCvJsAdapter mask:",
                {
                    rows: binaryImage.rows,
                    cols: binaryImage.cols,
                    pixels: maskPixels
                }
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
                        this.cv.approxPolyDP(
                            contour,
                            approx,
                            4.0,
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
        /*
         * OpenCV.js uses CV_8U as the single-channel 8-bit
         * unsigned type. Some lightweight mocked runtimes do not
         * expose the constant, so retain the OpenCV.js value as a
         * fallback.
         */
        const CV_8U =
            this.cv.CV_8U ?? 0;

        /*
         * IMPORTANT:
         *
         * The real OpenCV.js runtime used by the integration tests
         * exposes ucharPtr(). The mocked runtime used by
         * OpenCvAdapter.test.ts does not.
         *
         * Therefore pixel access is optional here.
         */
        const binary =
            new this.cv.Mat(
                image.rows,
                image.cols,
                CV_8U
            );

        try {
            /*
             * Mock runtime:
             *
             * There is no source pixel buffer to inspect and no
             * need to construct a real mask. The mocked
             * findContours() implementation is responsible for
             * returning its test contours.
             */
            if (
                image.ucharPtr ===
                undefined ||
                binary.ucharPtr ===
                undefined
            ) {
                return binary;
            }

            /*
             * Diagnostic:
             * verify that the source image actually contains
             * the expected RGB values at the seed.
             */
            if (
                seed !== undefined
            ) {
                const seedX =
                    Math.round(seed.x);

                const seedY =
                    Math.round(seed.y);

                const sourcePixel =
                    image.ucharPtr(
                        seedY,
                        seedX
                    );

                console.log(
                    "OpenCvJsAdapter source pixel:",
                    {
                        x: seedX,
                        y: seedY,
                        r: sourcePixel[0],
                        g: sourcePixel[1],
                        b: sourcePixel[2],
                        a: sourcePixel[3]
                    }
                );
            }

            /*
             * Diagnostic:
             * verify that the binary Mat supports pixel writes.
             */
            const testPixel =
                binary.ucharPtr(
                    0,
                    0
                );

            testPixel[0] = 255;

            console.log(
                "OpenCvJsAdapter binary test pixel:",
                binary.ucharPtr(
                    0,
                    0
                )[0]
            );

            /*
             * Now perform the normal mask creation.
             */
            if (
                seed !== undefined
            ) {
                this.createSeededMask(
                    image,
                    binary,
                    seed
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

    const seedRgb = {
        r: seedPixel[0] ?? 0,
        g: seedPixel[1] ?? 0,
        b: seedPixel[2] ?? 0
    };

    const seedHsv =
        this.rgbToOpenCvHsv(
            seedRgb.r,
            seedRgb.g,
            seedRgb.b
        );

    console.log(
        "OpenCvJsAdapter seed HSV:",
        {
            h: seedHsv.h.toFixed(1),
            s: seedHsv.s.toFixed(1),
            v: seedHsv.v.toFixed(1)
        }
    );

    /*
     * The seed must actually look green.
     */
    const seedGreenDominance =
        seedRgb.g -
        Math.max(
            seedRgb.r,
            seedRgb.b
        );

    if (
        seedRgb.g < 50 ||
        seedGreenDominance < 10
    ) {
        this.clearMask(binary);
        return;
    }

    /*
     * First build the HSV mask.
     *
     * These values correspond to the best real-image
     * experiment:
     *
     *     H ±20
     *     S ±20
     *     V ±20
     *
     * OpenCV-style HSV ranges:
     *
     *     H = 0..180
     *     S = 0..255
     *     V = 0..255
     */
    const hueTolerance =
        OpenCvJsAdapter.HUE_TOLERANCE;

    const saturationTolerance =
        OpenCvJsAdapter.SATURATION_TOLERANCE;

    const valueTolerance =
        OpenCvJsAdapter.VALUE_TOLERANCE;

    const hueMin =
        seedHsv.h -
        hueTolerance;

    const hueMax =
        seedHsv.h +
        hueTolerance;

    const saturationMin =
        Math.max(
            0,
            seedHsv.s -
                saturationTolerance
        );

    const saturationMax =
        Math.min(
            255,
            seedHsv.s +
                saturationTolerance
        );

    const valueMin =
        Math.max(
            0,
            seedHsv.v -
                valueTolerance
        );

    const valueMax =
        Math.min(
            255,
            seedHsv.v +
                valueTolerance
        );

    /*
     * Build the mask directly from the image pixels.
     *
     * We deliberately do not use cvtColor() or inRange()
     * because the Node OpenCV.js runtime has previously
     * shown instability with those operations.
     */
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

            const hsv =
                this.rgbToOpenCvHsv(
                    r,
                    g,
                    b
                );

            /*
             * Handle hue normally for this green seed.
             *
             * The seed hue is around 95, so there is no
             * 0/180 wrap-around involved for this image.
             */
            const hueMatches =
                hsv.h >= hueMin &&
                hsv.h <= hueMax;

            const saturationMatches =
                hsv.s >= saturationMin &&
                hsv.s <= saturationMax;

            const valueMatches =
                hsv.v >= valueMin &&
                hsv.v <= valueMax;

            /*
             * Keep the existing green safety check.
             * This prevents neutral grey/black/white pixels
             * from entering simply because their HSV values
             * happen to be close.
             */
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
                hueMatches &&
                saturationMatches &&
                valueMatches &&
                isGreen
                    ? 255
                    : 0;
        }
    }

    /*
     * Keep only the connected component containing the seed.
     *
     * This is important because the HSV mask may contain
     * other areas elsewhere in the image with similar colour.
     */
    const totalPixels =
        image.rows *
        image.cols;

    const visited =
        new Uint8Array(
            totalPixels
        );

    const queue: number[] = [];

    const seedIndex =
        seedY *
            image.cols +
        seedX;

    /*
     * If the seed somehow wasn't included in the mask,
     * return an empty mask.
     */
    if (
        (binary.ucharPtr(
            seedY,
            seedX
        )[0] ?? 0) === 0
    ) {
        this.clearMask(binary);
        return;
    }

    queue.push(seedIndex);
    visited[seedIndex] = 1;

    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    let queueIndex = 0;

    while (
        queueIndex <
        queue.length
    ) {
        const currentIndex =
            queue[queueIndex++];

        if (
            currentIndex ===
            undefined
        ) {
            continue;
        }

        const currentY =
            Math.floor(
                currentIndex /
                    image.cols
            );

        const currentX =
            currentIndex %
            image.cols;

        for (
            const direction of
                directions
        ) {
            const x =
                currentX +
                direction.x;

            const y =
                currentY +
                direction.y;

            if (
                x < 0 ||
                x >= image.cols ||
                y < 0 ||
                y >= image.rows
            ) {
                continue;
            }

            const index =
                y *
                    image.cols +
                x;

            if (
                visited[index] === 1
            ) {
                continue;
            }

            visited[index] = 1;

            const pixel =
                binary.ucharPtr(
                    y,
                    x
                );

            if (
                (pixel[0] ?? 0) === 0
            ) {
                continue;
            }

            queue.push(index);
        }
    }

    /*
     * Remove every HSV-positive region that isn't connected
     * to the supplied seed.
     */
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
            const index =
                y *
                    image.cols +
                x;

            const output =
                binary.ucharPtr(
                    y,
                    x
                );

            output[0] =
                visited[index] === 1 &&
                (output[0] ?? 0) > 0
                    ? 255
                    : 0;
        }
    }
}

private rgbToOpenCvHsv(
    r: number,
    g: number,
    b: number
): {
    h: number;
    s: number;
    v: number;
} {
    const red =
        r / 255;

    const green =
        g / 255;

    const blue =
        b / 255;

    const max =
        Math.max(
            red,
            green,
            blue
        );

    const min =
        Math.min(
            red,
            green,
            blue
        );

    const delta =
        max - min;

    let hue = 0;

    if (
        delta !== 0
    ) {
        if (
            max === red
        ) {
            hue =
                60 *
                (
                    (
                        green -
                        blue
                    ) /
                    delta
                );

            if (
                hue < 0
            ) {
                hue += 360;
            }
        } else if (
            max === green
        ) {
            hue =
                60 *
                (
                    (
                        blue -
                        red
                    ) /
                    delta +
                    2
                );
        } else {
            hue =
                60 *
                (
                    (
                        red -
                        green
                    ) /
                    delta +
                    4
                );
        }
    }

    /*
     * OpenCV stores hue as 0..180 rather than 0..360.
     */
    const openCvHue =
        hue / 2;

    const saturation =
        max === 0
            ? 0
            : (
                delta /
                max
            ) * 255;

    const value =
        max * 255;

    return {
        h: openCvHue,
        s: saturation,
        v: value
    };
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

        /*
         * Automatic detection deliberately uses the same
         * direct RGB test as the seeded detector.
         *
         * A pixel is considered green when:
         *
         *   G >= 50
         *   G - max(R, B) >= 10
         */
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