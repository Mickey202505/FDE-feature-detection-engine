import { Polygon } from "../domain/Polygon";
import { WorldPoint } from "../domain/WorldPoint";
export class ContourToPolygon {
    static convert(contour, metresPerPixel) {
        if (metresPerPixel <= 0) {
            throw new Error("metresPerPixel must be greater than zero.");
        }
        if (contour.length < 3) {
            throw new Error("A contour must contain at least three points.");
        }
        const worldPoints = contour.map((point) => new WorldPoint(point.x * metresPerPixel, point.y * metresPerPixel));
        return new Polygon(worldPoints);
    }
}
//# sourceMappingURL=ContourToPolygon.js.map