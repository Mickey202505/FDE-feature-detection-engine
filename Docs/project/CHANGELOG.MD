# Feature Detection Engine Change Log

## Unreleased — September 2026

### Green Detection Pipeline — Rewrite
- Replaced the generic contour path with a purpose-built green detection pipeline.
- New stages: two-tolerance flood fill → ray-cast boundary → smooth → segment → uniform arc-length resample.
- Output is now a clean closed polygon in world-space coordinates (Web Mercator), directly usable for SVG.

### Two-Tolerance Flood Fill
- `SEED_TOLERANCE = 40` — max RGB distance from the seed colour.
- `LOCAL_TOLERANCE = 16` — max RGB distance from an accepted neighbour.
- A pixel is only accepted if it passes both checks.
- This stops the fill from leaking across the green→fringe edge, which a single tolerance could not handle.

### Adaptive Vertex Count
- `TARGET_SPACING = 25` — target pixel distance between adjacent vertices.
- `MIN_VERTICES = 12`, `MAX_VERTICES = 80`.
- The vertex count is computed from the polygon's perimeter, so small greens get fewer points and large greens get more.
- Points are resampled at exact arc-length multiples, eliminating clustering.

### World-Space Coordinate Storage
- Polygon vertices are stored as raw Web Mercator points, not pixel coordinates.
- Vertices remain stable across map zoom and pan.
- Direct output for SVG and downstream course-layout tools.

### Browser Maps Tester
- Added `tools/maps-tester.html` — a standalone browser tool for testing the pipeline against live Google Maps imagery.
- Right-click a green on Google Maps to set the seed.
- Pipeline runs in the browser (inline port of the detection algorithm).
- Polygon is drawn with draggable vertex markers.
- Editing:
  - **Drag** a vertex to move it.
  - **Double-click** a segment to insert a vertex (with `MIN_VERTEX_DISTANCE = 15` enforcement).
  - **Right-click** a vertex to delete it.
  - **Reset** clears the polygon and markers, ready for a new seed.
- Validated against a range of green sizes on real Google Maps courses.

### Verified State
- Auto-detection typically traces ~65% of the green edge on aerial imagery.
- Remaining coverage is finished by the user via the editing workflow.
- The tester is the reference implementation for the meshery app's integration.

### Next Work
1. Package the detection pipeline as an npm library (`detectGreen(imageData, seed, options)`).
2. Expose world-space polygon output for meshery's SVG renderer.
3. Hand off to the meshery designer with documentation and example usage.

## Unreleased — August 2026

### OpenCV.js Browser Integration
- Added a working OpenCV.js runtime integration.
- Standardised on `opencv.js@1.2.1`.
- Confirmed the installed runtime is `node_modules\opencv.js\opencv.js`.
- Added browser runtime loading through `src/infrastructure/opencv/OpenCvJsRuntime.ts`.
- Added OpenCV type contracts including `OpenCvMat`, `OpenCvContour`, `OpenCvPoint`, `OpenCvImageData`, and `OpenCvRuntime`.
- Added RGBA-to-grayscale support through the OpenCV runtime contract.
- Kept OpenCV types behind the application adapter boundary.

### Browser Application
- Confirmed `index.html` as the Vite HTML entry point.
- Confirmed `src/browser/main.ts` as the browser entry point.
- Added npm/Vite development workflow.
- The application can be started with `npm run dev`.

### Testing
- TypeScript compilation passes with `npx tsc --noEmit`.
- Full Vitest suite passes: 12 test files and 32 tests.
- Real OpenCV.js contour integration test passes.
- Manual browser test with a real golf-course image passes.
- Browser console produced no OpenCV errors during the manual test.

### Current Detection Behaviour
- The browser application successfully accepts a real golf-course image.
- Pressing Test runs the detection pipeline successfully.
- The current Green result is not yet sufficiently accurate: the observed result returned a polygon covering the full `575 x 620` test image with confidence `0.5`.
- This is now a detector/workflow accuracy problem rather than an OpenCV installation/runtime problem.

### Workflow Decision
- Agreed that the preferred user workflow is feature selection followed by an approximate centre click.
- Bunker workflow: select Bunker once, then click the centre/near-centre of each bunker in sequence.
- Green workflow: select Green, then make one approximate centre click.
- The click acts as a seed/location for processing.
- The new centre-click workflow has not yet been implemented.

## Next Work

1. Inspect the existing browser UI and detection request flow.
2. Add an image-space seed/location to the detection request without exposing OpenCV types.
3. Implement user-guided Green detection.
4. Implement user-guided Bunker detection.
5. Allow repeated bunker clicks after one Bunker selection.
6. Add automated tests for seed-based requests and detection.
7. Add browser/integration tests for the new workflow.
8. Improve the current Green detector so it does not return the entire image as the green.

## Historical Note

The previous contents of this file referenced the unrelated `prelude-ls` project. That history has been superseded for this repository. The FDE project change log above is now the authoritative project history.


## Maps-Tester.html
Thes are the work data points:
SEED_TOLERANCE = 40

LOCAL_TOLERANCE = 16

TARGET_SPACING = 25

MIN_VERTICES = 12

MAX_VERTICES = 80

MIN_VERTEX_DISTANCE = 15