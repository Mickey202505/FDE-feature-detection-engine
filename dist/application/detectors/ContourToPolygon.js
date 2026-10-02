import { Polygon } from "../../domain/Polygon.js";
import { WorldPoint } from "../../domain/WorldPoint.js";
export class ContourToPolygon {
    convert(contour, metresPerPixel) {
        if (metresPerPixel <= 0) {
            throw new Error("metresPerPixel must be greater than zero.");
        }
        if (contour.length < 3) {
            throw new Error("A contour must contain at least three points.");
        }
        const points = contour.map((point) => new WorldPoint(point.x * metresPerPixel, point.y * metresPerPixel));
        return new Polygon(points);
    }
}
//# sourceMappingURL=ContourToPolygon.js.map