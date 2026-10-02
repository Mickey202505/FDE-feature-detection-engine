import type { DetectionRequest } from "../../api/DetectionRequest.js";
import type { Feature } from "../../domain/Feature.js";
import type { FeatureDetector } from "../detectors/FeatureDetector.js";
export declare class DetectionPipeline {
    private readonly detectors;
    constructor(detectors: readonly FeatureDetector[]);
    detect(request: DetectionRequest): readonly Feature[];
}
