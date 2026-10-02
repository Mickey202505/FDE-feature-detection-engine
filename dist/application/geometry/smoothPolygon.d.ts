import type { PixelPoint } from "../../api/PixelPoint.js";
export interface SmoothOptions {
    enabled: boolean;
    epsilon: number;
    splineSegments: number;
    angleFilter: boolean;
    minAngle: number;
}
export declare const DEFAULT_SMOOTH_OPTIONS: SmoothOptions;
export declare function smoothPolygon(rawPoly: readonly PixelPoint[], options?: SmoothOptions): PixelPoint[];
