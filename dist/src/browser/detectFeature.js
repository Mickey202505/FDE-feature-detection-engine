"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFeatureColour = detectFeatureColour;
exports.detectFeatureFromMask = detectFeatureFromMask;
exports.applySmoothing = applySmoothing;
const OpenCvJsAdapter_1 = require("../application/opencv/OpenCvJsAdapter");
const smoothPolygon_1 = require("../application/geometry/smoothPolygon");
const maskToPolygon_1 = require("../application/sam/maskToPolygon");
/**
 * Colour-based detection (existing engine). Returns raw pixel-space points.
 */
function detectFeatureColour(cv, imageData, seed, featureType) {
    const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(cv);
    const options = featureType === "bunker" ? OpenCvJsAdapter_1.BUNKER_MASK_OPTIONS : OpenCvJsAdapter_1.GREEN_MASK_OPTIONS;
    const rawMask = adapter.createSeedGuidedRegionMaskForDiagnostics(imageData, seed, options);
    try {
        return adapter.extractBoundaryFromMask(rawMask, 14);
    }
    finally {
        if (typeof rawMask.delete === "function")
            rawMask.delete();
    }
}
/**
 * SAM-based detection. Takes the raw mask SAM returns and produces pixel-space points.
 * No 14px resampling yet — smoothing handles reduction.
 */
function detectFeatureFromMask(mask) {
    return (0, maskToPolygon_1.maskToPolygon)(mask, 0.4);
}
/**
 * Post-process raw points into a smooth polygon.
 */
function applySmoothing(points, options) {
    return (0, smoothPolygon_1.smoothPolygon)(points, { ...smoothPolygon_1.DEFAULT_SMOOTH_OPTIONS, ...options });
}
//# sourceMappingURL=detectFeature.js.map