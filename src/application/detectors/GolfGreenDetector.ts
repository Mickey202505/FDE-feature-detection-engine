import { Feature } from "../../domain/Feature";
import { FeatureType } from "../../domain/FeatureType";
import { Polygon } from "../../domain/Polygon";
import { WorldPoint } from "../../domain/WorldPoint";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter";
import type { OpenCvPoint } from "../opencv/OpenCvTypes";

export class GolfGreenDetector implements FeatureDetector {
    private readonly openCv: OpenCvAdapter;

    public constructor(openCv: OpenCvAdapter) {
        this.openCv = openCv;
    }

    public detect(
        request: DetectionRequest
    ): readonly Feature[] {
        const contours = this.openCv.findContours(request.image);
        const features: Feature[] = [];

        for (const contour of contours) {
            if (contour.points.length < 3) {
                continue;
            }

            const polygon = this.toWorldPolygon(
                contour.points,
                request.metresPerPixel
            );

            features.push(
                new Feature(
                    FeatureType.Green,
                    polygon,
                    0.5
                )
            );
        }

        return features;
    }

    private toWorldPolygon(
        points: readonly OpenCvPoint[],
        metresPerPixel: number
    ): Polygon {
        if (metresPerPixel <= 0) {
            throw new Error(
                "metresPerPixel must be greater than zero."
            );
        }

        return new Polygon(
            points.map(
                (point) =>
                    new WorldPoint(
                        point.x * metresPerPixel,
                        point.y * metresPerPixel
                    )
            )
        );
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