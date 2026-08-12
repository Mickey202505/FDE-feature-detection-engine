import { FeatureType } from "./FeatureType";
import { Polygon } from "./Polygon";

export class Feature {
    public readonly type: FeatureType;
    public readonly polygon: Polygon;
    public readonly confidence: number;

    public constructor(
        type: FeatureType,
        polygon: Polygon,
        confidence: number
    ) {
        if (confidence < 0 || confidence > 1) {
            throw new Error("Confidence must be between 0 and 1.");
        }

        this.type = type;
        this.polygon = polygon;
        this.confidence = confidence;
    }
}