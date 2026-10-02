import { FeatureDetectionEngineImpl } from "../application/FeatureDetectionEngineImpl.js";
export class FeatureDetectionEngine {
    implementation;
    constructor(cv) {
        this.implementation = new FeatureDetectionEngineImpl(cv);
    }
    detect(request) {
        return this.implementation.detect(request);
    }
}
//# sourceMappingURL=FeatureDetectionEngine.js.map