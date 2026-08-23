export interface OpenCvMat {
    readonly rows: number;
    readonly cols: number;
    readonly data32S?: Int32Array;

    delete(): void;

    type?(): number;

    ucharPtr?(
        row: number,
        col: number
    ): Uint8Array;

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

    readonly get: (
        index: number
    ) => OpenCvMat;

    delete(): void;
}

export interface OpenCvImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
}

export interface OpenCvRuntime {

    readonly Mat: {
        new (): OpenCvMat;

        ones?(
            rows: number,
            cols: number,
            type: number
        ): OpenCvMat;
    };

    readonly MatVector: new () => OpenCvContourCollection;

    findContours(
        image: OpenCvMat,
        contours: OpenCvContourCollection,
        hierarchy: OpenCvMat,
        mode: number,
        method: number
    ): void;

    approxPolyDP?(
        curve: OpenCvMat,
        approxCurve: OpenCvMat,
        epsilon: number,
        closed: boolean
    ): void;

    threshold?(
        src: OpenCvMat,
        dst: OpenCvMat,
        thresh: number,
        maxval: number,
        type: number
    ): void;

    cvtColor?(
        src: OpenCvMat,
        dst: OpenCvMat,
        code: number
    ): void;

    inRange?(
        src: OpenCvMat,
        lowerb: OpenCvMat,
        upperb: OpenCvMat,
        dst: OpenCvMat
    ): void;

    getStructuringElement?(
        shape: number,
        ksize: OpenCvSize
    ): OpenCvMat;

    morphologyEx?(
        src: OpenCvMat,
        dst: OpenCvMat,
        op: number,
        kernel: OpenCvMat
    ): void;

    GaussianBlur?(
        src: OpenCvMat,
        dst: OpenCvMat,
        ksize: OpenCvSize,
        sigmaX: number,
        sigmaY: number
    ): void;

    dilate?(
        src: OpenCvMat,
        dst: OpenCvMat,
        kernel: OpenCvMat,
        anchor: OpenCvPoint,
        iterations: number
    ): void;

    readonly RETR_EXTERNAL: number;
    readonly CHAIN_APPROX_SIMPLE: number;

    readonly COLOR_RGBA2GRAY?: number;
    readonly COLOR_RGBA2RGB?: number;

    readonly MORPH_ELLIPSE?: number;
    readonly MORPH_OPEN?: number;
    readonly MORPH_CLOSE?: number;

    readonly THRESH_BINARY?: number;
    readonly THRESH_OTSU?: number;

    readonly CV_8U?: number;

    readonly Size: new (
        width: number,
        height: number
    ) => OpenCvSize;

    readonly Point: new (
        x: number,
        y: number
    ) => OpenCvPoint;

    readonly matFromImageData?: (
        imageData: OpenCvImageData
    ) => OpenCvMat;

}

export interface OpenCvSize {
    readonly width: number;
    readonly height: number;
}