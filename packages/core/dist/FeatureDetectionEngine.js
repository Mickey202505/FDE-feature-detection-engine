import { DetectionPipeline } from "./pipeline/DetectionPipeline";
/**
 * Main Feature Detection Engine.
 */
export class FeatureDetectionEngine {
    pipeline = new DetectionPipeline();
    async detect(request) {
        return this.pipeline.run(request);
    }
}
//# sourceMappingURL=FeatureDetectionEngine.js.map