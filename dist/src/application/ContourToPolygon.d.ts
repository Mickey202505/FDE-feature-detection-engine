import { Polygon } from "../domain/Polygon";
export interface PixelPoint {
    x: number;
    y: number;
}
export declare class ContourToPolygon {
    static convert(contour: readonly PixelPoint[], metresPerPixel: number): Polygon;
}
