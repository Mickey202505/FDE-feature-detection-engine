import type { PixelPoint } from "../../api/PixelPoint";
export interface MaskLike {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}
export declare function maskToPolygon(mask: MaskLike, threshold?: number): PixelPoint[];
