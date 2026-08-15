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

        try {
            this.cv.findContours(
                image,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE
            );

            const result: OpenCvContour[] = [];

            for (let i = 0; i < contours.size(); i += 1) {
                const contour = contours.get(i);

                result.push({
                    points: this.readPoints(contour)
                });

                contour.delete();
            }

            return result;
        } finally {
            hierarchy.delete();
            contours.delete();
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
        const data = contour.data32S ?? new Int32Array();

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