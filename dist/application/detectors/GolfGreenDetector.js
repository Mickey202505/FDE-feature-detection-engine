import { Feature } from "../../domain/Feature.js";
import { FeatureType } from "../../domain/FeatureType.js";
import { Polygon } from "../../domain/Polygon.js";
import { WorldPoint } from "../../domain/WorldPoint.js";
export class GolfGreenDetector {
    featureType = FeatureType.Green;
    openCv;
    constructor(openCv) {
        this.openCv = openCv;
    }
    detect(request) {
        if (request.seed !== undefined) {
            const boundaryPoints = this.openCv.detectGreenBoundary(request.image, request.seed);
            if (boundaryPoints.length < 3) {
                return [];
            }
            const worldPoints = boundaryPoints.map((point) => new WorldPoint(point.x * request.metresPerPixel, point.y * request.metresPerPixel));
            return [GolfGreenDetector.fromPoints(worldPoints, 0.5)];
        }
        const contours = this.openCv.findContours(request.image);
        const features = [];
        for (const contour of contours) {
            if (contour.points.length < 3) {
                continue;
            }
            features.push(this.fromContour(contour, request.metresPerPixel));
        }
        return features;
    }
    fromContour(contour, metresPerPixel) {
        const polygon = this.toWorldPolygon(contour.points, metresPerPixel);
        return new Feature(FeatureType.Green, polygon, 0.5);
    }
    toWorldPolygon(points, metresPerPixel) {
        if (metresPerPixel <= 0) {
            throw new Error("metresPerPixel must be greater than zero.");
        }
        return new Polygon(points.map((point) => new WorldPoint(point.x * metresPerPixel, point.y * metresPerPixel)));
    }
    static fromPoints(points, confidence) {
        if (confidence < 0 || confidence > 1) {
            throw new Error("Golf green confidence must be between 0 and 1.");
        }
        return new Feature(FeatureType.Green, new Polygon(points), confidence);
    }
}
//# sourceMappingURL=GolfGreenDetector.js.map