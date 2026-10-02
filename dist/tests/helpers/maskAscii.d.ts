import type { OpenCvMat } from "../../src/application/opencv/OpenCvTypes";
import type { PixelPoint } from "../../src/api/PixelPoint";
export declare function maskToAscii(mask: OpenCvMat, outputCols?: number, outputRows?: number): string;
export declare function maskToRayAscii(points: readonly PixelPoint[], imageWidth: number, imageHeight: number, outputCols?: number, outputRows?: number): string;
