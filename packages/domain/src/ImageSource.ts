/**
 * Represents an image supplied to the detection engine.
 */
export interface ImageSource {
  /**
   * Raw image data.
   */
  readonly data: Uint8Array;

  /**
   * Image width in pixels.
   */
  readonly width: number;

  /**
   * Image height in pixels.
   */
  readonly height: number;

  /**
   * Image MIME type.
   * Example: "image/png"
   */
  readonly mimeType: string;
}