"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
class Feature {
    type;
    polygon;
    confidence;
    constructor(type, polygon, confidence) {
        if (confidence < 0 || confidence > 1) {
            throw new Error("Confidence must be between 0 and 1.");
        }
        this.type = type;
        this.polygon = polygon;
        this.confidence = confidence;
    }
}
exports.Feature = Feature;
//# sourceMappingURL=Feature.js.map