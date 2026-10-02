import { GolfGreenDetector } from "./detectors/GolfGreenDetector";
import { BunkerDetector } from "./detectors/BunkerDetector";
import { DetectionPipeline } from "./pipeline/DetectionPipeline";
import { OpenCvJsAdapter } from "./opencv/OpenCvJsAdapter";
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