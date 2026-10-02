import { Feature } from "../../domain/Feature";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter";
export declare class BunkerDetector implements FeatureDetector {
    readonly featureType: any;
    private readonly openCv;
    constructor(openCv: OpenCvAdapter);
    detect(request: DetectionRequest): readonly Feature[];
}
