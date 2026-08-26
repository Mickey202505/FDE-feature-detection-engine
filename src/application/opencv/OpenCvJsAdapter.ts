import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";

export interface OpenCvAdapter {
    findContours(
        image: OpenCvMat,
        seed?: PixelPoint
    ): readonly OpenCvContour[];
}

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
            binaryImage = this.createBinaryImage(image, seed);

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

            for (let i = 0; i < contours.size(); i += 1) {
                const contour = contours.get(i);
                const approx = new this.cv.Mat();

                try {
                    if (this.cv.approxPolyDP !== undefined) {
                        this.cv.approxPolyDP(
                            contour,
                            approx,
                            4.0,
                            true
                        );

                        result.push({
                            points: this.readPoints(approx)
                        });
                    } else {
                        result.push({
                            points: this.readPoints(contour)
                        });
                    }
                } finally {
                    approx.delete();
                    contour.delete();
                }
            }

            return result;
        } finally {
            if (binaryImage !== undefined) {
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
            this.cv.COLOR_RGBA2RGB === undefined ||
            this.cv.inRange === undefined ||
            this.cv.getStructuringElement === undefined ||
            this.cv.morphologyEx === undefined ||
            this.cv.MORPH_ELLIPSE === undefined ||
            this.cv.MORPH_CLOSE === undefined
        ) {
            return undefined;
        }

        const binary = new this.cv.Mat(
            image.rows,
            image.cols,
            this.cv.CV_8U!
        );

        try {
            const rgb = new this.cv.Mat();

            try {
                this.cv.cvtColor(
                    image,
                    rgb,
                    this.cv.COLOR_RGBA2RGB
                );

                if (seed !== undefined) {
                    return this.createSeededGreenMask(
                        rgb,
                        binary,
                        seed
                    );
                }

                return this.createAutomaticGreenMask(
                    rgb,
                    binary
                );
            } finally {
                rgb.delete();
            }
        } catch (error) {
            binary.delete();
            throw error;
        }
    }

    private createSeededGreenMask(
        rgb: OpenCvMat,
        binary: OpenCvMat,
        seed: PixelPoint
    ): OpenCvMat {
        const seedX = Math.round(seed.x);
        const seedY = Math.round(seed.y);

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

        if (rgb.ucharPtr === undefined) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
        }

        const pixel = rgb.ucharPtr(
            seedY,
            seedX
        );

        const r = pixel[0] ?? 0;
        const g = pixel[1] ?? 0;
        const b = pixel[2] ?? 0;

        /*
         * A seed is only valid when the selected pixel is
         * actually green.
         *
         * This is deliberately stricter than simply checking
         * brightness. A white, grey, sand or other bright pixel
         * must not create a green contour.
         */
        if (!(g > r && g > b)) {
            return binary;
        }

        /*
         * Keep the seeded tolerance reasonably tight so that
         * the selected region remains close to the seed colour.
         */
        const tolerance = 20;

        const lowerBound = new this.cv.Mat(
            rgb.rows,
            rgb.cols,
            rgb.type!(),
            [
                Math.max(0, r - tolerance),
                Math.max(0, g - tolerance),
                Math.max(0, b - tolerance),
                0
            ]
        );

        const upperBound = new this.cv.Mat(
            rgb.rows,
            rgb.cols,
            rgb.type!(),
            [
                Math.min(255, r + tolerance),
                Math.min(255, g + tolerance),
                Math.min(255, b + tolerance),
                255
            ]
        );

        try {
            /*
             * createBinaryImage has already verified that
             * inRange exists, but TypeScript does not retain
             * that narrowing across this method boundary.
             */
            const inRange = this.cv.inRange;

            if (inRange === undefined) {
                throw new Error(
                    "OpenCV runtime does not support inRange."
                );
            }

            inRange(
                rgb,
                lowerBound,
                upperBound,
                binary
            );
        } finally {
            lowerBound.delete();
            upperBound.delete();
        }

        this.closeMask(binary);

        return binary;
    }

    private createAutomaticGreenMask(
        rgb: OpenCvMat,
        binary: OpenCvMat
    ): OpenCvMat {
        if (rgb.ucharPtr === undefined) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
        }

        /*
         * Automatic detection is colour-based.
         *
         * A grayscale threshold would also detect bright grey,
         * white, sand, concrete, sky, etc.
         *
         * Require green to be meaningfully stronger than both
         * red and blue.
         */
        const data = new Uint8Array(
            rgb.rows * rgb.cols
        );

        for (let y = 0; y < rgb.rows; y += 1) {
            for (let x = 0; x < rgb.cols; x += 1) {
                const pixel = rgb.ucharPtr(
                    y,
                    x
                );

                const r = pixel[0] ?? 0;
                const g = pixel[1] ?? 0;
                const b = pixel[2] ?? 0;

                const greenDominance =
                    g - Math.max(r, b);

                const isGreen =
                    g >= 60 &&
                    greenDominance >= 20;

                data[
                    y * rgb.cols + x
                ] = isGreen ? 255 : 0;
            }
        }

        if (binary.ucharPtr === undefined) {
            throw new Error(
                "OpenCV runtime does not support pixel access."
            );
        }

        for (let y = 0; y < rgb.rows; y += 1) {
            for (let x = 0; x < rgb.cols; x += 1) {
                const pixel = binary.ucharPtr(
                    y,
                    x
                );

                pixel[0] =
                    data[y * rgb.cols + x] ?? 0;
            }
        }

        this.closeMask(binary);

        return binary;
    }

    private closeMask(
        binary: OpenCvMat
    ): void {
        const getStructuringElement =
            this.cv.getStructuringElement;

        const morphologyEx =
            this.cv.morphologyEx;

        const morphEllipse =
            this.cv.MORPH_ELLIPSE;

        const morphClose =
            this.cv.MORPH_CLOSE;

        if (
            getStructuringElement === undefined ||
            morphologyEx === undefined ||
            morphEllipse === undefined ||
            morphClose === undefined
        ) {
            return;
        }

        const kernel =
            getStructuringElement(
                morphEllipse,
                new this.cv.Size(3, 3)
            );

        try {
            morphologyEx(
                binary,
                binary,
                morphClose,
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
                x: data[i] ?? 0,
                y: data[i + 1] ?? 0
            });
        }

        return points;
    }
}