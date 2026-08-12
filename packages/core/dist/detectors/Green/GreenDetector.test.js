import { describe, expect, it } from "vitest";
import { GreenDetector } from "./GreenDetector";
import { ImageData } from "../../image/ImageData";
describe("GreenDetector", () => {
    it("returns a detected polygon", () => {
        const image = new ImageData([
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ]);
        const detector = new GreenDetector();
        const result = detector.detect(image);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual([
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 2, y: 2 },
            { x: 1, y: 2 },
        ]);
    });
});
//# sourceMappingURL=GreenDetector.test.js.map