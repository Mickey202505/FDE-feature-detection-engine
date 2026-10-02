import { Feature } from "../../domain/Feature";
import { FeatureType } from "../../domain/FeatureType";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter";
export declare class BunkerDetector implements FeatureDetector {
    readonly featureType = FeatureType.Bunker;
    private readonly openCv;
    constructor(openCv: OpenCvAdapter);
    detect(request: DetectionRequest): readonly Feature[];
}
