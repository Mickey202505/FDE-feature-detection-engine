import { Feature } from "../../domain/Feature";
import { WorldPoint } from "../../domain/WorldPoint";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter";
export declare class GolfGreenDetector implements FeatureDetector {
    readonly featureType: any;
    private readonly openCv;
    constructor(openCv: OpenCvAdapter);
    detect(request: DetectionRequest): readonly Feature[];
    private fromContour;
    private toWorldPolygon;
    static fromPoints(points: readonly WorldPoint[], confidence: number): Feature;
}
