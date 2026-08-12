import { ImageData } from "./ImageData";
export class ImageConverter {
    convert(source) {
        const pixels = [];
        for (let y = 0; y < source.height; y++) {
            const row = [];
            for (let x = 0; x < source.width; x++) {
                row.push(source.data[y * source.width + x] ?? 0);
            }
            pixels.push(row);
        }
        return new ImageData(pixels);
    }
}
//# sourceMappingURL=ImageConverter.js.map