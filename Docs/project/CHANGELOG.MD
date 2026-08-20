# Feature Detection Engine Change Log

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
