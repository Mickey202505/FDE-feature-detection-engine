export class ImageData<T = number> {
  constructor(
    public readonly pixels: T[][],
  ) {}

  get width(): number {
    return this.pixels[0]?.length ?? 0;
  }

  get height(): number {
    return this.pixels.length;
  }
}