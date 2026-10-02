"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const FeatureType_1 = require("../../src/domain/FeatureType");
(0, vitest_1.describe)("FeatureType", () => {
    (0, vitest_1.it)("defines the initial golf feature types", () => {
        (0, vitest_1.expect)(FeatureType_1.FeatureType.Green).toBe("Green");
        (0, vitest_1.expect)(FeatureType_1.FeatureType.Fringe).toBe("Fringe");
        (0, vitest_1.expect)(FeatureType_1.FeatureType.Tee).toBe("Tee");
        (0, vitest_1.expect)(FeatureType_1.FeatureType.Bunker).toBe("Bunker");
        (0, vitest_1.expect)(FeatureType_1.FeatureType.Fairway).toBe("Fairway");
    });
});
//# sourceMappingURL=FeatureType.test.js.map