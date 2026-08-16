import cv from "opencv.js";

console.log("OpenCV loaded");

const width = 100;
const height = 100;

const data = new Uint8ClampedArray(
    width * height * 4
);

// White rectangle on a black background.
for (let y = 20; y < 80; y += 1) {
    for (let x = 20; x < 80; x += 1) {
        const index = (y * width + x) * 4;

        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
        data[index + 3] = 255;
    }
}

const image = {
    width,
    height,
    data
};

const mat = cv.matFromImageData(image);
const contours = new cv.MatVector();
const hierarchy = new cv.Mat();

try {
    console.log(
        `Image loaded: ${mat.rows}x${mat.cols}`
    );

    cv.findContours(
        mat,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );

    console.log(
        `Contours found: ${contours.size()}`
    );

    if (contours.size() === 0) {
        throw new Error(
            "Expected at least one contour."
        );
    }

    const contour = contours.get(0);

    try {
        console.log(
            `First contour: ${contour.rows} rows x ${contour.cols} cols`
        );

        console.log("REAL OPENCV TEST PASSED");
    } finally {
        contour.delete();
    }
} finally {
    hierarchy.delete();
    contours.delete();
    mat.delete();
}