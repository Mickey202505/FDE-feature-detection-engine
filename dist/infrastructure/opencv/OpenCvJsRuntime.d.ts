import type { OpenCvRuntime } from "../../application/opencv/OpenCvTypes";
declare global {
    interface Window {
        cv?: OpenCvRuntime;
    }
}
export declare const openCvRuntime: OpenCvRuntime;
export default openCvRuntime;
