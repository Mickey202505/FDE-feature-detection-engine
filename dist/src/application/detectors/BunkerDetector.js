"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BunkerDetector = void 0;
const Feature_1 = require("../../domain/Feature");
const FeatureType_1 = require("../../domain/FeatureType");
const Polygon_1 = require("../../domain/Polygon");
const WorldPoint_1 = require("../../domain/WorldPoint");
class BunkerDetector {
    featureType = FeatureType_1.FeatureType.Bunker;
    openCv;
    constructor(openCv) {
        this.openCv = openCv;
    }
    detect(request) {
        if (request.seed === undefined) {
            return [];
        }
        const boundaryPoints = this.openCv.detectBunkerBoundary(request.image, request.seed);
        if (boundaryPoints.length < 3) {
            return [];
        }
        const worldPoints = boundaryPoints.map((point) => new WorldPoint_1.WorldPoint(point.x * request.metresPerPixel, point.y * request.metresPerPixel));
        return [
            new Feature_1.Feature(FeatureType_1.FeatureType.Bunker, new Polygon_1.Polygon(worldPoints), 0.5)
        ];
    }
}
exports.BunkerDetector = BunkerDetector;
//# sourceMappingURL=BunkerDetector.js.map