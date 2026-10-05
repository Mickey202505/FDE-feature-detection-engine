import {
  OpenCvJsAdapter,
  BUNKER_MASK_OPTIONS,
  GREEN_MASK_OPTIONS,
} from "../application/opencv/OpenCvJsAdapter.js";
import type {
  OpenCvImageData,
  OpenCvRuntime,
} from "../application/opencv/OpenCvTypes.js";
import type { PixelPoint } from "../api/PixelPoint.js";
import {
  smoothPolygon,
  DEFAULT_SMOOTH_OPTIONS,
  type SmoothOptions,
} from "../application/geometry/smoothPolygon.js";
import {
  maskToPolygon,
  type MaskLike,
} from "../application/sam/maskToPolygon.js";

export type FeatureType = "green" | "bunker";

export interface DetectFeatureImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Colour-based detection. Extracts a fine-resolution contour from the mask
 * and then resamples to a fixed number of points so the editing UI always
 * has a consistent handle count regardless of feature size.
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
    const raw = adapter.extractBoundaryFromMask(rawMask, 2);
    const targetCount = featureType === "bunker" ? 24 : 20;
    return adapter.resampleByCount(raw, targetCount);
  } finally {
    if (typeof rawMask.delete === "function") rawMask.delete();
  }
}

/**
 * SAM-based detection. Takes the raw mask SAM returns and produces
 * pixel-space points.
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

/**
 * Single entry point for the browser consumers.
 */
export function detectFeature(
  cv: OpenCvRuntime,
  imageData: DetectFeatureImageData,
  seed: PixelPoint,
  featureType: FeatureType,
): PixelPoint[] {
  return detectFeatureColour(cv, imageData, seed, featureType);
}