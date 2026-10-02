"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const src_1 = require("../../src");
const fakeCv = {
    Mat: class {
        rows = 0;
        cols = 0;
        delete() { }
    },
    MatVector: class {
        size() {
            return 0;
        }
        get() {
            throw new Error("No contours");
        }
        delete() { }
    },
    findContours() { },
    CV_8U: 0,
    RETR_EXTERNAL: 0,
    CHAIN_APPROX_SIMPLE: 2,
    CHAIN_APPROX_NONE: 2,
    Size: class {
        width;
        height;
        constructor(width, height) {
            this.width = width;
            this.height = height;
        }
    },
    Point: class {
        x;
        y;
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
};
(0, vitest_1.describe)("FeatureDetectionEngine", () => {
    (0, vitest_1.it)("can be created", () => {
        const engine = new src_1.FeatureDetectionEngine(fakeCv);
        (0, vitest_1.expect)(engine).toBeDefined();
    });
});
//# sourceMappingURL=FeatureDetectionEngine.test.js.map