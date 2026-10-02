import type { DetectionRequest } from "./DetectionRequest.js";
import type { DetectionResult } from "./DetectionResult.js";
import { FeatureDetectionEngineImpl } from "../application/FeatureDetectionEngineImpl.js";
import type { OpenCvRuntime } from "../application/opencv/OpenCvTypes.js";

export class FeatureDetectionEngine {
    private readonly implementation: FeatureDetectionEngineImpl;

    public constructor(cv: OpenCvRuntime) {
        this.implementation = new FeatureDetectionEngineImpl(cv);
    }

    public detect(
        request: DetectionRequest
    ): DetectionResult {
        return this.implementation.detect(request);
    }
}