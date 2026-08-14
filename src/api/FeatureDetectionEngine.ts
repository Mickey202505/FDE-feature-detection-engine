import type { DetectionRequest } from "./DetectionRequest";
import type { DetectionResult } from "./DetectionResult";
import { FeatureDetectionEngineImpl } from "../application/FeatureDetectionEngineImpl";
import type { OpenCvRuntime } from "../application/opencv/OpenCvTypes";

export class FeatureDetectionEngine {
    private readonly implementation: FeatureDetectionEngineImpl;

    public constructor(cv: OpenCvRuntime) {
        this.implementation = new FeatureDetectionEngineImpl(cv);
    }

    public detect(request: DetectionRequest): DetectionResult {
        return this.implementation.detect(request);
    }
}