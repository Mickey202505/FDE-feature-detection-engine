# Architectural Decision Record (ADR)

---

## ADR-001

### Decision
Restart the project using OpenCV.

### Status
Accepted

### Reason
OpenCV provides robust, well-tested computer-vision primitives and avoids reimplementing low-level image-processing algorithms.

---

## ADR-002

### Decision
The Feature Detection Engine will be a reusable library.

### Status
Accepted

---

## ADR-003

### Decision
The host application is responsible for imagery presentation and coordinate conversion.

### Status
Accepted

---

## ADR-004

### Decision
The public API will not expose OpenCV types.

### Status
Accepted

---

## ADR-005

### Decision
Development follows Test Driven Development.

### Status
Accepted

---

## ADR-006

### Decision
Green Fringe is generated immediately after Green detection.

### Status
Accepted

### Reason
The fringe depends directly on the green geometry and must exist before bunker clipping.

---

## ADR-007

### Decision
The engine will use deterministic computer vision rather than machine learning.

### Status
Accepted

### Reason
Results should be consistent, repeatable, and explainable.

---

## ADR-008

### Decision
Each detected feature shall contain a unique identifier and confidence score.

### Status
Accepted

---

## ADR-009

### Decision
OpenCV.js is the current browser OpenCV implementation.

### Status
Accepted

### Details
The project currently uses `opencv.js@1.2.1`, installed as:

```text
node_modules\opencv.js\opencv.js
```

OpenCV access is isolated behind application contracts and adapters.

---

## ADR-010

### Decision
The browser application is served with Vite.

### Status
Accepted

### Details
The browser entry point is `src/browser/main.ts`, the HTML entry point is `index.html`, and the development server is started with `npm run dev`.

---

## ADR-011

### Decision
Documentation First.

### Status
Accepted

### Decision
The project handbook is the governing specification for the Feature Detection Engine. Architectural changes must be documented before implementation begins.

### Consequences
- Documentation drives development.
- Tests are written from documented behaviour.
- Code follows the handbook rather than defining it.

---

## ADR-012

### Decision
Detection should be user-guided by an approximate centre/seed click.

### Status
Accepted

### Details
The preferred workflow is:
1. User selects a feature type.
2. User clicks approximately near the centre of the feature.
3. The engine uses the click as a seed/location for detection.

For bunkers, the user selects Bunker once and processes multiple bunkers sequentially.

For the green, the user selects Green and makes one centre click.

### Reason
A user-provided approximate location gives the deterministic detector useful context, reduces false positives, and is simpler than requiring the user to manually outline a feature.

### Consequence
The detection request must support an image-space seed/location without leaking OpenCV-specific types into the public API.

---

## ADR-013

### Decision
OpenCV runtime loading must work in the real browser application and be covered by integration testing.

### Status
Accepted

### Result
The real OpenCV.js contour integration test passes, and the browser has successfully processed a real golf-course image without console errors.
