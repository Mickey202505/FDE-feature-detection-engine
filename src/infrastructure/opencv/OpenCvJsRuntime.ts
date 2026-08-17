import type { OpenCvRuntime } from "../../application/opencv/OpenCvTypes";

declare global {
    interface Window {
        cv?: OpenCvRuntime;
    }
}

function getOpenCvRuntime(): OpenCvRuntime {
    if (typeof window !== "undefined" && window.cv !== undefined) {
        return window.cv;
    }

    throw new Error(
        "OpenCV.js runtime is not available. Load OpenCV.js before using the OpenCvJsRuntime."
    );
}

export const openCvJsRuntime: OpenCvRuntime = getOpenCvRuntime();

export default openCvJsRuntime;