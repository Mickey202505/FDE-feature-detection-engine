import type { OpenCvContour, OpenCvImageData, OpenCvMat } from "./OpenCvTypes.js";
import type { PixelPoint } from "./PixelPoint.js";
export interface OpenCvAdapter {
    findContours(image: OpenCvMat, seed?: PixelPoint): readonly OpenCvContour[];
    detectGreenBoundary(image: OpenCvImageData | OpenCvMat, seed: PixelPoint): readonly PixelPoint[];
    detectBunkerBoundary(image: OpenCvImageData | OpenCvMat, seed: PixelPoint): readonly PixelPoint[];
}
