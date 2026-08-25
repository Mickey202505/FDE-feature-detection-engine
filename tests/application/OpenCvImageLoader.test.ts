import { describe, expect, it, vi } from "vitest";
import { OpenCvImageLoader } from "../../src/OpenCvImageLoader";
import type { OpenCvImageData } from "../../src/application/opencv/OpenCvTypes";
import type {
    OpenCvMat,
    OpenCvRuntime
} from "../../src/application/opencv/OpenCvTypes";

class FakeMat implements OpenCvMat {
    public readonly rows = 1;
    public readonly cols = 1;

    public delete(): void {
        // No-op for test.
    }
}

class FakeMatVector {
    public size(): number {
        return 0;
    }

    public get(_index: number): OpenCvMat {
        return new FakeMat();
    }

    public delete(): void {
        // No-op for test.
    }
}

function createImage(
    width = 2,
    height = 2
): OpenCvImageData {
    return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4)
    };
}

function createRuntime(): OpenCvRuntime {
    return {
        Mat: FakeMat,
        MatVector: FakeMatVector,

        findContours: () => {
            // No-op for test.
        },

        RETR_EXTERNAL: 0,
        CHAIN_APPROX_SIMPLE: 1,

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
}

function createRuntimeWithImageLoader(
    matFromImageData: NonNullable<
        OpenCvRuntime["matFromImageData"]
    >
): OpenCvRuntime {
    return {
        ...createRuntime(),
        matFromImageData
    };
}

describe("OpenCvImageLoader", () => {
    it("converts valid image data using OpenCV", () => {
        const mat = new FakeMat();
        const matFromImageData = vi.fn(() => mat);

        const runtime =
            createRuntimeWithImageLoader(
                matFromImageData
            );

        const loader =
            new OpenCvImageLoader(runtime);

        const image = createImage();

        const result =
            loader.fromImageData(image);

        expect(result).toBe(mat);

        expect(
            matFromImageData
        ).toHaveBeenCalledWith(image);
    });

    it("rejects non-positive dimensions", () => {
        const runtime =
            createRuntimeWithImageLoader(
                vi.fn()
            );

        const loader =
            new OpenCvImageLoader(runtime);

        expect(() =>
            loader.fromImageData({
                width: 0,
                height: 2,
                data:
                    new Uint8ClampedArray(16)
            })
        ).toThrow(
            "Image must have positive dimensions."
        );
    });

    it("rejects empty image data", () => {
        const runtime =
            createRuntimeWithImageLoader(
                vi.fn()
            );

        const loader =
            new OpenCvImageLoader(runtime);

        expect(() =>
            loader.fromImageData({
                width: 2,
                height: 2,
                data:
                    new Uint8ClampedArray()
            })
        ).toThrow(
            "Image data must not be empty."
        );
    });

    it("rejects image data with an incorrect length", () => {
        const runtime =
            createRuntimeWithImageLoader(
                vi.fn()
            );

        const loader =
            new OpenCvImageLoader(runtime);

        expect(() =>
            loader.fromImageData({
                width: 2,
                height: 2,
                data:
                    new Uint8ClampedArray(12)
            })
        ).toThrow(
            "Image data length does not match image dimensions."
        );
    });

    it("rejects runtimes without matFromImageData", () => {
        const runtime =
            createRuntime();

        const loader =
            new OpenCvImageLoader(runtime);

        expect(() =>
            loader.fromImageData(
                createImage()
            )
        ).toThrow(
            "OpenCV runtime does not support matFromImageData."
        );
    });
});