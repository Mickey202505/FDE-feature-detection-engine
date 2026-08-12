import { describe, expect, it } from "vitest";
import { ImageConverter } from "./ImageConverter";
describe("ImageConverter", () => {
    it("converts an ImageSource into ImageData", () => {
        const converter = new ImageConverter();
        const image = converter.convert({
            data: new Uint8Array([
                1, 2,
                3, 4,
            ]),
            width: 2,
            height: 2,
            mimeType: "image/raw",
        });
        expect(image.width).toBe(2);
        expect(image.height).toBe(2);
        expect(image.pixels).toEqual([
            [1, 2],
            [3, 4],
        ]);
    });
});
//# sourceMappingURL=ImageConverter.test.js.map