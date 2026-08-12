import { BoundaryTracer } from "../../geometry/BoundaryTracer";
import { PolygonOptimizer } from "../../geometry/PolygonOptimizer";
import { ImageCropper } from "../../image/ImageCropper";
export class GreenDetector {
    cropper = new ImageCropper();
    tracer = new BoundaryTracer();
    optimizer = new PolygonOptimizer();
    detect(image) {
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
//# sourceMappingURL=GreenDetector.js.map