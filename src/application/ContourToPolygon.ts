import { Polygon } from "../domain/Polygon";
import { WorldPoint } from "../domain/WorldPoint";

export interface PixelPoint {
    x: number;
    y: number;
}

export class ContourToPolygon {
    public static convert(
        contour: readonly PixelPoint[],
        metresPerPixel: number
    ): Polygon {
        if (metresPerPixel <= 0) {
            throw new Error(
                "metresPerPixel must be greater than zero."
            );
        }

        if (contour.length < 3) {
            throw new Error(
                "A contour must contain at least three points."
            );
        }

        const worldPoints = contour.map(
            (point) =>
                new WorldPoint(
                    point.x * metresPerPixel,
                    point.y * metresPerPixel
                )
        );

        return new Polygon(worldPoints);
    }
}