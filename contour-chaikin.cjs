const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
console.log("Loading OpenCV...");
const cv = await cvModule.loadOpenCV();
console.log("OpenCV loaded.");


const maskPath =
    "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

console.log("Loading mask:", maskPath);

const png = PNG.sync.read(
    fs.readFileSync(maskPath)
);

console.log("Mask:", {
    width: png.width,
    height: png.height
});

const mask = cv.matFromImageData({
    width: png.width,
    height: png.height,
    data: png.data
});

const gray = new cv.Mat();

cv.cvtColor(
    mask,
    gray,
    cv.COLOR_RGBA2GRAY
);

const contours = new cv.MatVector();
const hierarchy = new cv.Mat();

cv.findContours(
    gray,
    contours,
    hierarchy,
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_NONE
);

console.log(
    "Contours:",
    contours.size()
);

if (contours.size() === 0) {
    console.log("No contours found.");
    return;
}

let largestIndex = 0;
let largestArea = 0;

for (
    let i = 0;
    i < contours.size();
    i += 1
) {
    const contour = contours.get(i);

    try {
        const area = cv.contourArea(contour);

        if (area > largestArea) {
            largestArea = area;
            largestIndex = i;
        }
    } finally {
        contour.delete();
    }
}

const contour =
    contours.get(largestIndex);

const data = contour.data32S;
let points = [];

for (
    let i = 0;
    i + 1 < data.length;
    i += 2
) {
    points.push({
        x: data[i],
        y: data[i + 1]
    });
}

console.log(
    "Largest contour:",
    {
        points: points.length,
        area: largestArea
    }
);

function chaikin(input) {
    const output = [];
    const count = input.length;

    for (
        let i = 0;
        i < count;
        i += 1
    ) {
        const p0 = input[i];
        const p1 =
            input[(i + 1) % count];

        output.push({
            x: p0.x * 0.75 + p1.x * 0.25,
            y: p0.y * 0.75 + p1.y * 0.25
        });

        output.push({
            x: p0.x * 0.25 + p1.x * 0.75,
            y: p0.y * 0.25 + p1.y * 0.75
        });
    }

    return output;
}

function getBounds(input) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of input) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return {
        minX: Number(minX.toFixed(2)),
        minY: Number(minY.toFixed(2)),
        maxX: Number(maxX.toFixed(2)),
        maxY: Number(maxY.toFixed(2)),
        width: Number((maxX - minX + 1).toFixed(2)),
        height: Number((maxY - minY + 1).toFixed(2))
    };
}

function getArea(input) {
    let total = 0;
    const count = input.length;

    for (
        let i = 0;
        i < count;
        i += 1
    ) {
        const p1 = input[i];
        const p2 =
            input[(i + 1) % count];

        total +=
            p1.x * p2.y -
            p2.x * p1.y;
    }

    return Math.abs(total / 2);
}

console.log("");
console.log("================================");
console.log("CHAIKIN SMOOTHING");
console.log("================================");

for (
    const iterations of [1, 2, 3, 4]
) {
    let smoothed = points;

    for (
        let i = 0;
        i < iterations;
        i += 1
    ) {
        smoothed = chaikin(smoothed);
    }

    console.log("");
    console.log(
        "Iterations:",
        iterations
    );

    console.log({
        points: smoothed.length,
        area: Number(
            getArea(smoothed).toFixed(2)
        ),
        bounds: getBounds(smoothed)
    });
}

console.log("");
console.log("================================");
console.log("CHAIKIN + APPROXIMATION");
console.log("================================");

for (
    const iterations of [1, 2, 3]
) {
    let smoothed = points;

    for (
        let i = 0;
        i < iterations;
        i += 1
    ) {
        smoothed = chaikin(smoothed);
    }

    const maximumPoints = 500;
    const sampled = [];

    const step =
        smoothed.length / maximumPoints;

    for (
        let i = 0;
        i < Math.min(
            maximumPoints,
            smoothed.length
        );
        i += 1
    ) {
        sampled.push(
            smoothed[
                Math.floor(i * step)
            ]
        );
    }

    const mat =
        new cv.Mat(
            sampled.length,
            1,
            cv.CV_32SC2
        );

    const matData = mat.data32S;

    for (
        let i = 0;
        i < sampled.length;
        i += 1
    ) {
        matData[i * 2] =
            Math.round(sampled[i].x);

        matData[i * 2 + 1] =
            Math.round(sampled[i].y);
    }

    for (
        const epsilon of [1, 2, 3, 4, 5]
    ) {
        const approx = new cv.Mat();

        try {
            cv.approxPolyDP(
                mat,
                approx,
                epsilon,
                true
            );

            console.log({
                iterations: iterations,
                epsilon: epsilon,
                points:
                    approx.data32S.length / 2
            });
        } finally {
            approx.delete();
        }
    }

    mat.delete();
}

console.log("");
console.log(
    "Chaikin experiment complete."
);

contour.delete();
hierarchy.delete();
contours.delete();
gray.delete();
mask.delete();


}

main().catch(function(error) {
console.error(error);
process.exit(1);
});
