import type { DetectionRequest } from "./DetectionRequest.js";
import type { DetectionResult } from "./DetectionResult.js";
import type { OpenCvRuntime } from "../application/opencv/OpenCvTypes.js";
export declare class FeatureDetectionEngine {
    private readonly implementation;
    constructor(cv: OpenCvRuntime);
    detect(request: DetectionRequest): DetectionResult;
}
