const fs = require("fs");
const { PNG } = require("pngjs");
const { loadOpenCV } = require("@opencvjs/node");
const { OpenCvJsAdapter } = require("./src/application/opencv/OpenCvJsAdapter");

const path = "C:\\Users\\Mickey\\Downloads\\hole 2.png";

async function main() {
    const png = PNG.sync.read(fs.readFileSync(path));
    const cv = await loadOpenCV();

    const mat = cv.matFromImageData({
        width: png.width,
        height: png.height,
        data: new Uint8ClampedArray(png.data)
    });

    try {
        const adapter = new OpenCvJsAdapter(cv);

        const seed = {
            x: 235,
            y: 350
        };

        console.log("Image:", png.width, "x", png.height);
        console.log("Seed:", seed);

        const contours = adapter.findContours(mat, seed);

        console.log("Contours found:", contours.length);

        contours.forEach((contour, index) => {
            console.log(
                "Contour",
                index,
                "points:",
                contour.points.length
            );

            if (contour.points.length > 0) {
                const xs = contour.points.map(p => p.x);
                const ys = contour.points.map(p => p.y);

                console.log({
                    minX: Math.min(...xs),
                    maxX: Math.max(...xs),
                    minY: Math.min(...ys),
                    maxY: Math.max(...ys)
                });
            }
        });
    } finally {
        mat.delete();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
