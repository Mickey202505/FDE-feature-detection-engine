import { describe, expect, it } from "vitest";
import type { OpenCvAdapter } from "./OpenCvAdapter";
import type { OpenCvMat } from "./OpenCvTypes";

describe("OpenCvAdapter", () => {
    it("defines a contour detection boundary", () => {
        const adapter: OpenCvAdapter = {
            findContours: () => []
        };

        const image: OpenCvMat = {
            rows: 100,
            cols: 100,
            delete: () => undefined
        };

        expect(adapter.findContours(image)).toEqual([]);
    });
});