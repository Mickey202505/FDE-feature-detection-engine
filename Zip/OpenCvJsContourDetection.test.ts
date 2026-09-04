import {
    beforeAll,
    describe,
    expect,
    it
} from "vitest";

import {
    loadOpenCV
} from "@opencvjs/node";

import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "../../src/application/opencv/OpenCvTypes";

import type {
    PixelPoint
} from "../../src/application/opencv/PixelPoint";

import {
    OpenCvJsAdapter
} from "../../src/application/opencv/OpenCvJsAdapter";

let openCvRuntime: OpenCvRuntime;

async function loadOpenCv(): Promise<OpenCvRuntime> {
    console.log("Loading OpenCV.js...");

    const cv = await loadOpenCV();

    if (cv === undefined || cv === null) {
        throw new Error(
            "OpenCV.js failed to initialise."
        );
    }

    console.log("OpenCV.js loaded.");

    return cv as unknown as OpenCvRuntime;
}

beforeAll(
    async () => {
        openCvRuntime =
            await loadOpenCv();
    },
    30_000
);

function createRgbaImage(
    cv: OpenCvRuntime,
    width: number,
    height: number,
    fill: (
        x: number,
        y: number
    ) => [
        number,
        number,
        number,
        number
    ]
): OpenCvMat {
    if (
        cv.matFromImageData === undefined
    ) {
        throw new Error(
            "OpenCV.js runtime does not provide matFromImageData()."
        );
    }

    const data =
        new Uint8ClampedArray(
            width * height * 4
        );

    for (
        let y = 0;
        y < height;
        y += 1
    ) {
        for (
            let x = 0;
            x < width;
            x += 1
        ) {
            const pixel =
                fill(x, y);

            const offset =
                (y * width + x) * 4;

            data[offset] =
                pixel[0];

            data[offset + 1] =
                pixel[1];

            data[offset + 2] =
                pixel[2];

            data[offset + 3] =
                pixel[3];
        }
    }

    return cv.matFromImageData({
        width,
        height,
        data
    });
}

function largestContour(
    contours: readonly OpenCvContour[]
): OpenCvContour {
    if (
        contours.length === 0
    ) {
        return {
            points: []
        };
    }

    return contours.reduce(
        (
            largest,
            current
        ) =>
            current.points.length >
            largest.points.length
                ? current
                : largest
    );
}

function getBounds(
    points: readonly {
        x: number;
        y: number;
    }[]
): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
} {
    if (
        points.length === 0
    ) {
        throw new Error(
            "Cannot calculate bounds for an empty contour."
        );
    }

    const xs =
        points.map(
            point => point.x
        );

    const ys =
        points.map(
            point => point.y
        );

    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
    };
}

describe(
    "OpenCvJs green detection",
    () => {

        it(
            "detects a seeded green area in a real OpenCV image",
            () => {
                const adapter =
                    new OpenCvJsAdapter(
                        openCvRuntime
                    );

                const mat =
                    createRgbaImage(
                        openCvRuntime,
                        100,
                        100,
                        (x, y) => {
                            const inside =
                                x >= 20 &&
                                x < 80 &&
                                y >= 20 &&
                                y < 80;

                            return inside
                                ? [
                                    40,
                                    180,
                                    40,
                                    255
                                ]
                                : [
                                    220,
                                    220,
                                    220,
                                    255
                                ];
                        }
                    );

                try {
                    const seed: PixelPoint = {
                        x: 50,
                        y: 50
                    };

                    const contours =
                        adapter.findContours(
                            mat,
                            seed
                        );

                    expect(
                        contours.length
                    ).toBeGreaterThan(0);

                    const largest =
                        largestContour(
                            contours
                        );
                    
                    const bounds =
                        getBounds(
                            largest.points
                        );

                    expect(
                        bounds.minX
                    ).toBeLessThanOrEqual(20);

                    expect(
                        bounds.maxX
                    ).toBeGreaterThanOrEqual(79);

                    expect(
                        bounds.minY
                    ).toBeLessThanOrEqual(20);

                    expect(
                        bounds.maxY
                    ).toBeGreaterThanOrEqual(79);

                } finally {
                    mat.delete();
                }
            }
        );

        it(
            "does not detect a green when the seed is on non-green pixels",
            () => {
                const adapter =
                    new OpenCvJsAdapter(
                        openCvRuntime
                    );

                const mat =
                    createRgbaImage(
                        openCvRuntime,
                        100,
                        100,
                        (x, y) => {
                            const inside =
                                x >= 20 &&
                                x < 80 &&
                                y >= 20 &&
                                y < 80;

                            return inside
                                ? [
                                    40,
                                    180,
                                    40,
                                    255
                                ]
                                : [
                                    220,
                                    220,
                                    220,
                                    255
                                ];
                        }
                    );

                try {
                    const seed: PixelPoint = {
                        x: 5,
                        y: 5
                    };

                    const contours =
                        adapter.findContours(
                            mat,
                            seed
                        );

                    expect(
                        contours
                    ).toEqual([]);

                } finally {
                    mat.delete();
                }
            }
        );

        it(
            "detects a green area with modest colour variation",
            () => {
                const adapter =
                    new OpenCvJsAdapter(
                        openCvRuntime
                    );

                const mat =
                    createRgbaImage(
                        openCvRuntime,
                        100,
                        100,
                        (x, y) => {
                            const inside =
                                x >= 20 &&
                                x < 80 &&
                                y >= 20 &&
                                y < 80;

                            if (!inside) {
                                return [
                                    220,
                                    220,
                                    220,
                                    255
                                ];
                            }

                            const variation =
                                (x + y) % 10;

                            return [
                                40 + variation,
                                180 + variation,
                                40 + variation,
                                255
                            ];
                        }
                    );

                try {
                    const seed: PixelPoint = {
                        x: 50,
                        y: 50
                    };

                    const contours =
                        adapter.findContours(
                            mat,
                            seed
                        );

                    expect(
                        contours.length
                    ).toBeGreaterThan(0);

                } finally {
                    mat.delete();
                }
            }
        );

        it(
            "keeps the detected green boundary close to the actual boundary",
            () => {
                const adapter =
                    new OpenCvJsAdapter(
                        openCvRuntime
                    );

                const mat =
                    createRgbaImage(
                        openCvRuntime,
                        120,
                        100,
                        (x, y) => {
                            const inside =
                                x >= 30 &&
                                x < 90 &&
                                y >= 20 &&
                                y < 80;

                            return inside
                                ? [
                                    40,
                                    180,
                                    40,
                                    255
                                ]
                                : [
                                    220,
                                    220,
                                    220,
                                    255
                                ];
                        }
                    );

                try {
                    const seed: PixelPoint = {
                        x: 60,
                        y: 50
                    };

                    const contours =
                        adapter.findContours(
                            mat,
                            seed
                        );

                    expect(
                        contours.length
                    ).toBeGreaterThan(0);

                    const largest =
                        largestContour(
                            contours
                        );

                    const bounds =
                        getBounds(
                            largest.points
                        );

                    expect(
                        Math.abs(
                            bounds.minX - 30
                        )
                    ).toBeLessThanOrEqual(2);

                    expect(
                        Math.abs(
                            bounds.maxX - 89
                        )
                    ).toBeLessThanOrEqual(2);

                    expect(
                        Math.abs(
                            bounds.minY - 20
                        )
                    ).toBeLessThanOrEqual(2);

                    expect(
                        Math.abs(
                            bounds.maxY - 79
                        )
                    ).toBeLessThanOrEqual(2);

                } finally {
                    mat.delete();
                }
            }
        );

        it(
            "does not classify a bright non-green region as a green without a seed",
            () => {
                const adapter =
                    new OpenCvJsAdapter(
                        openCvRuntime
                    );

                const mat =
                    createRgbaImage(
                        openCvRuntime,
                        100,
                        100,
                        (x, y) => {
                            const inside =
                                x >= 10 &&
                                x < 60 &&
                                y >= 20 &&
                                y < 80;

                            return inside
                                ? [
                                    230,
                                    230,
                                    230,
                                    255
                                ]
                                : [
                                    40,
                                    40,
                                    40,
                                    255
                                ];
                        }
                    );

                try {
                    const contours =
                        adapter.findContours(
                            mat
                        );

                    expect(
                        contours
                    ).toEqual([]);

                } finally {
                    mat.delete();
                }
            }
        );
    }
);