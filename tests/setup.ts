console.log("Loading OpenCV.js...");

const cv = require("opencv.js");

console.log(
    "OpenCV.js loaded:",
    Object.keys(cv).length,
    "keys"
);

global.window = globalThis as typeof global.window;
global.window.cv = cv;

console.log("OpenCV.js attached to window.");