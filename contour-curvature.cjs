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

const raw = contour.data32S;
const points = [];

for (
    let i = 0;
    i + 1 < raw.length;
    i += 2
) {
    points.push({
        x: raw[i],
        y: raw[i + 1]
    });
}

console.log(
    "Largest contour:",
    {
        points: points.length,
        area: largestArea
    }
);

function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    return Math.sqrt(
        dx * dx + dy * dy
    );
}

function angleAt(previous, current, next) {
    const ax = previous.x - current.x;
    const ay = previous.y - current.y;

    const bx = next.x - current.x;
    const by = next.y - current.y;

    const lengthA =
        Math.sqrt(ax * ax + ay * ay);

    const lengthB =
        Math.sqrt(bx * bx + by * by);

    if (
        lengthA === 0 ||
        lengthB === 0
    ) {
        return 0;
    }

    let cosine =
        (ax * bx + ay * by) /
        (lengthA * lengthB);

    cosine =
        Math.max(
            -1,
            Math.min(1, cosine)
        );

    return Math.acos(cosine) *
        180 /
        Math.PI;
}

function curvatureScore(index, window) {
    const count = points.length;

    const previous =
        points[
            (index - window + count) %
            count
        ];

    const current =
        points[index];

    const next =
        points[
            (index + window) %
            count
        ];

    if (
        previous === undefined ||
        current === undefined ||
        next === undefined
    ) {
        return 0;
    }

    const angle =
        angleAt(
            previous,
            current,
            next
        );

    return 180 - angle;
}

function selectCurvaturePoints(
    targetCount,
    window
) {
    const candidates = [];

    for (
        let i = 0;
        i < points.length;
        i += 1
    ) {
        candidates.push({
            index: i,
            score:
                curvatureScore(
                    i,
                    window
                )
        });
    }

    candidates.sort(
        (a, b) =>
            b.score - a.score
    );

    const selected = [];

    const minimumSpacing =
        Math.max(
            1,
            Math.floor(
                points.length /
                (targetCount * 2)
            )
        );

    for (
        const candidate of candidates
    ) {
        if (
            selected.length >=
            targetCount
        ) {
            break;
        }

        let tooClose = false;

        for (
            const chosen of selected
        ) {
            let difference =
                Math.abs(
                    candidate.index -
                    chosen
                );

            difference =
                Math.min(
                    difference,
                    points.length -
                    difference
                );

            if (
                difference <
                minimumSpacing
            ) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            selected.push(
                candidate.index
            );
        }
    }

    selected.sort(
        (a, b) => a - b
    );

    return selected.map(
        (index) => points[index]
    );
}

function evenlySample(
    targetCount
) {
    const result = [];

    const step =
        points.length /
        targetCount;

    for (
        let i = 0;
        i < targetCount;
        i += 1
    ) {
        const index =
            Math.floor(i * step);

        result.push(
            points[index]
        );
    }

    return result;
}

function polygonArea(input) {
    let total = 0;

    for (
        let i = 0;
        i < input.length;
        i += 1
    ) {
        const a = input[i];
        const b =
            input[
                (i + 1) %
                input.length
            ];

        total +=
            a.x * b.y -
            b.x * a.y;
    }

    return Math.abs(total / 2);
}

function bounds(input) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (
        const point of input
    ) {
        minX =
            Math.min(
                minX,
                point.x
            );

        minY =
            Math.min(
                minY,
                point.y
            );

        maxX =
            Math.max(
                maxX,
                point.x
            );

        maxY =
            Math.max(
                maxY,
                point.y
            );
    }

    return {
        minX,
        minY,
        maxX,
        maxY,
        width:
            maxX - minX + 1,
        height:
            maxY - minY + 1
    };
}

console.log("");
console.log(
    "================================"
);
console.log(
    "CURVATURE SELECTION"
);
console.log(
    "================================"
);

for (
    const target of [30, 40, 50, 60, 80]
) {
    for (
        const window of [3, 5, 10, 20]
    ) {
        const selected =
            selectCurvaturePoints(
                target,
                window
            );

        console.log({
            target,
            window,
            points:
                selected.length,
            area:
                Number(
                    polygonArea(
                        selected
                    ).toFixed(1)
                ),
            bounds:
                bounds(selected)
        });
    }

    console.log("");
}

console.log("");
console.log(
    "================================"
);
console.log(
    "EVEN SAMPLING COMPARISON"
);
console.log(
    "================================"
);

for (
    const target of [30, 40, 50, 60, 80]
) {
    const selected =
        evenlySample(target);

    console.log({
        target,
        points:
            selected.length,
        area:
            Number(
                polygonArea(
                    selected
                ).toFixed(1)
            ),
        bounds:
            bounds(selected)
    });
}

console.log("");
console.log(
    "Curvature experiment complete."
);

contour.delete();
hierarchy.delete();
contours.delete();
gray.delete();
mask.delete();

}

main().catch(
function(error) {
console.error(error);
process.exit(1);
}
);
