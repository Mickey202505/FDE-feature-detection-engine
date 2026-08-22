import { Feature } from "../../domain/Feature";
import { FeatureType } from "../../domain/FeatureType";
import { Polygon } from "../../domain/Polygon";
import { WorldPoint } from "../../domain/WorldPoint";
import type { DetectionRequest } from "../../api/DetectionRequest";
import type { FeatureDetector } from "./FeatureDetector";
import type { OpenCvAdapter } from "../opencv/OpenCvAdapter";
import type {
    OpenCvContour,
    OpenCvPoint
} from "../opencv/OpenCvTypes";

export class GolfGreenDetector implements FeatureDetector {
    private readonly openCv: OpenCvAdapter;

    public constructor(openCv: OpenCvAdapter) {
        this.openCv = openCv;
    }

    public detect(
        request: DetectionRequest
    ): readonly Feature[] {
        const contours = this.openCv.findContours(request.image);

        if (request.seed !== undefined) {
            const selectedContour = contours.find(
                (contour) =>
                    contour.points.length >= 3 &&
                    GolfGreenDetector.containsPoint(
                        contour,
                        request.seed!.x,
                        request.seed!.y
                    )
            );

            if (selectedContour === undefined) {
                return [];
            }

            return [
                this.fromContour(
                    selectedContour,
                    request.metresPerPixel
                )
            ];
        }

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

    private static containsPoint(
        contour: OpenCvContour,
        x: number,
        y: number
    ): boolean {
        let inside = false;

        for (
            let i = 0, j = contour.points.length - 1;
            i < contour.points.length;
            j = i++
        ) {
            const current = contour.points[i];
            const previous = contour.points[j];

            const intersects =
                current.y > y !== previous.y > y &&
                x <
                    ((previous.x - current.x) *
                        (y - current.y)) /
                        (previous.y - current.y) +
                        current.x;

            if (intersects) {
                inside = !inside;
            }
        }

        return inside;
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