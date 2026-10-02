import { FeatureType } from "./FeatureType";
import { Polygon } from "./Polygon";
export declare class Feature {
    readonly type: FeatureType;
    readonly polygon: Polygon;
    readonly confidence: number;
    constructor(type: FeatureType, polygon: Polygon, confidence: number);
}
