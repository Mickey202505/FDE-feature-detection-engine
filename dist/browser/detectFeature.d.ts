import type { OpenCvRuntime } from "../application/opencv/OpenCvTypes";
import type { PixelPoint } from "../api/PixelPoint";
import { type SmoothOptions } from "../application/geometry/smoothPolygon";
import { type MaskLike } from "../application/sam/maskToPolygon";
export type FeatureType = "green" | "bunker";
export interface DetectFeatureImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
}
/**
 * Colour-based detection (existing engine). Returns raw pixel-space points.
 */
export declare function detectFeatureColour(cv: OpenCvRuntime, imageData: DetectFeatureImageData, seed: PixelPoint, featureType: FeatureType): PixelPoint[];
/**
 * SAM-based detection. Takes the raw mask SAM returns and produces pixel-space points.
 * No 14px resampling yet — smoothing handles reduction.
 */
export declare function detectFeatureFromMask(mask: MaskLike): PixelPoint[];
/**
 * Post-process raw points into a smooth polygon.
 */
export declare function applySmoothing(points: readonly PixelPoint[], options?: Partial<SmoothOptions>): PixelPoint[];
