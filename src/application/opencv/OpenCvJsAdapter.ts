import type { OpenCvAdapter } from "./OpenCvAdapter";
import type {
OpenCvContour,
OpenCvMat,
OpenCvRuntime
} from "./OpenCvTypes";

export class OpenCvJsAdapter implements OpenCvAdapter {
private readonly cv: OpenCvRuntime;

public constructor(cv: OpenCvRuntime) {
    this.cv = cv;
}

public findContours(
    image: OpenCvMat
): readonly OpenCvContour[] {
    this.validateImage(image);

    const contours = new this.cv.MatVector();
    const hierarchy = new this.cv.Mat();

    let workingImage: OpenCvMat = image;
    let grayscaleImage: OpenCvMat | undefined;

    try {
        grayscaleImage = this.createGrayscaleImage(image);

        if (grayscaleImage !== undefined) {
            workingImage = grayscaleImage;
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

            try {
                result.push({
                    points: this.readPoints(contour)
                });
            } finally {
                contour.delete();
            }
        }

        return result;
    } finally {
        if (grayscaleImage !== undefined) {
            grayscaleImage.delete();
        }

        hierarchy.delete();
        contours.delete();
    }
}

private createGrayscaleImage(
    image: OpenCvMat
): OpenCvMat | undefined {
    if (
        this.cv.cvtColor === undefined ||
        this.cv.COLOR_RGBA2GRAY === undefined
    ) {
        return undefined;
    }

    const grayscale = new this.cv.Mat();

    try {
        this.cv.cvtColor(
            image,
            grayscale,
            this.cv.COLOR_RGBA2GRAY
        );

        return grayscale;
    } catch (error) {
        grayscale.delete();
        throw error;
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
