import type {
    OpenCvContour,
    OpenCvImageData,
    OpenCvMat
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";

export interface OpenCvAdapter {
    findContours(
        image: OpenCvMat,
        seed?: PixelPoint
    ): readonly OpenCvContour[];

    detectGreenBoundary(
        image: OpenCvImageData | OpenCvMat,
        seed: PixelPoint
    ): readonly PixelPoint[];
}