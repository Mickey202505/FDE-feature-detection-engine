import type { DetectionRequest } from "../../api/DetectionRequest";
import type { Feature } from "../../domain/Feature";
import type { FeatureDetector } from "../detectors/FeatureDetector";
export declare class DetectionPipeline {
    private readonly detectors;
    constructor(detectors: readonly FeatureDetector[]);
    detect(request: DetectionRequest): readonly Feature[];
}
