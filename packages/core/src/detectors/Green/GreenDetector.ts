import { BoundaryTracer } from "../../geometry/BoundaryTracer";
import { PolygonOptimizer } from "../../geometry/PolygonOptimizer";
import { ImageCropper } from "../../image/ImageCropper";
import { ImageData } from "../../image/ImageData";

export class GreenDetector {
  private readonly cropper = new ImageCropper();
  private readonly tracer = new BoundaryTracer();
  private readonly optimizer = new PolygonOptimizer();

  detect(image: ImageData<number>) {
    const cropped = this.cropper.crop(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    const boundary = this.tracer.trace(cropped.pixels);

    const polygon = this.optimizer.optimize(boundary);

    return [polygon];
  }
}