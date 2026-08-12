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
        const result: OpenCvContour[] = [];

        try {
            this.cv.findContours(
                image,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE
            );

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
        const points: OpenCvPoint[] = [];

        const data = (contour as OpenCvMat & {
            data32S?: Int32Array;
        }).data32S;

        if (!data) {
            return points;
        }

        for (let i = 0; i + 1 < data.length; i += 2) {
            points.push({
                x: data[i] ?? 0,
                y: data[i + 1] ?? 0
            });
        }

        return points;
    }
}