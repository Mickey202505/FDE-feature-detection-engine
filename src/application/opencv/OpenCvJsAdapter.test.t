import { describe, expect, it } from "vitest";
import { OpenCvJsAdapter } from "../../../src/application/opencv/OpenCvJsAdapter";

describe("OpenCvJsAdapter", () => {
    it("can be created", () => {
        const adapter = new OpenCvJsAdapter();

        expect(adapter).toBeDefined();
    });

    it("implements the contour boundary", () => {
        const adapter = new OpenCvJsAdapter();

        expect(adapter.findContours({})).toEqual([]);
    });
});