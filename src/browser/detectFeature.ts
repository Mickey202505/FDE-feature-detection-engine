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

export type FeatureType = "green" | "bunker";

export interface DetectFeatureImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export function detectFeature(
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