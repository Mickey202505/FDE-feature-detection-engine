import { ImageData } from "./ImageData";
export class ImageCropper {
    crop(image, rectangle) {
        const pixels = image.pixels
            .slice(rectangle.y, rectangle.y + rectangle.height)
            .map(row => row.slice(rectangle.x, rectangle.x + rectangle.width));
        return new ImageData(pixels);
    }
}
//# sourceMappingURL=ImageCropper.js.map