import type { OpenCvRuntime } from "../application/opencv/OpenCvTypes.js";
import type { PixelPoint } from "../api/PixelPoint.js";
import { type SmoothOptions } from "../application/geometry/smoothPolygon.js";
import { type MaskLike } from "../application/sam/maskToPolygon.js";
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
 * SAM-based detection. Takes the raw mask SAM returns and produces
 * pixel-space points.
 */
export declare function detectFeatureFromMask(mask: MaskLike): PixelPoint[];
/**
 * Post-process raw points into a smooth polygon.
 */
export declare function applySmoothing(points: readonly PixelPoint[], options?: Partial<SmoothOptions>): PixelPoint[];
/**
 * Single entry point for the local viewer and any other browser consumer.
 * Currently delegates to the colour detector. If we ever add SAM2 in the
 * browser, this is where it would branch.
 */
export declare function detectFeature(cv: OpenCvRuntime, imageData: DetectFeatureImageData, seed: PixelPoint, featureType: FeatureType): PixelPoint[];
