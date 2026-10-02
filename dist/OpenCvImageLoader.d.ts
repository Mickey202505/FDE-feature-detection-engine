import type { OpenCvImageData, OpenCvMat, OpenCvRuntime } from "./application/opencv/OpenCvTypes.js";
export declare class OpenCvImageLoader {
    private readonly cv;
    constructor(cv: OpenCvRuntime);
    fromImageData(image: OpenCvImageData): OpenCvMat;
}
