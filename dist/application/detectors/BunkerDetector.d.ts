import { Feature } from "../../domain/Feature.js";
import { FeatureType } from "../../domain/FeatureType.js";
import type { DetectionRequest } from "../../api/DetectionRequest.js";
import type { FeatureDetector } from "./FeatureDetector.js";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter.js";
export declare class BunkerDetector implements FeatureDetector {
    readonly featureType = FeatureType.Bunker;
    private readonly openCv;
    constructor(openCv: OpenCvAdapter);
    detect(request: DetectionRequest): readonly Feature[];
}
