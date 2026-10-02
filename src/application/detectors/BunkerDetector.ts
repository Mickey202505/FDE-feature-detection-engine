import { Feature } from "../../domain/Feature.js";
import { FeatureType } from "../../domain/FeatureType.js";
import { Polygon } from "../../domain/Polygon.js";
import { WorldPoint } from "../../domain/WorldPoint.js";
import type { DetectionRequest } from "../../api/DetectionRequest.js";
import type { FeatureDetector } from "./FeatureDetector.js";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter.js";

export class BunkerDetector implements FeatureDetector {
    public readonly featureType = FeatureType.Bunker;
    private readonly openCv: OpenCvAdapter;

    public constructor(openCv: OpenCvAdapter) {
        this.openCv = openCv;
    }

    public detect(
        request: DetectionRequest
    ): readonly Feature[] {
        if (request.seed === undefined) {
            return [];
        }

        const boundaryPoints = this.openCv.detectBunkerBoundary(
            request.image,
            request.seed
        );

        if (boundaryPoints.length < 3) {
            return [];
        }

        const worldPoints = boundaryPoints.map(
            (point) =>
                new WorldPoint(
                    point.x * request.metresPerPixel,
                    point.y * request.metresPerPixel
                )
        );

        return [
            new Feature(
                FeatureType.Bunker,
                new Polygon(worldPoints),
                0.5
            )
        ];
    }
}