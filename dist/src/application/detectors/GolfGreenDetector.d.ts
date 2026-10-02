import { Feature } from "../../domain/Feature";
import { FeatureType } from "../../domain/FeatureType";
import { WorldPoint } from "../../domain/WorldPoint";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter";
export declare class GolfGreenDetector implements FeatureDetector {
    readonly featureType = FeatureType.Green;
    private readonly openCv;
    constructor(openCv: OpenCvAdapter);
    detect(request: DetectionRequest): readonly Feature[];
    private fromContour;
    private toWorldPolygon;
    static fromPoints(points: readonly WorldPoint[], confidence: number): Feature;
}
