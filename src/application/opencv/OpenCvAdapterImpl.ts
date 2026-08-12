import type {
OpenCvContour,
OpenCvMat,
OpenCvRuntime,
OpenCvPoint
} from "./OpenCvTypes";
import type { OpenCvAdapter } from "./OpenCvAdapter";

export class OpenCvAdapterImpl implements OpenCvAdapter {
private readonly cv: OpenCvRuntime;

public constructor(cv: OpenCvRuntime) {
    this.cv = cv;
}

public findContours(
    image: OpenCvMat
): readonly OpenCvContour[] {
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

private readPoints(
    contour: OpenCvMat
): readonly OpenCvPoint[] {
    void contour;

    return [];
}

}
