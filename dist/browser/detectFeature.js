import { OpenCvJsAdapter, BUNKER_MASK_OPTIONS, GREEN_MASK_OPTIONS, } from "../application/opencv/OpenCvJsAdapter.js";
import { smoothPolygon, DEFAULT_SMOOTH_OPTIONS, } from "../application/geometry/smoothPolygon.js";
import { maskToPolygon, } from "../application/sam/maskToPolygon.js";
/**
 * Colour-based detection (existing engine). Returns raw pixel-space points.
 */
export function detectFeatureColour(cv, imageData, seed, featureType) {
    const adapter = new OpenCvJsAdapter(cv);
    const options = featureType === "bunker" ? BUNKER_MASK_OPTIONS : GREEN_MASK_OPTIONS;
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
 * SAM-based detection. Takes the raw mask SAM returns and produces
 * pixel-space points.
 */
export function detectFeatureFromMask(mask) {
    return maskToPolygon(mask, 0.4);
}
/**
 * Post-process raw points into a smooth polygon.
 */
export function applySmoothing(points, options) {
    return smoothPolygon(points, { ...DEFAULT_SMOOTH_OPTIONS, ...options });
}
/**
 * Single entry point for the local viewer and any other browser consumer.
 * Currently delegates to the colour detector. If we ever add SAM2 in the
 * browser, this is where it would branch.
 */
export function detectFeature(cv, imageData, seed, featureType) {
    return detectFeatureColour(cv, imageData, seed, featureType);
}
//# sourceMappingURL=detectFeature.js.map