import type { OpenCvAdapter } from "./OpenCvAdapter";
import type { OpenCvContour, OpenCvMat, OpenCvRuntime } from "./OpenCvTypes";

export class OpenCvJsAdapter implements OpenCvAdapter {
    private readonly cv: OpenCvRuntime;

    public constructor(cv: OpenCvRuntime) {
        this.cv = cv;
    }

    public findContours(image: OpenCvMat): readonly OpenCvContour[] {
        const contours = new this.cv.MatVector();
        const hierarchy = new this.cv.Mat();
        this.cv.findContours(
            image,
            contours,
            hierarchy,
            0,
            2
        );

        return [];
    }
}