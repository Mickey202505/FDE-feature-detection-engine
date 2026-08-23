console.log("Loading OpenCV.js...");
const cv = require("opencv.js");
console.log("OpenCV.js loaded:", Object.keys(cv).length, "keys");
global.window = global as any;
global.window.cv = cv;
console.log("OpenCV.js attached to window.");
