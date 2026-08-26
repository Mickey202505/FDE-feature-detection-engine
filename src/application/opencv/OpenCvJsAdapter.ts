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
            /*
             * The input image is already an RGBA OpenCV Mat.
             *
             * Do not use cvtColor() or inRange() here.
             *
             * The Node OpenCV.js build used by this project can
             * abort inside cvtColor(), and there is no need to
             * convert the image just to inspect RGB pixels.
             *
             * Instead, read the source pixels directly and build
             * a single-channel binary mask.
             */
            binaryImage = this.createBinaryImage(
                image,
                seed
            );
        let maskPixels = 0;

        if (binaryImage.ucharPtr !== undefined) {
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
                        binaryImage.ucharPtr(y, x);

                    if ((pixel[0] ?? 0) > 0) {
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
                            1.0,
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
                binaryImage !== undefined
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

    if (image.ucharPtr === undefined) {
        throw new Error(
            "OpenCV runtime does not support pixel access."
        );
    }

    const binary =
    new this.cv.Mat(
        source.rows,
        source.cols,
        CV_8U
    );

    try {
        if (binary.ucharPtr === undefined) {
            throw new Error(
                "OpenCV runtime does not support binary pixel access."
            );
        }

        /*
         * Diagnostic:
         * verify that the source image actually contains
         * the expected RGB values at the seed.
         */
        if (seed !== undefined) {
            const seedX = Math.round(seed.x);
            const seedY = Math.round(seed.y);

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
         * For now, deliberately write one known pixel.
         */
        const testPixel =
            binary.ucharPtr(0, 0);

        testPixel[0] = 255;

        console.log(
            "OpenCvJsAdapter binary test pixel:",
            binary.ucharPtr(0, 0)[0]
        );

        /*
         * Now perform the normal mask creation.
         */
        if (seed !== undefined) {
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
            image.ucharPtr === undefined ||
            binary.ucharPtr === undefined
        ) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
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

        /*
         * The input is RGBA:
         *
         *   pixel[0] = R
         *   pixel[1] = G
         *   pixel[2] = B
         *   pixel[3] = A
         */
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

        /*
         * A seed is only accepted when the actual seed pixel
         * is green.
         *
         * This preserves the required behaviour:
         *
         *   green seed     -> detect green region
         *   grey seed      -> no contours
         *   white seed     -> no contours
         */
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
            this.clearMask(binary);
            return;
        }

        /*
         * Use a modest tolerance around the sampled colour.
         *
         * This allows the test image with:
         *
         *   R = 40..49
         *   G = 180..189
         *   B = 40..49
         *
         * to remain one connected green region.
         */
        const tolerance = 30;

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

    private createAutomaticMask(
        image: OpenCvMat,
        binary: OpenCvMat
    ): void {
        if (
            image.ucharPtr === undefined ||
            binary.ucharPtr === undefined
        ) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
        }

        /*
         * Automatic detection deliberately uses the same
         * direct RGB test as the seeded detector.
         *
         * A pixel is considered green when:
         *
         *   G >= 50
         *   G - max(R, B) >= 10
         *
         * This rejects bright neutral pixels such as:
         *
         *   220,220,220
         *
         * because green does not dominate red/blue.
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
            binary.ucharPtr === undefined
        ) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
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