// Colour-based detector (requires an OpenCV runtime)
export { OpenCvJsAdapter, BUNKER_MASK_OPTIONS, GREEN_MASK_OPTIONS, } from "./application/opencv/OpenCvJsAdapter.js";
// Mask handling (for SAM2 or any other segmentation source)
export { maskToPolygon, } from "./application/sam/maskToPolygon.js";
// Smoothing pipeline
export { smoothPolygon, DEFAULT_SMOOTH_OPTIONS, } from "./application/geometry/smoothPolygon.js";
export { simplifyPolygon } from "./application/geometry/simplify.js";
export { removeSharpCorners } from "./application/geometry/removeSharpCorners.js";
export { catmullRomToPolygon } from "./application/geometry/catmullRom.js";
// SVG export
export { exportSvg, IDENTITY_TRANSFORM, } from "./application/export/exportSvg.js";
// Legacy API - the implementation class, re-exported under its original name.
export { FeatureDetectionEngineImpl as FeatureDetectionEngine } from "./application/FeatureDetectionEngineImpl.js";
//# sourceMappingURL=index.js.map