import { describe, expect, it } from "vitest";
import { OpenCvAdapterImpl } from "./OpenCvAdapterImpl";
import type {
    OpenCvContourCollection,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

describe("OpenCvAdapterImpl", () => {
    it("converts an OpenCV contour into points", () => {
        const contourMat = {
            rows: 1,
            cols: 4,
            data32S: new Int32Array([10, 20, 30, 40]),
            delete: () => undefined
        } as OpenCvMat & { data32S: Int32Array };

        const contours: OpenCvContourCollection = {
            size: () => 1,
            get: () => contourMat,
            delete: () => undefined
        };

        const runtime: OpenCvRuntime = {
            Mat: class {
                rows = 0;
                cols = 0;
                delete() {}
            },
            MatVector: class {
                size() {
                    return 1;
                }

                get() {
                    return contourMat;
                }

                delete() {}
            },
            findContours: (
                _image,
                _contours,
                _hierarchy,
                _mode,
                _method
            ) => undefined,
            RETR_EXTERNAL: 0,
            CHAIN_APPROX_SIMPLE: 2
        };

        void contours;

        const adapter = new OpenCvAdapterImpl(runtime);

        const image: OpenCvMat = {
            rows: 100,
            cols: 100,
            delete: () => undefined
        };

        const result = adapter.findContours(image);

        expect(result).toHaveLength(1);
        expect(result[0]?.points).toEqual([
            { x: 10, y: 20 },
            { x: 30, y: 40 }
        ]);
    });
});