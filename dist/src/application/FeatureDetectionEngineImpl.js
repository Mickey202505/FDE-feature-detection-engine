"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureDetectionEngineImpl = void 0;
const GolfGreenDetector_1 = require("./detectors/GolfGreenDetector");
const BunkerDetector_1 = require("./detectors/BunkerDetector");
const DetectionPipeline_1 = require("./pipeline/DetectionPipeline");
const OpenCvJsAdapter_1 = require("./opencv/OpenCvJsAdapter");
class FeatureDetectionEngineImpl {
    pipeline;
    constructor(cv) {
        const adapter = new OpenCvJsAdapter_1.OpenCvJsAdapter(cv);
        this.pipeline = new DetectionPipeline_1.DetectionPipeline([
            new GolfGreenDetector_1.GolfGreenDetector(adapter),
            new BunkerDetector_1.BunkerDetector(adapter)
        ]);
    }
    detect(request) {
        return {
            features: this.pipeline.detect(request)
        };
    }
}
exports.FeatureDetectionEngineImpl = FeatureDetectionEngineImpl;
//# sourceMappingURL=FeatureDetectionEngineImpl.js.map