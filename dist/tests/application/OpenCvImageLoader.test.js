"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const OpenCvImageLoader_1 = require("../../src/OpenCvImageLoader");
class FakeMat {
    rows = 1;
    cols = 1;
    delete() {
        // No-op for test.
    }
}
class FakeMatVector {
    size() {
        return 0;
    }
    get(_index) {
        return new FakeMat();
    }
    delete() {
        // No-op for test.
    }
}
function createImage(width = 2, height = 2) {
    return {
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4)
    };
}
function createRuntime() {
    return {
        Mat: FakeMat,
        MatVector: FakeMatVector,
        findContours: () => {
            // No-op for test.
        },
        CV_8U: 0,
        RETR_EXTERNAL: 0,
        CHAIN_APPROX_SIMPLE: 1,
        CHAIN_APPROX_NONE: 2,
        Size: class {
            width;
            height;
            constructor(width, height) {
                this.width = width;
                this.height = height;
            }
        },
        Point: class {
            x;
            y;
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }
        }
    };
}
function createRuntimeWithImageLoader(matFromImageData) {
    return {
        ...createRuntime(),
        matFromImageData
    };
}
(0, vitest_1.describe)("OpenCvImageLoader", () => {
    (0, vitest_1.it)("converts valid image data using OpenCV", () => {
        const mat = new FakeMat();
        const matFromImageData = vitest_1.vi.fn(() => mat);
        const runtime = createRuntimeWithImageLoader(matFromImageData);
        const loader = new OpenCvImageLoader_1.OpenCvImageLoader(runtime);
        const image = createImage();
        const result = loader.fromImageData(image);
        (0, vitest_1.expect)(result).toBe(mat);
        (0, vitest_1.expect)(matFromImageData).toHaveBeenCalledWith(image);
    });
    (0, vitest_1.it)("rejects non-positive dimensions", () => {
        const runtime = createRuntimeWithImageLoader(vitest_1.vi.fn());
        const loader = new OpenCvImageLoader_1.OpenCvImageLoader(runtime);
        (0, vitest_1.expect)(() => loader.fromImageData({
            width: 0,
            height: 2,
            data: new Uint8ClampedArray(16)
        })).toThrow("Image must have positive dimensions.");
    });
    (0, vitest_1.it)("rejects empty image data", () => {
        const runtime = createRuntimeWithImageLoader(vitest_1.vi.fn());
        const loader = new OpenCvImageLoader_1.OpenCvImageLoader(runtime);
        (0, vitest_1.expect)(() => loader.fromImageData({
            width: 2,
            height: 2,
            data: new Uint8ClampedArray()
        })).toThrow("Image data must not be empty.");
    });
    (0, vitest_1.it)("rejects image data with an incorrect length", () => {
        const runtime = createRuntimeWithImageLoader(vitest_1.vi.fn());
        const loader = new OpenCvImageLoader_1.OpenCvImageLoader(runtime);
        (0, vitest_1.expect)(() => loader.fromImageData({
            width: 2,
            height: 2,
            data: new Uint8ClampedArray(12)
        })).toThrow("Image data length does not match image dimensions.");
    });
    (0, vitest_1.it)("rejects runtimes without matFromImageData", () => {
        const runtime = createRuntime();
        const loader = new OpenCvImageLoader_1.OpenCvImageLoader(runtime);
        (0, vitest_1.expect)(() => loader.fromImageData(createImage())).toThrow("OpenCV runtime does not support matFromImageData.");
    });
});
//# sourceMappingURL=OpenCvImageLoader.test.js.map