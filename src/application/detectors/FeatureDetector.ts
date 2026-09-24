import type { DetectionRequest } from "../../api/DetectionRequest";
import type { Feature } from "../../domain/Feature";
import type { FeatureType } from "../../domain/FeatureType";

export interface FeatureDetector {
    readonly featureType: FeatureType;
    detect(request: DetectionRequest): readonly Feature[];
}