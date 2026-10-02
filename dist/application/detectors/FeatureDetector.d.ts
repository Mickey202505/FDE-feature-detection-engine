import type { DetectionRequest } from "../../api/DetectionRequest.js";
import type { Feature } from "../../domain/Feature.js";
import type { FeatureType } from "../../domain/FeatureType.js";
export interface FeatureDetector {
    readonly featureType: FeatureType;
    detect(request: DetectionRequest): readonly Feature[];
}
