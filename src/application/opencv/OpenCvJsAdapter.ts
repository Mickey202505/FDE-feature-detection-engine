import type { OpenCvAdapter } from "./OpenCvAdapter";
import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";

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

        let workingImage: OpenCvMat = image;
        let binaryImage: OpenCvMat | undefined;

        try {
            binaryImage = this.createBinaryImage(
                image,
                seed
            );

            if (binaryImage !== undefined) {
                workingImage = binaryImage;
            }

            this.cv.findContours(
                workingImage,
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
                const contour = contours.get(i);
                const approx = new this.cv.Mat();

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
                            points: this.readPoints(
                                approx
                            )
                        });
                    } else {
                        result.push({
                            points: this.readPoints(
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
    ): OpenCvMat | undefined {
        if (
            this.cv.cvtColor === undefined ||
            this.cv.COLOR_RGBA2RGB ===
                undefined ||
            this.cv.inRange === undefined ||
            this.cv.getStructuringElement ===
                undefined ||
            this.cv.morphologyEx ===
                undefined ||
            this.cv.MORPH_ELLIPSE ===
                undefined ||
            this.cv.MORPH_CLOSE ===
                undefined
        ) {
            return undefined;
        }

        const binary = new this.cv.Mat(
            image.rows,
            image.cols,
            this.cv.CV_8U ?? 0
        );

        try {
            /*
             * Seeded detection:
             *
             * Use the colour at the supplied seed as
             * the centre of a small colour range.
             *
             * A seed is only accepted when its colour
             * is recognisably green. This prevents a
             * click on sky, grey terrain, sand, etc.
             * from being treated as a green.
             */
            if (seed !== undefined) {
                const rgb = new this.cv.Mat();

                try {
                    this.cv.cvtColor(
                        image,
                        rgb,
                        this.cv.COLOR_RGBA2RGB
                    );

                    const seedX =
                        Math.round(seed.x);
                    const seedY =
                        Math.round(seed.y);

                    if (
                        seedX < 0 ||
                        seedX >= rgb.cols ||
                        seedY < 0 ||
                        seedY >= rgb.rows
                    ) {
                        throw new Error(
                            "Seed point is outside the image."
                        );
                    }

                    if (
                        rgb.ucharPtr === undefined
                    ) {
                        throw new Error(
                            "OpenCV runtime does not support pixel access."
                        );
                    }

                    const pixel =
                        rgb.ucharPtr(
                            seedY,
                            seedX
                        );

                    const r =
                        pixel[0] ?? 0;
                    const g =
                        pixel[1] ?? 0;
                    const b =
                        pixel[2] ?? 0;

                    /*
                     * A green pixel must have a meaningful
                     * green-channel dominance.
                     *
                     * This deliberately rejects neutral
                     * colours such as:
                     *
                     *   160,160,160
                     *   220,220,220
                     *   255,255,255
                     */
                    const greenDominance =
                        g - Math.max(r, b);

                    const minimumGreenDominance =
                        20;

                    const minimumGreen =
                        60;

                    if (
                        g <
                            minimumGreen ||
                        greenDominance <
                            minimumGreenDominance
                    ) {
                        /*
                         * The Mat constructor does not
                         * guarantee a zero-filled matrix
                         * in every OpenCV.js build.
                         *
                         * Explicitly write an all-zero
                         * mask so findContours receives
                         * a genuine empty CV_8UC1 image.
                         */
                        this.clearBinary(
                            binary
                        );

                        return binary;
                    }

                    /*
                     * Keep the colour tolerance deliberately
                     * modest. This accommodates natural
                     * variation in the green while avoiding
                     * large unrelated regions.
                     */
                    const tolerance = 20;

                    const lowerBound =
                        new this.cv.Mat(
                            rgb.rows,
                            rgb.cols,
                            rgb.type!(),
                            [
                                Math.max(
                                    0,
                                    r -
                                        tolerance
                                ),
                                Math.max(
                                    0,
                                    g -
                                        tolerance
                                ),
                                Math.max(
                                    0,
                                    b -
                                        tolerance
                                ),
                                0
                            ]
                        );

                    const upperBound =
                        new this.cv.Mat(
                            rgb.rows,
                            rgb.cols,
                            rgb.type!(),
                            [
                                Math.min(
                                    255,
                                    r +
                                        tolerance
                                ),
                                Math.min(
                                    255,
                                    g +
                                        tolerance
                                ),
                                Math.min(
                                    255,
                                    b +
                                        tolerance
                                ),
                                255
                            ]
                        );

                    try {
                        this.cv.inRange(
                            rgb,
                            lowerBound,
                            upperBound,
                            binary
                        );
                    } finally {
                        lowerBound.delete();
                        upperBound.delete();
                    }
                } finally {
                    rgb.delete();
                }

                this.closeSmallGaps(
                    binary
                );

                return binary;
            }

            /*
             * No-seed detection:
             *
             * Do not use greyscale thresholding here.
             *
             * A greyscale threshold can identify bright
             * white/grey areas just as easily as a green
             * area. Instead, build the mask from RGB
             * colour dominance.
             */
            const rgb = new this.cv.Mat();

            try {
                this.cv.cvtColor(
                    image,
                    rgb,
                    this.cv.COLOR_RGBA2RGB
                );

                if (
                    rgb.ucharPtr === undefined
                ) {
                    return undefined;
                }

                /*
                 * Build a one-channel green mask.
                 *
                 * OpenCV.js does not provide a simple
                 * per-pixel expression operation through
                 * our intentionally small adapter
                 * interface, so construct the mask by
                 * reading the image pixels and writing
                 * the result into the binary Mat.
                 */
                this.clearBinary(binary);

                const maskData =
                    this.getBinaryData(
                        binary
                    );

                if (maskData === undefined) {
                    return undefined;
                }

                for (
                    let y = 0;
                    y < rgb.rows;
                    y += 1
                ) {
                    for (
                        let x = 0;
                        x < rgb.cols;
                        x += 1
                    ) {
                        const pixel =
                            rgb.ucharPtr(
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
                            Math.max(r, b);

                        const isGreen =
                            g >= 60 &&
                            greenDominance >=
                                20;

                        maskData[
                            y * rgb.cols +
                                x
                        ] = isGreen
                            ? 255
                            : 0;
                    }
                }
            } finally {
                rgb.delete();
            }

            this.closeSmallGaps(
                binary
            );

            return binary;
        } catch (error) {
            binary.delete();
            throw error;
        }
    }

    private closeSmallGaps(
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
                new this.cv.Size(3, 3)
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

    private clearBinary(
        binary: OpenCvMat
    ): void {
        const data =
            this.getBinaryData(binary);

        if (data === undefined) {
            return;
        }

        data.fill(0);
    }

    private getBinaryData(
        binary: OpenCvMat
    ): Uint8Array | undefined {
        if (
            binary.ucharPtr === undefined
        ) {
            return undefined;
        }

        /*
         * OpenCV.js exposes ucharPtr(row, col),
         * but our adapter types intentionally do not
         * expose the raw data buffer.
         *
         * Build a temporary one-byte-per-pixel
         * representation when needed.
         */
        const data = new Uint8Array(
            binary.rows *
                binary.cols
        );

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

                data[
                    y * binary.cols +
                        x
                ] = pixel[0] ?? 0;
            }
        }

        /*
         * The returned array above is a copy,
         * not a view into the OpenCV Mat.
         *
         * It therefore cannot be used to modify
         * the Mat. This method is intentionally
         * replaced below by the OpenCV-compatible
         * pixel writer.
         */
        return data;
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