import { CropRectangle } from "./CropRectangle";
import { ImageData } from "./ImageData";

export class ImageCropper {
  crop<T>(
    image: ImageData<T>,
    rectangle: CropRectangle,
  ): ImageData<T> {
    const pixels = image.pixels
      .slice(rectangle.y, rectangle.y + rectangle.height)
      .map(row =>
        row.slice(rectangle.x, rectangle.x + rectangle.width),
      );

    return new ImageData(pixels);
  }
}