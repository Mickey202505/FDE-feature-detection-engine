const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
    console.log("Loading OpenCV...");

    const cv =
        await cvModule.loadOpenCV();

    console.log("OpenCV loaded.");

    const maskPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

    console.log(
        "Loading mask:",
        maskPath
    );

    const png =
        PNG.sync.read(
            fs.readFileSync(maskPath)
        );

    console.log("Mask:", {
        width: png.width,
        height: png.height
    });

    const mask =
        cv.matFromImageData({
            width: png.width,
            height: png.height,
            data: png.data
        });

    const gray =
        new cv.Mat();

    cv.cvtColor(
        mask,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    const contours =
        new cv.MatVector();

    const hierarchy =
        new cv.Mat();

    const kernelSizes = [
        3,
        5,
        7
    ];

    const epsilons = [
        2,
        3,
        4
    ];

    for (
        const kernelSize of
            kernelSizes
    ) {
        console.log("");
        console.log(
            "================================"
        );
        console.log(
            `GAUSSIAN ${kernelSize}x${kernelSize}`
        );
        console.log(
            "================================"
        );

        const blurred =
            new cv.Mat();

        const thresholded =
            new cv.Mat();

        try {
            cv.GaussianBlur(
                gray,
                blurred,
                new cv.Size(
                    kernelSize,
                    kernelSize
                ),
                0,
                0,
                cv.BORDER_DEFAULT
            );

            cv.threshold(
                blurred,
                thresholded,
                127,
                255,
                cv.THRESH_BINARY
            );

            contours.delete();
            hierarchy.delete();

            /*
             * Create fresh containers for each
             * Gaussian experiment.
             */
            const experimentContours =
                new cv.MatVector();

            const experimentHierarchy =
                new cv.Mat();

            try {
                cv.findContours(
                    thresholded,
                    experimentContours,
                    experimentHierarchy,
                    cv.RETR_EXTERNAL,
                    cv.CHAIN_APPROX_NONE
                );

                console.log(
                    "Contours:",
                    experimentContours.size()
                );

                if (
                    experimentContours.size() ===
                    0
                ) {
                    continue;
                }

                let largestIndex = 0;
                let largestPoints = 0;

                for (
                    let i = 0;
                    i <
                    experimentContours.size();
                    i += 1
                ) {
                    const contour =
                        experimentContours.get(i);

                    try {
                        const points =
                            contour.data32S
                                ? contour.data32S.length / 2
                                : 0;

                        if (
                            points >
                            largestPoints
                        ) {
                            largestPoints =
                                points;

                            largestIndex =
                                i;
                        }
                    } finally {
                        contour.delete();
                    }
                }

                const contour =
                    experimentContours.get(
                        largestIndex
                    );

                try {
                    for (
                        const epsilon of
                            epsilons
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

                            const data =
                                approx.data32S;

                            const points =
                                data
                                    ? data.length / 2
                                    : 0;

                            let minX =
                                Infinity;

                            let minY =
                                Infinity;

                            let maxX =
                                -Infinity;

                            let maxY =
                                -Infinity;

                            if (
                                data !==
                                undefined
                            ) {
                                for (
                                    let i = 0;
                                    i + 1 <
                                    data.length;
                                    i += 2
                                ) {
                                    const x =
                                        data[i];

                                    const y =
                                        data[
                                            i + 1
                                        ];

                                    minX =
                                        Math.min(
                                            minX,
                                            x
                                        );

                                    minY =
                                        Math.min(
                                            minY,
                                            y
                                        );

                                    maxX =
                                        Math.max(
                                            maxX,
                                            x
                                        );

                                    maxY =
                                        Math.max(
                                            maxY,
                                            y
                                        );
                                }
                            }

                            console.log(
                                `epsilon ${epsilon}:`,
                                {
                                    originalPoints:
                                        largestPoints,
                                    polygonPoints:
                                        points,
                                    minX,
                                    minY,
                                    maxX,
                                    maxY,
                                    width:
                                        maxX -
                                        minX +
                                        1,
                                    height:
                                        maxY -
                                        minY +
                                        1
                                }
                            );
                        } finally {
                            approx.delete();
                        }
                    }
                } finally {
                    contour.delete();
                }
            } finally {
                experimentHierarchy.delete();
                experimentContours.delete();
            }
        } finally {
            thresholded.delete();
            blurred.delete();
        }
    }

    gray.delete();
    mask.delete();

    console.log("");
    console.log(
        "Gaussian contour experiment complete."
    );
}

main().catch(
    error => {
        console.error(error);
        process.exit(1);
    }
);