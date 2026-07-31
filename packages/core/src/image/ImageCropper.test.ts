import { describe, expect, it } from "vitest";
import { ImageCropper } from "./ImageCropper";
import { ImageData } from "./ImageData";

describe("ImageCropper", () => {
  it("crops an image", () => {
    const image = new ImageData([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    const cropper = new ImageCropper();

    const cropped = cropper.crop(image, {
      x: 1,
      y: 1,
      width: 2,
      height: 2,
    });

    expect(cropped.pixels).toEqual([
      [5, 6],
      [8, 9],
    ]);
  });
});