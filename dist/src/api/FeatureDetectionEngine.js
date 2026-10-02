"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureDetectionEngine = void 0;
const FeatureDetectionEngineImpl_1 = require("../application/FeatureDetectionEngineImpl");
class FeatureDetectionEngine {
    implementation;
    constructor(cv) {
        this.implementation = new FeatureDetectionEngineImpl_1.FeatureDetectionEngineImpl(cv);
    }
    detect(request) {
        return this.implementation.detect(request);
    }
}
exports.FeatureDetectionEngine = FeatureDetectionEngine;
//# sourceMappingURL=FeatureDetectionEngine.js.map