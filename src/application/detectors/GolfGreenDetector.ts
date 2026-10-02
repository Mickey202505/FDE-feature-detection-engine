import { Feature } from "../../domain/Feature.js";
import { FeatureType } from "../../domain/FeatureType.js";
import { Polygon } from "../../domain/Polygon.js";
import { WorldPoint } from "../../domain/WorldPoint.js";
import type { DetectionRequest } from "../../api/DetectionRequest.js";
import type { FeatureDetector } from "./FeatureDetector.js";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter.js";
import type {
    OpenCvContour,
    OpenCvPoint
} from "../opencv/OpenCvTypes.js";

export class GolfGreenDetector implements FeatureDetector {
    public readonly featureType = FeatureType.Green;
    private readonly openCv: OpenCvAdapter;

    public constructor(openCv: OpenCvAdapter) {
        this.openCv = openCv;
    }

     public detect(
        request: DetectionRequest
    ): readonly Feature[] {
        if (request.seed !== undefined) {
            const boundaryPoints = this.openCv.detectGreenBoundary(
                request.image,
                request.seed,
            );

            if (boundaryPoints.length < 3) {
                return [];
            }

            const worldPoints = boundaryPoints.map(
                (point) =>
                    new WorldPoint(
                        point.x * request.metresPerPixel,
                        point.y * request.metresPerPixel,
                    ),
            );

            return [GolfGreenDetector.fromPoints(worldPoints, 0.5)];
        }

        const contours = this.openCv.findContours(request.image);

        const features: Feature[] = [];

        for (const contour of contours) {
            if (contour.points.length < 3) {
                continue;
            }

            features.push(
                this.fromContour(
                    contour,
                    request.metresPerPixel
                )
            );
        }

        return features;
    }

    private fromContour(
        contour: OpenCvContour,
        metresPerPixel: number
    ): Feature {
        const polygon = this.toWorldPolygon(
            contour.points,
            metresPerPixel
        );

        return new Feature(
            FeatureType.Green,
            polygon,
            0.5
        );
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