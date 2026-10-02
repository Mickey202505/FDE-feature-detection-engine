import { GolfGreenDetector } from "./detectors/GolfGreenDetector.js";
import { BunkerDetector } from "./detectors/BunkerDetector.js";
import { DetectionPipeline } from "./pipeline/DetectionPipeline.js";
import { OpenCvJsAdapter } from "./opencv/OpenCvJsAdapter.js";
export class FeatureDetectionEngineImpl {
    pipeline;
    constructor(cv) {
        const adapter = new OpenCvJsAdapter(cv);
        this.pipeline = new DetectionPipeline([
            new GolfGreenDetector(adapter),
            new BunkerDetector(adapter)
        ]);
    }
    detect(request) {
        return {
            features: this.pipeline.detect(request)
        };
    }
}
//# sourceMappingURL=FeatureDetectionEngineImpl.js.map