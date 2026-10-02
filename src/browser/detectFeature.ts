import {
  OpenCvJsAdapter,
  BUNKER_MASK_OPTIONS,
  GREEN_MASK_OPTIONS,
} from "../application/opencv/OpenCvJsAdapter";
import type {
  OpenCvImageData,
  OpenCvRuntime,
} from "../application/opencv/OpenCvTypes";
import type { PixelPoint } from "../api/PixelPoint";
import {
  smoothPolygon,
  DEFAULT_SMOOTH_OPTIONS,
  type SmoothOptions,
} from "../application/geometry/smoothPolygon";
import { maskToPolygon, type MaskLike } from "../application/sam/maskToPolygon";

export type FeatureType = "green" | "bunker";

export interface DetectFeatureImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Colour-based detection (existing engine). Returns raw pixel-space points.
 */
export function detectFeatureColour(
  cv: OpenCvRuntime,
  imageData: DetectFeatureImageData,
  seed: PixelPoint,
  featureType: FeatureType,
): PixelPoint[] {
  const adapter = new OpenCvJsAdapter(cv);
  const options =
    featureType === "bunker" ? BUNKER_MASK_OPTIONS : GREEN_MASK_OPTIONS;

  const rawMask = adapter.createSeedGuidedRegionMaskForDiagnostics(
    imageData as OpenCvImageData,
    seed,
    options,
  );

  try {
    return adapter.extractBoundaryFromMask(rawMask, 14);
  } finally {
    if (typeof rawMask.delete === "function") rawMask.delete();
  }
}

/**
 * SAM-based detection. Takes the raw mask SAM returns and produces pixel-space points.
 * No 14px resampling yet — smoothing handles reduction.
 */
export function detectFeatureFromMask(mask: MaskLike): PixelPoint[] {
  return maskToPolygon(mask, 0.4);
}

/**
 * Post-process raw points into a smooth polygon.
 */
export function applySmoothing(
  points: readonly PixelPoint[],
  options?: Partial<SmoothOptions>,
): PixelPoint[] {
  return smoothPolygon(points, { ...DEFAULT_SMOOTH_OPTIONS, ...options });
}