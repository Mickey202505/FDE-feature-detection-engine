"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DetectionPipeline_1 = require("../../src/application/pipeline/DetectionPipeline");
const FeatureType_1 = require("../../src/domain/FeatureType");
(0, vitest_1.describe)("DetectionPipeline", () => {
    (0, vitest_1.it)("runs all detectors", () => {
        const detector = {
            featureType: FeatureType_1.FeatureType.Green,
            detect: () => []
        };
        const pipeline = new DetectionPipeline_1.DetectionPipeline([detector]);
        const result = pipeline.detect({
            featureType: FeatureType_1.FeatureType.Green,
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1
        });
        (0, vitest_1.expect)(result).toEqual([]);
    });
});
//# sourceMappingURL=DetectionPipeline.test.js.map