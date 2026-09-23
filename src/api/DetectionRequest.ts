import type { OpenCvMat } from "../application/opencv/OpenCvTypes";
import type { FeatureType } from "../domain/FeatureType";
import type { PixelPoint } from "./PixelPoint";

export interface DetectionRequest {
    readonly image: OpenCvMat;
    readonly metresPerPixel: number;
    readonly seed?: PixelPoint;
    readonly featureType: FeatureType;
}