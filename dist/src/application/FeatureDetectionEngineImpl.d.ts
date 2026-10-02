import type { DetectionRequest } from "../api/DetectionRequest";
import type { DetectionResult } from "../api/DetectionResult";
import type { OpenCvRuntime } from "./opencv/OpenCvTypes";
export declare class FeatureDetectionEngineImpl {
    private readonly pipeline;
    constructor(cv: OpenCvRuntime);
    detect(request: DetectionRequest): DetectionResult;
}
