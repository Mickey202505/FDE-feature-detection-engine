import type { PixelPoint } from "../../api/PixelPoint";
export interface WorldPoint {
    x: number;
    y: number;
}
export interface PixelToWorldTransform {
    toWorld(pixel: PixelPoint): WorldPoint;
}
export declare const IDENTITY_TRANSFORM: PixelToWorldTransform;
export interface FeatureSvgMetadata {
    courseName: string;
    holeNumber: number;
    featureType: "bunker" | "green";
    featureNumber: number;
}
export interface ExportSvgOptions {
    points: readonly PixelPoint[];
    metadata: FeatureSvgMetadata;
    transform?: PixelToWorldTransform;
    padding?: number;
    strokeWidth?: number;
}
export declare function exportSvg(options: ExportSvgOptions): string;
