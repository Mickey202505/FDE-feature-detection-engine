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
                // The user specifically requested reducing the number of points to smooth the line!
                // approxPolyDP looks ahead and draws straight lines across micro-jaggies.
                // We use an epsilon of 4.0 pixels (max deviation from the true curve).
                this.cv.approxPolyDP(contour, approx, 4.0, true);

                result.push({
                    points: this.readPoints(approx)
                });
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
        this.cv.threshold === undefined
    ) {
        return undefined;
    }

    const grayscale = new this.cv.Mat();
    const binary = new this.cv.Mat();

    try {
        this.cv.cvtColor(image, grayscale, this.cv.COLOR_RGBA2GRAY);

        // If a seed point is provided, we isolate the green based on the clicked pixel's color
        if (seed !== undefined) {
            const rgb = new this.cv.Mat();
            this.cv.cvtColor(image, rgb, this.cv.COLOR_RGBA2RGB);

            const seedX = Math.round(seed.x);
            const seedY = Math.round(seed.y);

            // Read the exact RGB color of the pixel the user clicked
            const pixel = rgb.ucharPtr(seedY, seedX);
            const r = pixel[0];
            const g = pixel[1];
            const b = pixel[2];

            // Define a tight color range around that exact green (+/- 20)
            const tolerance = 20;
            const lowerBound = new this.cv.Mat(rgb.rows, rgb.cols, rgb.type(), [
                Math.max(0, r - tolerance), 
                Math.max(0, g - tolerance), 
                Math.max(0, b - tolerance),
                0
            ]);
            const upperBound = new this.cv.Mat(rgb.rows, rgb.cols, rgb.type(), [
                Math.min(255, r + tolerance), 
                Math.min(255, g + tolerance), 
                Math.min(255, b + tolerance),
                255
            ]);

            // Threshold the image for only pixels matching the seed color
            this.cv.inRange(rgb, lowerBound, upperBound, binary);
            
            lowerBound.delete();
            upperBound.delete();
            rgb.delete();

            // The threshold will select the green, but also some fairway if it's the exact same color.
            // We use a MORPH_OPEN to sever narrow necks connecting them. 15x15 is enough to break it.
            const M = this.cv.getStructuringElement(this.cv.MORPH_ELLIPSE, new this.cv.Size(15, 15));
            this.cv.morphologyEx(binary, binary, this.cv.MORPH_OPEN, M);
            M.delete();

            // To smooth the line without distorting the true shape of the green,
            // we use a moderate Gaussian Blur to anti-alias the jagged pixels.
            this.cv.GaussianBlur(binary, binary, new this.cv.Size(15, 15), 0, 0);
            
            // Re-harden the edge exactly in the middle of the blur gradient (128).
            this.cv.threshold(binary, binary, 128, 255, this.cv.THRESH_BINARY);

            // A tiny final dilation to ensure the line sits on the fringe
            const M3 = this.cv.getStructuringElement(this.cv.MORPH_ELLIPSE, new this.cv.Size(3, 3));
            this.cv.dilate(binary, binary, M3, new this.cv.Point(-1, -1), 1);
            M3.delete();

            return binary;
        }

        // Fallback: Use Otsu's thresholding if no seed is provided
        this.cv.threshold(
            grayscale,
            binary,
            0,
            255,
            this.cv.THRESH_BINARY | this.cv.THRESH_OTSU
        );

        const M = this.cv.Mat.ones(5, 5, this.cv.CV_8U);
        this.cv.morphologyEx(binary, binary, this.cv.MORPH_OPEN, M);
        this.cv.morphologyEx(binary, binary, this.cv.MORPH_CLOSE, M);
        M.delete();

        return binary;
    } catch (error) {
        binary.delete();
        throw error;
    } finally {
        grayscale.delete();
    }
}

private validateImage(
    image: OpenCvMat
): void {
    if (image.rows <= 0 || image.cols <= 0) {
        throw new Error(
            "OpenCV image must have positive dimensions."
        );
    }
}

private readPoints(
    contour: OpenCvMat
): readonly { x: number; y: number }[] {
    const data =
        contour.data32S ?? new Int32Array();

    const points: { x: number; y: number }[] = [];

    for (let i = 0; i + 1 < data.length; i += 2) {
        points.push({
            x: data[i] ?? 0,
            y: data[i + 1] ?? 0
        });
    }

    return points;
}

}
