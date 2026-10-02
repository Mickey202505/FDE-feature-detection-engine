"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const FeatureType_1 = require("../../src/domain/FeatureType");
(0, vitest_1.describe)("DetectionRequest", () => {
    (0, vitest_1.it)("can represent an image detection request", () => {
        const request = {
            featureType: FeatureType_1.FeatureType.Green,
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1
        };
        (0, vitest_1.expect)(request.metresPerPixel).toBe(0.1);
    });
    (0, vitest_1.it)("can represent an image-space seed point", () => {
        const request = {
            featureType: FeatureType_1.FeatureType.Green,
            image: {
                rows: 100,
                cols: 100,
                delete: () => undefined
            },
            metresPerPixel: 0.1,
            seed: {
                x: 50,
                y: 60
            }
        };
        (0, vitest_1.expect)(request.seed).toEqual({ x: 50, y: 60 });
    });
});
//# sourceMappingURL=DetectionRequest.test.js.map