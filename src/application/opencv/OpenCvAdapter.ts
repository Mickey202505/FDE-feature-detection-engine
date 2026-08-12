import type { OpenCvContour, OpenCvMat } from "./OpenCvTypes";

export interface OpenCvAdapter {
    findContours(image: OpenCvMat): readonly OpenCvContour[];
}