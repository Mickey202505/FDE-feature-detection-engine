export interface OpenCvMat {
    readonly rows: number;
    readonly cols: number;
    readonly data32S?: Int32Array;
    delete(): void;
}

export interface OpenCvPoint {
    readonly x: number;
    readonly y: number;
}

export interface OpenCvContour {
    readonly points: readonly OpenCvPoint[];
}

export interface OpenCvContourCollection {
    readonly size: () => number;
    readonly get: (index: number) => OpenCvMat;
    delete(): void;
}

export interface OpenCvImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
}

export interface OpenCvRuntime {
    readonly Mat: new () => OpenCvMat;

    readonly MatVector: new () => OpenCvContourCollection;

    findContours(
        image: OpenCvMat,
        contours: OpenCvContourCollection,
        hierarchy: OpenCvMat,
        mode: number,
        method: number
    ): void;

    readonly RETR_EXTERNAL: number;
    readonly CHAIN_APPROX_SIMPLE: number;

    readonly matFromImageData?: (
        imageData: OpenCvImageData
    ) => OpenCvMat;
}
