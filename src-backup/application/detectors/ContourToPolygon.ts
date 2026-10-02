import { Polygon } from "../../domain/Polygon";
import { WorldPoint } from "../../domain/WorldPoint";
import type { PixelPoint } from "../opencv/PixelPoint";

export class ContourToPolygon {
    public convert(
        contour: readonly PixelPoint[],
        metresPerPixel: number
    ): Polygon {
        if (metresPerPixel <= 0) {
            throw new Error("metresPerPixel must be greater than zero.");
        }

        if (contour.length < 3) {
            throw new Error("A contour must contain at least three points.");
        }

        const points = contour.map(
            (point) =>
                new WorldPoint(
                    point.x * metresPerPixel,
                    point.y * metresPerPixel
                )
        );

        return new Polygon(points);
    }
}