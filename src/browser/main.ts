import { FeatureDetectionEngine } from "../api";
import { OpenCvImageLoader } from "../OpenCvImageLoader";
import type { DetectionRequest } from "../api/DetectionRequest";
import { openCvRuntime } from "../infrastructure/opencv/OpenCvJsRuntime";

const fileInputElement = document.getElementById(
    "image-input"
);

const canvasElement = document.getElementById(
    "image-canvas"
);

const testButtonElement = document.getElementById(
    "test-button"
);

const outputElement = document.getElementById(
    "output"
);

if (
    !(fileInputElement instanceof HTMLInputElement) ||
    !(canvasElement instanceof HTMLCanvasElement) ||
    !(testButtonElement instanceof HTMLButtonElement) ||
    !(outputElement instanceof HTMLPreElement)
) {
    throw new Error(
        "Required browser elements were not found."
    );
}

const fileInput = fileInputElement;
const canvas = canvasElement;
const testButton = testButtonElement;
const output = outputElement;

const context = canvas.getContext("2d");

if (context === null) {
    throw new Error(
        "Could not get 2D canvas context."
    );
}

const imageLoader = new OpenCvImageLoader(
    openCvRuntime
);

const engine = new FeatureDetectionEngine(
    openCvRuntime
);

let loadedImage: HTMLImageElement | null = null;

let currentSeed: {
    x: number;
    y: number;
} | null = null;

fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    if (file === undefined) {
        loadedImage = null;
        currentSeed = null;

        output.textContent = "No image selected.";
        testButton.disabled = true;

        return;
    }

    const image = new Image();

    image.onload = () => {
        loadedImage = image;
        currentSeed = null;

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.drawImage(
            image,
            0,
            0
        );

        output.textContent =
            `Loaded ${image.naturalWidth} × ${image.naturalHeight} image.`;

        testButton.disabled = false;

        URL.revokeObjectURL(image.src);
    };

    image.onerror = () => {
        loadedImage = null;
        currentSeed = null;

        testButton.disabled = true;

        output.textContent =
            "Could not load the selected image.";

        URL.revokeObjectURL(image.src);
    };

    image.src = URL.createObjectURL(file);
});

function redrawCanvas(): void {
    if (loadedImage === null) {
        return;
    }

    canvas.width = loadedImage.naturalWidth;
    canvas.height = loadedImage.naturalHeight;

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    context.drawImage(
        loadedImage,
        0,
        0
    );

    if (currentSeed !== null) {
        context.fillStyle = "blue";
        context.beginPath();

        context.arc(
            currentSeed.x,
            currentSeed.y,
            5,
            0,
            2 * Math.PI
        );

        context.fill();
    }
}

function runDetection(): void {
    if (loadedImage === null) {
        output.textContent =
            "Choose an image first.";

        return;
    }

    if (currentSeed === null) {
        output.textContent =
            "Please click on the image to set a seed point before testing.";

        return;
    }

    try {
        /*
         * Draw only the original image before sending
         * the pixels to OpenCV. This prevents the blue
         * seed marker from becoming part of the image
         * being analysed.
         */
        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.drawImage(
            loadedImage,
            0,
            0
        );

        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageMat =
            imageLoader.fromImageData(imageData);

        /*
         * Restore the seed marker visually after
         * obtaining the clean image data.
         */
        context.fillStyle = "blue";
        context.beginPath();

        context.arc(
            currentSeed.x,
            currentSeed.y,
            5,
            0,
            2 * Math.PI
        );

        context.fill();

        try {
            const request: DetectionRequest = {
                image: imageMat,
                metresPerPixel: 1,
                seed: currentSeed
            };

            const result = engine.detect(request);

            output.textContent =
                JSON.stringify(
                    result,
                    null,
                    2
                );

            /*
             * Draw detected polygons.
             */
            context.strokeStyle = "red";
            context.lineWidth = 3;

            for (const feature of result.features) {
                const points =
                    feature.polygon.points;

                if (points.length === 0) {
                    continue;
                }

                const firstPoint = points[0];

                if (firstPoint === undefined) {
                    continue;
                }

                context.beginPath();

                context.moveTo(
                    firstPoint.x,
                    firstPoint.y
                );

                for (
                    let i = 1;
                    i < points.length;
                    i += 1
                ) {
                    const point = points[i];

                    if (point === undefined) {
                        continue;
                    }

                    context.lineTo(
                        point.x,
                        point.y
                    );
                }

                context.closePath();
                context.stroke();
            }
        } finally {
            imageMat.delete();
        }
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : String(error);

        output.textContent =
            `Detection failed:\n${message}`;
    }
}

testButton.addEventListener(
    "click",
    runDetection
);

canvas.addEventListener(
    "click",
    (event) => {
        if (loadedImage === null) {
            return;
        }

        /*
         * Calculate actual image pixel coordinates,
         * taking CSS scaling into account.
         */
        const rect =
            canvas.getBoundingClientRect();

        const scaleX =
            canvas.width / rect.width;

        const scaleY =
            canvas.height / rect.height;

        const clickX =
            (event.clientX - rect.left) *
            scaleX;

        const clickY =
            (event.clientY - rect.top) *
            scaleY;

        currentSeed = {
            x: clickX,
            y: clickY
        };

        redrawCanvas();

        output.textContent =
            `Seed point selected at X: ${Math.round(clickX)}, Y: ${Math.round(clickY)}. Now click "Test" to run detection.`;
    }
);