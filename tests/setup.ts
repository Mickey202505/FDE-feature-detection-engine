import cv from "opencv.js";

// Vitest runs in Node, which doesn't have a global `window` object by default.
// OpenCVJsRuntime expects `window.cv` to be available.
global.window = global as any;
global.window.cv = cv;
