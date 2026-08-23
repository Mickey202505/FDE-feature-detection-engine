import { describe, expect, it } from "vitest";
import { OpenCvJsAdapter } from "./OpenCvJsAdapter";
import type {
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

describe("OpenCvJsAdapter", () => {
    it("converts an OpenCV contour into points", () => {
        const contourMat = createContour([10, 20, 30, 40]);

        const runtime = createRuntime([contourMat]);
        const adapter = new OpenCvJsAdapter(runtime);

        const image = createImage();

        const result = adapter.findContours(image);

        expect(result).toHaveLength(1);
        expect(result[0]?.points).toEqual([
            { x: 10, y: 20 },
            { x: 30, y: 40 }
        ]);
    });

    it("converts multiple contours", () => {
        const firstContour = createContour([10, 20, 30, 40]);
        const secondContour = createContour([50, 60, 70, 80]);

        const runtime = createRuntime([
            firstContour,
            secondContour
        ]);

        const adapter = new OpenCvJsAdapter(runtime);

        const result = adapter.findContours(createImage());

        expect(result).toEqual([
            {
                points: [
                    { x: 10, y: 20 },
                    { x: 30, y: 40 }
                ]
            },
            {
                points: [
                    { x: 50, y: 60 },
                    { x: 70, y: 80 }
                ]
            }
        ]);
    });

    it("returns no contours when OpenCV finds none", () => {
        const runtime = createRuntime([]);
        const adapter = new OpenCvJsAdapter(runtime);

        const result = adapter.findContours(createImage());

        expect(result).toEqual([]);
    });

    it("returns an empty point list when contour data is unavailable", () => {
        const contour: OpenCvMat = {
            rows: 0,
            cols: 0,
            delete: () => undefined
        };

        const runtime = createRuntime([contour]);
        const adapter = new OpenCvJsAdapter(runtime);

        const result = adapter.findContours(createImage());

        expect(result).toEqual([
            {
                points: []
            }
        ]);
    });

    it("passes the expected OpenCV contour options", () => {
        let receivedMode: number | undefined;
        let receivedMethod: number | undefined;

        const contour = createContour([10, 20]);

        const runtime = createRuntime([contour], {
            onFindContours: (
                _image,
                _contours,
                _hierarchy,
                mode,
                method
            ) => {
                receivedMode = mode;
                receivedMethod = method;
            }
        });

        const adapter = new OpenCvJsAdapter(runtime);

        adapter.findContours(createImage());

        expect(receivedMode).toBe(runtime.RETR_EXTERNAL);
        expect(receivedMethod).toBe(runtime.CHAIN_APPROX_SIMPLE);
    });

    it("releases OpenCV resources", () => {
        let hierarchyDeleted = false;
        let contoursDeleted = false;
        let contourDeleted = false;

        const runtime: OpenCvRuntime = {
            Mat,
            MatVector,
            findContours: (
                _image: OpenCvMat,
                _contours: OpenCvContourCollection,
                _hierarchy: OpenCvMat,
                _mode: number,
                _method: number
            ) => undefined,
            RETR_EXTERNAL: 0,
            CHAIN_APPROX_SIMPLE: 0,

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

        const adapter = new OpenCvJsAdapter(runtime);

        adapter.findContours(createImage());

        expect(contourDeleted).toBe(true);
        expect(contoursDeleted).toBe(true);
        expect(hierarchyDeleted).toBe(true);
    });

    it("rejects an empty image", () => {
        const runtime = createRuntime([]);
        const adapter = new OpenCvJsAdapter(runtime);

        const image: OpenCvMat = {
            rows: 0,
            cols: 0,
            delete: () => undefined
        };

        expect(() => adapter.findContours(image)).toThrow(
            "OpenCV image must have positive dimensions."
        );
    });
});

function createContour(
    values: number[]
): OpenCvMat {
    return {
        rows: 1,
        cols: values.length,
        data32S: new Int32Array(values),
        delete: () => undefined
    };
}

function createImage(): OpenCvMat {
    return {
        rows: 100,
        cols: 100,
        delete: () => undefined
    };
}

function createRuntime(
    contours: OpenCvMat[],
    options: {
        onFindContours?: OpenCvRuntime["findContours"];
    } = {}
): OpenCvRuntime {
    return {
        Mat: class {
            rows = 0;
            cols = 0;

            delete() {}
        },
        MatVector: class {
            size() {
                return contours.length;
            }

            get(index: number) {
                return contours[index] as OpenCvMat;
            }

            delete() {}
        },
        findContours: options.onFindContours ?? (
            (
                _image,
                _contours,
                _hierarchy,
                _mode,
                _method
            ) => undefined
        ),
        RETR_EXTERNAL: 0,
        CHAIN_APPROX_SIMPLE: 2
    };
}