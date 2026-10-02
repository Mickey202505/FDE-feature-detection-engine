"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("Loading OpenCV.js...");
const cv = require("opencv.js");
console.log("OpenCV.js loaded:", Object.keys(cv).length, "keys");
global.window = globalThis;
global.window.cv = cv;
console.log("OpenCV.js attached to window.");
//# sourceMappingURL=setup.js.map