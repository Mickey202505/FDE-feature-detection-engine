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

    const contours =
        new cv.MatVector();

    const hierarchy =
        new cv.Mat();

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

    let largestIndex = -1;
    let largestArea = 0;

    for (
        let i = 0;
        i < contours.size();
        i++
    ) {
        const contour =
            contours.get(i);

        try {
            const area =
                Math.abs(
                    cv.contourArea(contour)
                );

            if (area > largestArea) {
                largestArea = area;
                largestIndex = i;
            }
        } finally {
            contour.delete();
        }
    }

    if (largestIndex < 0) {
        throw new Error(
            "No contour found."
        );
    }

    const contour =
        contours.get(largestIndex);

    try {
        const data =
            contour.data32S;

        const points = [];

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

        /*
         * ---------------------------------------------------------
         * STEP 1
         * Measure the distance between consecutive contour points.
         * ---------------------------------------------------------
         */

        let totalDistance = 0;
        let minDistance = Infinity;
        let maxDistance = 0;

        for (
            let i = 0;
            i < points.length;
            i++
        ) {
            const a =
                points[i];

            const b =
                points[
                    (i + 1) %
                    points.length
                ];

            const dx =
                b.x - a.x;

            const dy =
                b.y - a.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            totalDistance += distance;

            minDistance =
                Math.min(
                    minDistance,
                    distance
                );

            maxDistance =
                Math.max(
                    maxDistance,
                    distance
                );
        }

        console.log("");
        console.log(
            "BOUNDARY DISTANCE"
        );

        console.log({
            totalDistance,
            averageDistance:
                totalDistance /
                points.length,
            minDistance,
            maxDistance
        });

        /*
         * ---------------------------------------------------------
         * STEP 2
         * Measure how sharply the boundary turns.
         * ---------------------------------------------------------
         */

        const angleChanges = [];

        for (
            let i = 0;
            i < points.length;
            i++
        ) {
            const previous =
                points[
                    (i -
                        1 +
                        points.length) %
                        points.length
                ];

            const current =
                points[i];

            const next =
                points[
                    (i + 1) %
                        points.length
                ];

            const v1x =
                current.x -
                previous.x;

            const v1y =
                current.y -
                previous.y;

            const v2x =
                next.x -
                current.x;

            const v2y =
                next.y -
                current.y;

            const len1 =
                Math.sqrt(
                    v1x * v1x +
                    v1y * v1y
                );

            const len2 =
                Math.sqrt(
                    v2x * v2x +
                    v2y * v2y
                );

            if (
                len1 === 0 ||
                len2 === 0
            ) {
                continue;
            }

            let cosine =
                (v1x * v2x +
                    v1y * v2y) /
                (len1 * len2);

            cosine =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        cosine
                    )
                );

            const angle =
                Math.acos(
                    cosine
                ) *
                (180 / Math.PI);

            angleChanges.push({
                index: i,
                x: current.x,
                y: current.y,
                angle
            });
        }

        angleChanges.sort(
            (a, b) =>
                b.angle - a.angle
        );

        console.log("");
        console.log(
            "SHARPEST BOUNDARY TURNS"
        );

        console.log(
            angleChanges
                .slice(0, 30)
        );

        /*
         * ---------------------------------------------------------
         * STEP 3
         * Try a custom distance-based simplification.
         *
         * We keep a contour point when it is sufficiently far
         * from the previous selected point.
         * ---------------------------------------------------------
         */

        for (
            const spacing of [
                5,
                10,
                15,
                20,
                25,
                30,
                40
            ]
        ) {
            const selected = [];

            let last =
                points[0];

            selected.push(last);

            for (
                let i = 1;
                i < points.length;
                i++
            ) {
                const current =
                    points[i];

                const dx =
                    current.x -
                    last.x;

                const dy =
                    current.y -
                    last.y;

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy
                    );

                if (
                    distance >=
                    spacing
                ) {
                    selected.push(
                        current
                    );

                    last =
                        current;
                }
            }

            console.log(
                `spacing ${spacing}:`,
                {
                    points:
                        selected.length
                }
            );
        }

        /*
         * ---------------------------------------------------------
         * STEP 4
         * Compare the custom boundary against approxPolyDP.
         * ---------------------------------------------------------
         */

        console.log("");
        console.log(
            "APPROXIMATION COMPARISON"
        );

        for (
            const epsilon of [
                1,
                2,
                3,
                4,
                5,
                7,
                10,
                15,
                20
            ]
        ) {
            const approx =
                new cv.Mat();

            try {
                cv.approxPolyDP(
                    contour,
                    approx,
                    epsilon,
                    true
                );

                const approxData =
                    approx.data32S;

                console.log(
                    `epsilon ${epsilon}:`,
                    {
                        points:
                            approxData.length /
                            2
                    }
                );
            } finally {
                approx.delete();
            }
        }

        /*
         * ---------------------------------------------------------
         * STEP 5
         * Calculate the bounding box of the original contour.
         * ---------------------------------------------------------
         */

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (
            const point of points
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

        console.log("");
        console.log(
            "ORIGINAL BOUNDS"
        );

        console.log({
            minX,
            minY,
            maxX,
            maxY,
            width:
                maxX - minX + 1,
            height:
                maxY - minY + 1
        });
    } finally {
        contour.delete();
    }

    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log("");
    console.log(
        "Boundary analysis complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
