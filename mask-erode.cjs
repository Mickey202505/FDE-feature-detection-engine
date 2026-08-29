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

    const source =
        cv.matFromImageData({
            width: png.width,
            height: png.height,
            data: png.data
        });

    const gray =
        new cv.Mat();

    cv.cvtColor(
        source,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    source.delete();

    for (
        const kernelSize of [3, 5, 7]
    ) {
        console.log("");
        console.log(
            "================================"
        );
        console.log(
            `ERODE ${kernelSize}x${kernelSize}`
        );
        console.log(
            "================================"
        );

        const kernel =
            cv.Mat.ones(
                kernelSize,
                kernelSize,
                cv.CV_8U
            );

        const eroded =
            new cv.Mat();

        const contours =
            new cv.MatVector();

        const hierarchy =
            new cv.Mat();

        try {
            cv.erode(
                gray,
                eroded,
                kernel
            );

            cv.findContours(
                eroded,
                contours,
                hierarchy,
                cv.RETR_EXTERNAL,
                cv.CHAIN_APPROX_SIMPLE
            );

            console.log(
                "Contours:",
                contours.size()
            );

            if (
                contours.size() === 0
            ) {
                console.log(
                    "No contours found."
                );

                continue;
            }

            let largestIndex = 0;
            let largestArea = 0;

            for (
                let i = 0;
                i < contours.size();
                i += 1
            ) {
                const contour =
                    contours.get(i);

                try {
                    const area =
                        cv.contourArea(
                            contour
                        );

                    if (
                        area >
                        largestArea
                    ) {
                        largestArea =
                            area;

                        largestIndex =
                            i;
                    }
                } finally {
                    contour.delete();
                }
            }

            const contour =
                contours.get(
                    largestIndex
                );

            try {
                console.log(
                    "Largest contour area:",
                    largestArea
                );

                for (
                    const epsilon of [
                        2,
                        3,
                        4,
                        5
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

                        const data =
                            approx.data32S;

                        let minX =
                            Infinity;

                        let minY =
                            Infinity;

                        let maxX =
                            -Infinity;

                        let maxY =
                            -Infinity;

                        for (
                            let i = 0;
                            i + 1 <
                            data.length;
                            i += 2
                        ) {
                            const x =
                                data[i];

                            const y =
                                data[i + 1];

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

                        console.log(
                            `epsilon ${epsilon}:`,
                            {
                                points:
                                    data.length /
                                    2,
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
            hierarchy.delete();
            contours.delete();
            eroded.delete();
            kernel.delete();
        }
    }

    gray.delete();

    console.log("");
    console.log(
        "Mask erosion experiment complete."
    );
}

main().catch(
    (error) => {
        console.error(error);
        process.exit(1);
    }
);