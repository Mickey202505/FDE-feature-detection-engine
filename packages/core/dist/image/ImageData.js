export class ImageData {
    pixels;
    constructor(pixels) {
        this.pixels = pixels;
    }
    get width() {
        return this.pixels[0]?.length ?? 0;
    }
    get height() {
        return this.pixels.length;
    }
}
//# sourceMappingURL=ImageData.js.map