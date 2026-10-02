import type { OpenCvMat } from "../application/opencv/OpenCvTypes.js";
import type { FeatureType } from "../domain/FeatureType.js";
import type { PixelPoint } from "./PixelPoint.js";
export interface DetectionRequest {
    readonly image: OpenCvMat;
    readonly metresPerPixel: number;
    readonly seed?: PixelPoint;
    readonly featureType: FeatureType;
}
