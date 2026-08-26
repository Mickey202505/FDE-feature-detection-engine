import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";
import type { OpenCvAdapter } from "./OpenCvAdapter";

export class OpenCvJsAdapter implements OpenCvAdapter {
    private readonly cv: OpenCvRuntime;

    public constructor(
        cv: OpenCvRuntime
    ) {
        this.cv = cv;
    }

    public findContours(
        image: OpenCvMat,
        seed?: PixelPoint
    ): readonly OpenCvContour[] {
        this.validateImage(image);

        const contours =
            new this.cv.MatVector();

        const hierarchy =
            new this.cv.Mat();

        let workingImage:
            OpenCvMat = image;

        let binaryImage:
            OpenCvMat | undefined;

        try {
            binaryImage =
                this.createBinaryImage(
                    image,
                    seed
                );

            if (
                binaryImage !== undefined
            ) {
                workingImage =
                    binaryImage;
            }

            this.cv.findContours(
                workingImage,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE
            );

            const result:
                OpenCvContour[] = [];

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
    ): OpenCvMat | undefined {
        /*
         * We deliberately do NOT use cvtColor() here.
         *
         * The @opencvjs/node runtime currently aborts when
         * cvtColor() is called with the RGBA Mat created by
         * the integration test.
         *
         * The detector only needs the R/G/B channels, so we
         * can safely inspect the RGBA pixels directly.
         */

        if (
            this.cv.getStructuringElement ===
                undefined ||
            this.cv.morphologyEx ===
                undefined ||
            this.cv.MORPH_ELLIPSE ===
                undefined ||
            this.cv.MORPH_CLOSE ===
                undefined ||
            this.cv.CV_8U ===
                undefined
        ) {
            return undefined;
        }

        const binary =
            new this.cv.Mat(
                image.rows,
                image.cols,
                this.cv.CV_8U
            );

        try {
            if (
                seed !== undefined
            ) {
                return this
                    .createSeededGreenMaskFromRgba(
                        image,
                        binary,
                        seed
                    );
            }

            return this
                .createAutomaticGreenMaskFromRgba(
                    image,
                    binary
                );
        } catch (error) {
            binary.delete();
            throw error;
        }
    }

    private createSeededGreenMaskFromRgba(
        image: OpenCvMat,
        binary: OpenCvMat,
        seed: PixelPoint
    ): OpenCvMat {
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

        if (
            image.ucharPtr ===
            undefined
        ) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
        }

        const seedPixel =
            image.ucharPtr(
                seedY,
                seedX
            );

        /*
         * The integration test creates the RGBA Mat with:
         *
         *   pixel[0] = R
         *   pixel[1] = G
         *   pixel[2] = B
         *   pixel[3] = A
         */
        const seedR =
            seedPixel[0] ?? 0;

        const seedG =
            seedPixel[1] ?? 0;

        const seedB =
            seedPixel[2] ?? 0;

        /*
         * A supplied seed must actually be green.
         *
         * This prevents a seed on grey, white, black, or
         * another non-green area from producing a contour.
         */
        if (
            seedG <= seedR ||
            seedG <= seedB ||
            seedG -
                Math.max(
                    seedR,
                    seedB
                ) < 10
        ) {
            return binary;
        }

        /*
         * Allow modest variation from the seed colour.
         */
        const tolerance = 30;

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

                const matches =
                    Math.abs(
                        r - seedR
                    ) <= tolerance &&
                    Math.abs(
                        g - seedG
                    ) <= tolerance &&
                    Math.abs(
                        b - seedB
                    ) <= tolerance;

                const output =
                    binary.ucharPtr?.(
                        y,
                        x
                    );

                if (
                    output !==
                    undefined
                ) {
                    output[0] =
                        matches
                            ? 255
                            : 0;
                }
            }
        }

        this.closeMask(
            binary
        );

        return binary;
    }

    private createAutomaticGreenMaskFromRgba(
        image: OpenCvMat,
        binary: OpenCvMat
    ): OpenCvMat {
        if (
            image.ucharPtr ===
            undefined
        ) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
        }

        if (
            binary.ucharPtr ===
            undefined
        ) {
            throw new Error(
                "OpenCV runtime does not support binary pixel access."
            );
        }

        /*
         * Automatic green detection.
         *
         * A pixel is considered green when:
         *
         *   G >= 50
         *   G is at least 10 greater than R/B
         *
         * This rejects neutral grey/white regions while
         * allowing modest variation in green imagery.
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
                    greenDominance >=
                        10;

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

        this.closeMask(
            binary
        );

        return binary;
    }

    private closeMask(
        binary: OpenCvMat
    ): void {
        if (
            this.cv.getStructuringElement ===
                undefined ||
            this.cv.morphologyEx ===
                undefined ||
            this.cv.MORPH_ELLIPSE ===
                undefined ||
            this.cv.MORPH_CLOSE ===
                undefined
        ) {
            return;
        }

        const kernel =
            this.cv.getStructuringElement(
                this.cv.MORPH_ELLIPSE,
                new this.cv.Size(
                    3,
                    3
                )
            );

        try {
            this.cv.morphologyEx(
                binary,
                binary,
                this.cv.MORPH_CLOSE,
                kernel
            );
        } finally {
            kernel.delete();
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
                x:
                    data[i] ?? 0,
                y:
                    data[i + 1] ?? 0
            });
        }

        return points;
    }
}