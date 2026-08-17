declare module "opencv.js" {
    const cv: {
        readonly Mat:
            new () => import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvMat;

        readonly MatVector:
            new () => import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvContourCollection;

        readonly findContours: (
            image: import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvMat,
            contours: import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvContourCollection,
            hierarchy: import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvMat,
            mode: number,
            method: number
        ) => void;

        readonly RETR_EXTERNAL: number;
        readonly CHAIN_APPROX_SIMPLE: number;

        readonly matFromImageData: (
            imageData: import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvImageData
        ) => import(
            "../../application/opencv/OpenCvTypes"
        ).OpenCvMat;

        readonly cvtColor: (
            source: import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvMat,
            destination: import(
                "../../application/opencv/OpenCvTypes"
            ).OpenCvMat,
            code: number
        ) => void;

        readonly COLOR_RGBA2GRAY: number;
    };

    export = cv;
}
