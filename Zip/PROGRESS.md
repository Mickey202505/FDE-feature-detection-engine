# Feature Detection Engine — Progress Tracker

## Current Version

2.0

## Current Phase

Phase 1 — Working OpenCV Browser Vertical Slice

## Milestone Status

### Milestone 1 — Handbook Freeze
Status: 🟢 Functionally established

The project architecture, OpenCV boundary, testing approach, and next user workflow have been documented.

### Milestone 2 — OpenCV Browser Integration
Status: 🟢 Complete

Completed:
- OpenCV.js installed and working.
- Browser runtime loads correctly.
- OpenCV adapter works.
- Real OpenCV.js contour integration test passes.
- Browser application runs through Vite.
- Real golf-course image processed successfully.
- No browser console errors observed.

### Milestone 3 — User-Guided Feature Detection
Status: 🟡 Next

Goal:
Allow the user to select a feature type and click approximately near its centre so detection is seeded by the user's selection.

## Verified Automated Test State

Latest verified result:

```text
Test Files: 12 passed (12)
Tests:      32 passed (32)
```

Latest verified commands:

```text
npx tsc --noEmit
npx vitest run
npx vitest run tests/integration/OpenCvJsContourDetection.test.ts
```

All passed on the current development PC.

## Verified Browser State

The browser application has been manually tested with a real golf-course image.

Observed:
- Image selection works.
- Image processing works.
- OpenCV.js initialises and processes the image.
- No console errors.
- Detection result is returned.

Observed Green result:

```text
Polygon: full 575 x 620 test image
Confidence: 0.5
```

This means the OpenCV/browser plumbing is working, but Green detection still needs a better feature-specific strategy.

## Current Project Files / Runtime

```text
index.html
src/browser/main.ts
src/application/opencv/OpenCvTypes.ts
src/application/opencv/OpenCvAdapter.ts
src/application/opencv/OpenCvJsAdapter.ts
src/infrastructure/opencv/OpenCvJsRuntime.ts
```

OpenCV package:

```text
opencv.js@1.2.1
```

Runtime file:

```text
node_modules\opencv.js\opencv.js
```

## Agreed User Workflow

### Bunkers

- Select Bunker.
- Click approximately near the centre of bunker 1.
- Process and return bunker 1.
- Click bunker 2.
- Continue until all bunkers have been processed.
- Do not require the user to reselect Bunker for every click.

### Green

- Select Green.
- Click approximately near the centre of the green.
- Process one green.

The click is a seed, not a requirement for pixel-perfect positioning.

## Next Tasks

1. Inspect current browser UI and request model.
2. Introduce an image-space seed/centre point into the detection request.
3. Keep the new point independent of OpenCV types.
4. Write failing tests for seed-aware requests.
5. Implement Green seed-based detection.
6. Implement Bunker seed-based detection.
7. Implement repeated bunker processing after one selection.
8. Improve Green segmentation so a full-image polygon is not accepted as the Green polygon.
9. Add browser/integration coverage.
10. Update documentation after each architectural change.

## Outstanding Technical Questions

- Exact image-space coordinate convention for the centre click.
- Initial seed search radius/window.
- Whether different feature types require different search radii.
- Detector behaviour when the click is outside a valid feature.
- How confidence should change when a feature is seed-guided.

## Long-Term Goal

A deterministic, reusable golf-course feature detection engine producing clean editable geometry for greens, fringes, tee boxes, bunkers, fairways, and future feature types.
