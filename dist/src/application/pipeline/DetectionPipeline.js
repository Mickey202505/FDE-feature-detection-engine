"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetectionPipeline = void 0;
class DetectionPipeline {
    detectors;
    constructor(detectors) {
        this.detectors = [...detectors];
    }
    detect(request) {
        const features = [];
        for (const detector of this.detectors) {
            if (detector.featureType !== request.featureType) {
                continue;
            }
            features.push(...detector.detect(request));
        }
        return features;
    }
}
exports.DetectionPipeline = DetectionPipeline;
//# sourceMappingURL=DetectionPipeline.js.map