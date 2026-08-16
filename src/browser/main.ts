import { FeatureDetectionEngine } from "../api";
import { OpenCvImageLoader } from "../OpenCvImageLoader";
import type { DetectionRequest } from "../api/DetectionRequest";
import { openCvRuntime } from "../infrastructure/opencv/OpenCvJsRuntime";

const fileInput = document.getElementById(
    "image-input"
) as HTMLInputElement | null;

const canvas = document.getElementById(
    "image-canvas"
) as HTMLCanvasElement | null;

const testButton = document.getElementById(
    "test-button"
) as HTMLButtonElement | null;

const output = document.getElementById(
    "output"
) as HTMLPreElement | null;

if (
    fileInput === null ||
    canvas === null ||
    testButton === null ||
    output === null
) {
    throw new Error(
        "Required browser elements were not found."
    );
}

const context = canvas.getContext("2d");

if (context === null) {
    throw new Error(
        "Could not get 2D canvas context."
    );
}

const imageLoader = new OpenCvImageLoader(openCvRuntime);
const engine = new FeatureDetectionEngine(openCvRuntime);

let loadedImage: HTMLImageElement | null = null;

fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];

    if (file === undefined) {
        loadedImage = null;
        output.textContent = "No image selected.";
        testButton.disabled = true;
        return;
    }

    const image = new Image();

    image.onload = () => {
        loadedImage = image;

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.drawImage(image, 0, 0);

        output.textContent =
            `Loaded ${image.naturalWidth} × ${image.naturalHeight} image.`;

        testButton.disabled = false;

        URL.revokeObjectURL(image.src);
    };

    image.onerror = () => {
        loadedImage = null;
        testButton.disabled = true;
        output.textContent =
            "Could not load the selected image.";
        URL.revokeObjectURL(image.src);
    };

    image.src = URL.createObjectURL(file);
});

testButton.addEventListener("click", () => {
    if (loadedImage === null) {
        output.textContent =
            "Choose an image first.";
        return;
    }

    try {
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

        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageMat =
            imageLoader.fromImageData(imageData);

        try {
            const request: DetectionRequest = {
                image: imageMat,
                metresPerPixel: 1
            };

            const result = engine.detect(request);

            output.textContent = JSON.stringify(
                result,
                null,
                2
            );
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
});