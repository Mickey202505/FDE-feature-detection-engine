import {
    describe,
    expect,
    it
} from "vitest";

import {
    FeatureDetectionEngine
} from "../../src";

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

    CV_8U: 0,
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

    }
);
