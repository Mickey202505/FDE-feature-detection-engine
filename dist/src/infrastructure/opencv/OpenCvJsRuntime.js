"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openCvRuntime = void 0;
function getOpenCvRuntime() {
    if (typeof window !== "undefined" &&
        window.cv !== undefined) {
        return window.cv;
    }
    throw new Error("OpenCV.js runtime is not available. Load OpenCV.js before using the OpenCvJsRuntime.");
}
exports.openCvRuntime = getOpenCvRuntime();
exports.default = exports.openCvRuntime;
//# sourceMappingURL=OpenCvJsRuntime.js.map