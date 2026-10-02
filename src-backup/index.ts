// Colour-based detector (requires an OpenCV runtime)
export {
  OpenCvJsAdapter,
  BUNKER_MASK_OPTIONS,
  GREEN_MASK_OPTIONS,
} from "./application/opencv/OpenCvJsAdapter";

export type {
  OpenCvContour,
  OpenCvImageData,
  OpenCvMat,
  OpenCvRuntime,
} from "./application/opencv/OpenCvTypes";

// Mask handling (for SAM2 or any other segmentation source)
export {
  maskToPolygon,
} from "./application/sam/maskToPolygon";

export type { MaskLike } from "./application/sam/maskToPolygon";

// Smoothing pipeline
export {
  smoothPolygon,
  DEFAULT_SMOOTH_OPTIONS,
} from "./application/geometry/smoothPolygon";

export { simplifyPolygon } from "./application/geometry/simplify";
export { removeSharpCorners } from "./application/geometry/removeSharpCorners";
export { catmullRomToPolygon } from "./application/geometry/catmullRom";

export type { SmoothOptions } from "./application/geometry/smoothPolygon";

// SVG export
export {
  exportSvg,
  IDENTITY_TRANSFORM,
} from "./application/export/exportSvg";

export type {
  FeatureSvgMetadata,
  ExportSvgOptions,
  PixelToWorldTransform,
  WorldPoint,
} from "./application/export/exportSvg";

// Shared types
export type { PixelPoint } from "./api/PixelPoint";