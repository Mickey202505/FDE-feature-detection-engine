import { Feature } from "../../domain/Feature.js";
import { FeatureType } from "../../domain/FeatureType.js";
import { Polygon } from "../../domain/Polygon.js";
import { WorldPoint } from "../../domain/WorldPoint.js";
export class BunkerDetector {
    featureType = FeatureType.Bunker;
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
        const worldPoints = boundaryPoints.map((point) => new WorldPoint(point.x * request.metresPerPixel, point.y * request.metresPerPixel));
        return [
            new Feature(FeatureType.Bunker, new Polygon(worldPoints), 0.5)
        ];
    }
}
//# sourceMappingURL=BunkerDetector.js.map