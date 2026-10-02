import type { DetectionRequest } from "../api/DetectionRequest.js";
import type { DetectionResult } from "../api/DetectionResult.js";
import type { OpenCvRuntime } from "./opencv/OpenCvTypes.js";
export declare class FeatureDetectionEngineImpl {
    private readonly pipeline;
    constructor(cv: OpenCvRuntime);
    detect(request: DetectionRequest): DetectionResult;
}
