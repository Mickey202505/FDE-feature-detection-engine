function getOpenCvRuntime() {
    if (typeof window !== "undefined" &&
        window.cv !== undefined) {
        return window.cv;
    }
    throw new Error("OpenCV.js runtime is not available. Load OpenCV.js before using the OpenCvJsRuntime.");
}
export const openCvRuntime = getOpenCvRuntime();
export default openCvRuntime;
//# sourceMappingURL=OpenCvJsRuntime.js.map