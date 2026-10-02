import { Polygon } from "../../domain/Polygon";
import type { PixelPoint } from "../opencv/PixelPoint";
export declare class ContourToPolygon {
    convert(contour: readonly PixelPoint[], metresPerPixel: number): Polygon;
}
