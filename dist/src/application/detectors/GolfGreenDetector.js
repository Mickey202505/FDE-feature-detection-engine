"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GolfGreenDetector = void 0;
const Feature_1 = require("../../domain/Feature");
const FeatureType_1 = require("../../domain/FeatureType");
const Polygon_1 = require("../../domain/Polygon");
const WorldPoint_1 = require("../../domain/WorldPoint");
class GolfGreenDetector {
    featureType = FeatureType_1.FeatureType.Green;
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
            const worldPoints = boundaryPoints.map((point) => new WorldPoint_1.WorldPoint(point.x * request.metresPerPixel, point.y * request.metresPerPixel));
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
        return new Feature_1.Feature(FeatureType_1.FeatureType.Green, polygon, 0.5);
    }
    toWorldPolygon(points, metresPerPixel) {
        if (metresPerPixel <= 0) {
            throw new Error("metresPerPixel must be greater than zero.");
        }
        return new Polygon_1.Polygon(points.map((point) => new WorldPoint_1.WorldPoint(point.x * metresPerPixel, point.y * metresPerPixel)));
    }
    static fromPoints(points, confidence) {
        if (confidence < 0 || confidence > 1) {
            throw new Error("Golf green confidence must be between 0 and 1.");
        }
        return new Feature_1.Feature(FeatureType_1.FeatureType.Green, new Polygon_1.Polygon(points), confidence);
    }
}
exports.GolfGreenDetector = GolfGreenDetector;
//# sourceMappingURL=GolfGreenDetector.js.map