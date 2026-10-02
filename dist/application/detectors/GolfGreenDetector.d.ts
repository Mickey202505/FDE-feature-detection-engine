import { Feature } from "../../domain/Feature.js";
import { FeatureType } from "../../domain/FeatureType.js";
import { WorldPoint } from "../../domain/WorldPoint.js";
import type { DetectionRequest } from "../../api/DetectionRequest.js";
import type { FeatureDetector } from "./FeatureDetector.js";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter.js";
export declare class GolfGreenDetector implements FeatureDetector {
    readonly featureType = FeatureType.Green;
    private readonly openCv;
    constructor(openCv: OpenCvAdapter);
    detect(request: DetectionRequest): readonly Feature[];
    private fromContour;
    private toWorldPolygon;
    static fromPoints(points: readonly WorldPoint[], confidence: number): Feature;
}
