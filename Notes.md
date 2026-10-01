# OpenCV Green Detector — Notes

## Working state

- `seedTolerance = 22`
- `gradualTransitionSeedTolerance = 25`
- Morph kernel: `5x5`
- Escape hatch REMOVED in `createSingleSeedGuidedRegionMask`
  (simplified to `if (seedDistance > seedTolerance) {`)
- Test file: `tests/integration/OpenCvJsContourDetection.test.ts`
  - Loader at line 42: `"tests/fixtures/Green_2.png"`
  - Seed at line 491: `{ x: 491, y: 364 }`

## Confirmed working

- Ray-cast boundary pipeline (extractBoundaryByRays → smoothBoundary →
  segmentBoundary → subsampleToCount, 40 points)
- Morph close + fillInternalHoles
- All 10 tests pass
- Flood fill produces a clean 82k-pixel region on Green_2.png with
  the working tolerances above

## Known limitation

On images where green→fringe is a smooth colour ramp (e.g. Green_2.png),
no threshold-based detection works. Sampled colours:
    Green seed: (126, 160, 108)
    Fringe:     (96, 131, 88)    +46 from seed
    Fairway:    (148, 180, 129)  +36 from seed
No sharp edge exists — it's a gradient.

Tested 4 approaches, none clean on Green_2.png:
1. Fixed threshold T=40 — bottom OK, top in fringe
2. Fixed threshold T=30 — most rays fire too early
3. Fringe-depth metric — colour space is non-monotonic
4. Adaptive gradient — stops in fairway

The user-editing workflow handles this: auto-detect conservative,
user drags vertices to finish.

## Ideas for later (not built)

- **Confidence-based bridging** — score each ray by local colour gradient,
  bridge low-confidence runs with straight lines the user fixes.
- **Multi-seed consensus** — code already grows 5 masks, uses only masks[0].
  Pick median by pixel count to reject leaky seeds automatically.
- **User-adjustable offset slider** — detect green+fringe, offset polygon
  inward by N px, user slides until it lands on the green edge.
- **Ray profiling** — walk from seed, find where colour changes fastest
  (worked partially; inconclusive on Green_2.png)

## Next task — build the editor

- SVG overlay on the source image
- Draggable vertex circles
- Double-click a segment → insert vertex
- Right-click a vertex → delete
- Returns updated `PixelPoint[]`

## Files

- `src/application/opencv/OpenCvJsAdapter.ts` — main adapter
- `src/application/opencv/OpenCvTypes.ts` — OpenCV types
- `tests/integration/OpenCvJsContourDetection.test.ts` — test suite
- `tests/helpers/maskAscii.ts` — ASCII diagnostics
- `tests/fixtures/Green_2.png` — smooth-gradient test image
- `tests/fixtures/golf-green.png` — sharp-edge test image