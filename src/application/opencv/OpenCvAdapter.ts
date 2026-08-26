import type {
    OpenCvContour,
    OpenCvMat
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";

export interface OpenCvAdapter {
    findContours(
        image: OpenCvMat,
        seed?: PixelPoint
    ): readonly OpenCvContour[];
}