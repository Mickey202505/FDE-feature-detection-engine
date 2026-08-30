import {
    describe,
    expect,
    it
} from "vitest";

import {
    FeatureDetectionEngine,
    type DetectionRequest
} from "../../src";

import {
    FeatureType
} from "../../src/domain/FeatureType";

import type {
    OpenCvRuntime
} from "../../src/application/opencv/OpenCvTypes";

const fakeCv: OpenCvRuntime = {
    Mat: class {
        rows = 0;
        cols = 0;

        delete(): void {}
    },

    MatVector: class {
        size(): number {
            return 0;
        }

        get(): never {
            throw new Error(
                "No contours"
            );
        }

        delete(): void {}
    },

    findContours(): void {},

    RETR_EXTERNAL: 0,
    CHAIN_APPROX_SIMPLE: 2,

    Size: class {
        public constructor(
            public readonly width: number,
            public readonly height: number
        ) {}
    },

    Point: class {
        public constructor(
            public readonly x: number,
            public readonly y: number
        ) {}
    }
};

describe(
    "FeatureDetectionEngine",
    () => {
        it("can be created", () => {
            const engine =
                new FeatureDetectionEngine(
                    fakeCv
                );

            expect(
                engine
            ).toBeDefined();
        });

        it(
            "returns a detection result",
            () => {
                const engine =
                    new FeatureDetectionEngine(
                        fakeCv
                    );

                const request:
                    DetectionRequest = {
                    image: {
                        rows: 100,
                        cols: 100,
                        delete: () =>
                            undefined
                    },
                    metresPerPixel: 0.1
                };

                const result =
                    engine.detect(
                        request
                    );

                expect(
                    result
                ).toBeDefined();

                expect(
                    result.features
                ).toEqual([]);
            }
        );

        it(
            "returns a green feature for a seeded contour",
            () => {
                const contour = {
                    points: [
                        { x: 10, y: 10 },
                        { x: 40, y: 10 },
                        { x: 40, y: 40 },
                        { x: 10, y: 40 }
                    ]
                };

                const adapterCv:
                    OpenCvRuntime = {
                    ...fakeCv,

                    MatVector: class {
                        size(): number {
                            return 1;
                        }

                        get(): {
                            rows: number;
                            cols: number;
                            data32S: Int32Array;
                            delete(): void;
                        } {
                            return {
                                rows: 4,
                                cols: 1,
                                data32S: new Int32Array([
                                    10, 10,
                                    40, 10,
                                    40, 40,
                                    10, 40
                                ]),
                                delete(): void {}
                            };
                        }

                        delete(): void {}
                    },

                    findContours(
                        _image: unknown,
                        contours: {
                            size(): number;
                            get(index: number): unknown;
                            delete(): void;
                        }
                    ): void {
                        void _image;
                        void contours;
                    }
                };

                void contour;

                const engine =
                    new FeatureDetectionEngine(
                        adapterCv
                    );

                const request:
                    DetectionRequest = {
                    image: {
                        rows: 100,
                        cols: 100,
                        delete: () =>
                            undefined
                    },
                    metresPerPixel: 1,
                    seed: {
                        x: 25,
                        y: 25
                    }
                };

                const result =
                    engine.detect(
                        request
                    );

                expect(
                    result.features
                ).toHaveLength(1);

                expect(
                    result.features[0]?.type
                ).toBe(FeatureType.Green);
            }
        );
    }
);