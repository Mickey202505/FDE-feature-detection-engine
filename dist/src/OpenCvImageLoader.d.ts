import type { OpenCvImageData, OpenCvMat, OpenCvRuntime } from "./application/opencv/OpenCvTypes";
export declare class OpenCvImageLoader {
    private readonly cv;
    constructor(cv: OpenCvRuntime);
    fromImageData(image: OpenCvImageData): OpenCvMat;
}
