import cv from "opencv.js";
import type { OpenCvRuntime } from "../../application/opencv/OpenCvTypes";

export const openCvRuntime: OpenCvRuntime = {
    Mat: cv.Mat,
    MatVector: cv.MatVector,
    findContours: cv.findContours,
    RETR_EXTERNAL: cv.RETR_EXTERNAL,
    CHAIN_APPROX_SIMPLE: cv.CHAIN_APPROX_SIMPLE,
    matFromImageData: cv.matFromImageData
};