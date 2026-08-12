import type { OpenCvMat } from "../application/opencv/OpenCvTypes";

export interface DetectionRequest {
    readonly image: OpenCvMat;
    readonly metresPerPixel: number;
}