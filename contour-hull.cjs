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
        cv.CHAIN_APPROX_SIMPLE
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

            console.log(
                `Contour ${i}: area=${area}`
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
        console.log(
            "Largest contour:",
            {
                index: largestIndex,
                area: largestArea
            }
        );

        const hull =
            new cv.Mat();

        try {
            cv.convexHull(
                contour,
                hull,
                false,
                true
            );

            const data =
                hull.data32S;

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for (
                let i = 0;
                i + 1 < data.length;
                i += 2
            ) {
                const x = data[i];
                const y = data[i + 1];

                minX = Math.min(
                    minX,
                    x
                );

                minY = Math.min(
                    minY,
                    y
                );

                maxX = Math.max(
                    maxX,
                    x
                );

                maxY = Math.max(
                    maxY,
                    y
                );
            }

            console.log(
                "CONVEX HULL:",
                {
                    points:
                        data.length / 2,
                    minX,
                    minY,
                    maxX,
                    maxY,
                    width:
                        maxX - minX + 1,
                    height:
                        maxY - minY + 1
                }
            );

            for (
                const epsilon of [
                    1,
                    2,
                    3,
                    4,
                    5,
                    7,
                    10
                ]
            ) {
                const approx =
                    new cv.Mat();

                try {
                    cv.approxPolyDP(
                        hull,
                        approx,
                        epsilon,
                        true
                    );

                    const approxData =
                        approx.data32S;

                    let aMinX =
                        Infinity;

                    let aMinY =
                        Infinity;

                    let aMaxX =
                        -Infinity;

                    let aMaxY =
                        -Infinity;

                    for (
                        let i = 0;
                        i + 1 <
                        approxData.length;
                        i += 2
                    ) {
                        const x =
                            approxData[i];

                        const y =
                            approxData[i + 1];

                        aMinX =
                            Math.min(
                                aMinX,
                                x
                            );

                        aMinY =
                            Math.min(
                                aMinY,
                                y
                            );

                        aMaxX =
                            Math.max(
                                aMaxX,
                                x
                            );

                        aMaxY =
                            Math.max(
                                aMaxY,
                                y
                            );
                    }

                    console.log(
                        `epsilon ${epsilon}:`,
                        {
                            points:
                                approxData.length /
                                2,
                            minX:
                                aMinX,
                            minY:
                                aMinY,
                            maxX:
                                aMaxX,
                            maxY:
                                aMaxY,
                            width:
                                aMaxX -
                                aMinX +
                                1,
                            height:
                                aMaxY -
                                aMinY +
                                1
                        }
                    );
                } finally {
                    approx.delete();
                }
            }
        } finally {
            hull.delete();
        }
    } finally {
        contour.delete();
    }

    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log(
        "Convex hull experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
