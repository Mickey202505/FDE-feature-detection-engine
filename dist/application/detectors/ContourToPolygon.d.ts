import { Polygon } from "../../domain/Polygon.js";
import type { PixelPoint } from "../opencv/PixelPoint.js";
export declare class ContourToPolygon {
    convert(contour: readonly PixelPoint[], metresPerPixel: number): Polygon;
}
