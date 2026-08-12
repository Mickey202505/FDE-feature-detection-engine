import { Feature } from "../../domain/Feature";
import { FeatureType } from "../../domain/FeatureType";
import { Polygon } from "../../domain/Polygon";
import { WorldPoint } from "../../domain/WorldPoint";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";

export class GolfGreenDetector implements FeatureDetector {
    public detect(
        request: DetectionRequest
    ): readonly Feature[] {
        void request;

        // Real image analysis will be added in the next stage.
        // For now the detector deliberately returns no features.
        return [];
    }

    public static fromPoints(
        points: readonly WorldPoint[],
        confidence: number
    ): Feature {
        if (confidence < 0 || confidence > 1) {
            throw new Error(
                "Golf green confidence must be between 0 and 1."
            );
        }

        return new Feature(
            FeatureType.Green,
            new Polygon(points),
            confidence
        );
    }
}