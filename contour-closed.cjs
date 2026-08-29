const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
    console.log("Loading OpenCV...");
    const cv = await cvModule.loadOpenCV();
    console.log("OpenCV loaded.");

    const maskPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-closed.png";

    console.log("Loading mask:", maskPath);

    const png = PNG.sync.read(
        fs.readFileSync(maskPath)
    );

    console.log("Mask:", {
        width: png.width,
        height: png.height
    });

    const imageData = {
        width: png.width,
        height: png.height,
        data: png.data
    };

    const mask = cv.matFromImageData(imageData);

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
        "Contours found:",
        contours.size()
    );

    for (const epsilon of [2, 3, 4, 5, 7, 10]) {
        let largestIndex = -1;
        let largestPoints = 0;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);

            try {
                const points =
                    contour.data32S
                        ? contour.data32S.length / 2
                        : 0;

                if (points > largestPoints) {
                    largestPoints = points;
                    largestIndex = i;
                }
            } finally {
                contour.delete();
            }
        }

        if (largestIndex < 0) {
            console.log(
                `epsilon ${epsilon}: no contour`
            );
            continue;
        }

        const contour =
            contours.get(largestIndex);

        const approx =
            new cv.Mat();

        try {
            cv.approxPolyDP(
                contour,
                approx,
                epsilon,
                true
            );

            const points =
                approx.data32S
                    ? approx.data32S.length / 2
                    : 0;

            console.log(
                `epsilon ${epsilon}:`,
                {
                    originalPoints:
                        largestPoints,
                    polygonPoints:
                        points
                }
            );
        } finally {
            approx.delete();
            contour.delete();
        }
    }

    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log(
        "Contour experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
