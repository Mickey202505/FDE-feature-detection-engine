import { FeatureType } from "./FeatureType.js";
import { Polygon } from "./Polygon.js";
export declare class Feature {
    readonly type: FeatureType;
    readonly polygon: Polygon;
    readonly confidence: number;
    constructor(type: FeatureType, polygon: Polygon, confidence: number);
}
