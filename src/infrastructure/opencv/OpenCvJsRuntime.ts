import type { OpenCvRuntime } from "../../application/opencv/OpenCvTypes";

declare global {
    interface Window {
        cv?: OpenCvRuntime;
    }
}

function getOpenCvRuntime(): OpenCvRuntime {
    const cv = window.cv;

    if (cv === undefined) {
        throw new Error(
            "OpenCV.js has not finished loading."
        );
    }

    return cv;
}

export const openCvRuntime: OpenCvRuntime =
    getOpenCvRuntime();