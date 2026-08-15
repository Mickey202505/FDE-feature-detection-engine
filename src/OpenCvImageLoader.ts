import type {
    OpenCvMat,
    OpenCvRuntime
} from "./application/opencv/OpenCvTypes";

export interface OpenCvImageSource {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
}

export class OpenCvImageLoader {
    private readonly cv: OpenCvRuntime;

    public constructor(cv: OpenCvRuntime) {
        this.cv = cv;
    }

    public fromImageData(
        image: OpenCvImageSource
    ): OpenCvMat {
        if (image.width <= 0 || image.height <= 0) {
            throw new Error(
                "Image must have positive dimensions."
            );
        }

        const expectedLength =
            image.width * image.height * 4;

        if (image.data.length === 0) {
            throw new Error(
                "Image data must not be empty."
            );
        }

        if (image.data.length !== expectedLength) {
            throw new Error(
                "Image data length does not match image dimensions."
            );
        }

        if (this.cv.matFromImageData === undefined) {
            throw new Error(
                "OpenCV runtime does not support matFromImageData."
            );
        }

        return this.cv.matFromImageData({
            width: image.width,
            height: image.height,
            data: image.data
        });
    }
}
