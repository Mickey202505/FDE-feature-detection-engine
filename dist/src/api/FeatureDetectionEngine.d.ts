import type { DetectionRequest } from "./DetectionRequest";
import type { DetectionResult } from "./DetectionResult";
import type { OpenCvRuntime } from "../application/opencv/OpenCvTypes";
export declare class FeatureDetectionEngine {
    private readonly implementation;
    constructor(cv: OpenCvRuntime);
    detect(request: DetectionRequest): DetectionResult;
}
