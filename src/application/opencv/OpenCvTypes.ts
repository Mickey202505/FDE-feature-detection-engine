export interface OpenCvMat {
    readonly rows: number;
    readonly cols: number;

    readonly data32S?: Int32Array;

    readonly delete: () => void;

    readonly type?: () => number;

    readonly ucharPtr?: (
        row: number,
        col: number,
    ) => Uint8Array;
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
    readonly delete: () => void;
}

export interface OpenCvImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
}

export interface OpenCvRuntime {
    readonly Mat: new (
        rows?: number,
        cols?: number,
        type?: number,
    ) => OpenCvMat;

    readonly MatVector: new () => OpenCvContourCollection;

    readonly findContours: (
        image: OpenCvMat,
        contours: OpenCvContourCollection,
        hierarchy: OpenCvMat,
        mode: number,
        method: number,
    ) => void;

    readonly approxPolyDP?: (
        curve: OpenCvMat,
        approxCurve: OpenCvMat,
        epsilon: number,
        closed: boolean,
    ) => void;

    readonly threshold?: (
        src: OpenCvMat,
        dst: OpenCvMat,
        thresh: number,
        maxval: number,
        type: number,
    ) => void;

    readonly cvtColor?: (
        src: OpenCvMat,
        dst: OpenCvMat,
        code: number,
    ) => void;

    readonly inRange?: (
        src: OpenCvMat,
        lowerb: OpenCvMat,
        upperb: OpenCvMat,
        dst: OpenCvMat,
    ) => void;

    readonly getStructuringElement?: (
        shape: number,
        ksize: unknown,
    ) => OpenCvMat;

    readonly morphologyEx?: (
        src: OpenCvMat,
        dst: OpenCvMat,
        op: number,
        kernel: OpenCvMat,
    ) => void;

    readonly GaussianBlur?: (
        src: OpenCvMat,
        dst: OpenCvMat,
        ksize: unknown,
        sigmaX: number,
    ) => void;

    readonly dilate?: (
        src: OpenCvMat,
        dst: OpenCvMat,
        kernel: OpenCvMat,
    ) => void;

    readonly RETR_EXTERNAL: number;
    readonly CHAIN_APPROX_SIMPLE: number;
    readonly CV_8U: number;

    readonly COLOR_RGBA2RGB?: number;
    readonly COLOR_RGBA2GRAY?: number;

    readonly MORPH_OPEN?: number;
    readonly MORPH_CLOSE?: number;

    readonly matFromImageData?: (
        imageData: OpenCvImageData,
    ) => OpenCvMat;

    readonly Size?: new (
        width: number,
        height: number,
    ) => unknown;

    readonly Point?: new (
        x: number,
        y: number,
    ) => unknown;
}