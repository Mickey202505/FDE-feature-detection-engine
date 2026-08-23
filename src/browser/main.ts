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
        currentSeed = null;

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

let currentSeed: { x: number; y: number } | null = null;

function redrawCanvas() {
    if (loadedImage === null) return;
    
    canvas.width = loadedImage.naturalWidth;
    canvas.height = loadedImage.naturalHeight;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(loadedImage, 0, 0);

    // If the user has selected a seed, draw a blue dot
    if (currentSeed) {
        context.fillStyle = "blue";
        context.beginPath();
        context.arc(currentSeed.x, currentSeed.y, 5, 0, 2 * Math.PI);
        context.fill();
    }
}

function runDetection() {
    if (loadedImage === null) {
        output.textContent = "Choose an image first.";
        return;
    }

    if (currentSeed === null) {
        output.textContent = "Please click on the image to set a seed point before testing.";
        return;
    }

    try {
        // Redraw JUST the raw image so OpenCV gets a clean picture without the blue dot
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(loadedImage, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const imageMat = imageLoader.fromImageData(imageData);

        // Now that we have the raw image data for OpenCV, we can visually redraw the blue dot
        if (currentSeed) {
            context.fillStyle = "blue";
            context.beginPath();
            context.arc(currentSeed.x, currentSeed.y, 5, 0, 2 * Math.PI);
            context.fill();
        }

        try {
            const request: DetectionRequest = {
                image: imageMat,
                metresPerPixel: 1,
                seed: currentSeed
            };

            const result = engine.detect(request);

            output.textContent = JSON.stringify(result, null, 2);

            // Draw the detected polygons directly onto the canvas
            context.strokeStyle = "red";
            context.lineWidth = 3;

            for (const feature of result.features) {
                const points = feature.polygon.points;
                
                if (points.length === 0) continue;

                context.beginPath();
                context.moveTo(points[0].x, points[0].y);

                for (let i = 1; i < points.length; i += 1) {
                    context.lineTo(points[i].x, points[i].y);
                }

                context.closePath();
                context.stroke();
            }
        } finally {
            imageMat.delete();
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.textContent = `Detection failed:\n${message}`;
    }
}

testButton.addEventListener("click", runDetection);

canvas.addEventListener("click", (event) => {
    if (loadedImage === null) return;

    // Calculate actual pixel coordinates on the canvas regardless of CSS scaling
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Save the seed point and visually update the canvas
    currentSeed = { x: clickX, y: clickY };
    redrawCanvas();
    
    output.textContent = `Seed point selected at X: ${Math.round(clickX)}, Y: ${Math.round(clickY)}. Now click "Test" to run detection.`;
});