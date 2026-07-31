# FDE Feature Detection Engine

## Project Handbook & Development Handover

**Version:** 1.0
**Status:** Ready for Implementation

---

# 1. Project Overview

## Objective

The Feature Detection Engine (FDE) is a standalone TypeScript package that automatically detects golf course features from aerial imagery and returns editable polygons.

The engine is **not** tied to Unity.

It is designed to be consumed by a React + Electron application as either:

* an npm package
* a CLI application
* or both.

---

## Primary Goals

The engine should:

* detect golf course features automatically
* generate editable polygons
* allow manual correction
* never remove user control
* be modular
* be testable
* be easy to extend.

---

# 2. Product Philosophy

The engine exists to reduce manual tracing.

It is **not** intended to produce perfect results automatically.

The user always has the final say.

Automatic detection is the starting point.

Manual editing is part of the normal workflow.

---

# 3. MVP Scope

Version 1 focuses on:

1. Green Detection
2. Tee Box Detection
3. Fairway Detection

After these are complete the engine should be released.

Remaining detectors will be delivered in later releases.

---

# 4. Planned Release Order

## Release 1

* Greens
* Tee Boxes
* Fairways

## Release 2

* Bunkers
* Water
* Cart Paths

## Release 3

* Trees
* Rough
* Remaining layers

---

# 5. Repository Structure

packages/

domain/

core/

cli/ (future)

react-demo/ (future)

---

## Domain

Contains only business objects.

Examples:

* Geometry
* Point
* CourseCoordinate
* GolfFeatureType

No algorithms.

No OpenCV.

No image processing.

---

## Core

Contains:

* detection pipeline
* detectors
* geometry algorithms
* image processing
* validation
* polygon generation

---

# 6. Architecture

FeatureDetectionEngine

↓

DetectionPipeline

↓

GreenDetector

↓

TeeBoxDetector

↓

FairwayDetector

↓

Future detectors

Detectors never communicate with one another.

Only the pipeline coordinates execution.

---

# 7. Detector Principles

Every detector:

* works independently
* has a single responsibility
* can be enabled or disabled
* can fail without stopping the pipeline
* returns a standard result object

No detector should know another detector exists.

---

# 8. Detection Order

Stage 1

Green Detection

↓

Stage 2

Tee Box Detection

↓

Stage 3

Fairway Detection

↓

Future Stages

* Bunkers
* Water
* Cart Paths
* Trees
* Rough

---

# 9. Editing Philosophy

Every detected polygon is editable.

Users may:

* move vertices
* delete vertices
* add vertices
* reshape polygons
* rename features
* delete polygons
* create new polygons

Detection never locks the user into the AI result.

---

# 10. Layers

Every feature belongs to a layer.

Examples:

* Greens
* Tee Boxes
* Fairways
* Bunkers
* Water

Layers support:

* visibility on/off
* locking
* future filtering

---

# 11. Polygon Holes

Some polygons contain holes.

Example:

A grass island inside a bunker.

The engine may detect these automatically.

If it does not:

The user can manually draw a hole inside the polygon.

No separate "Bunker Island" feature exists.

Polygon holes are generic geometry.

---

# 12. Feature Renaming

Users may rename a detected feature.

Example:

Detected as:

Bunker

User changes to:

Tee Box

The polygon remains.

Only the feature type changes.

---

# 13. User Control

The user is always in control.

The engine never:

* deletes user edits
* overrides manual corrections
* locks editing
* forces automatic results

---

# 14. Coding Standards

Every class has one responsibility.

Keep implementations simple.

Do not optimise early.

Avoid unnecessary abstractions.

Write code only when required.

---

# 15. Testing Standards

Every class must have unit tests.

Development cycle:

Write class

↓

Write tests

↓

Build

↓

Tests pass

↓

Done

---

# 16. Build Rules

Every coding session finishes with:

pnpm exec tsc --build

pnpm run test

Main must always remain green.

---

# 17. Development Order

Current Sprint

1. ImageCropper
2. BoundaryTracer
3. PolygonOptimizer
4. GreenDetector
5. DetectionPipeline integration

Nothing else until these work.

---

# 18. Current Implementation Status

Completed

✓ Domain objects

✓ Basic pipeline

✓ PolygonBuilder

✓ Repository structure

✓ Initial tests

Pending

□ ImageCropper

□ BoundaryTracer

□ PolygonOptimizer

□ GreenDetector

□ TeeBoxDetector

□ FairwayDetector

---

# 19. Design Principles

Keep the engine generic.

Golf knowledge belongs inside detectors.

Geometry belongs inside geometry classes.

Image processing belongs inside image classes.

The pipeline only orchestrates.

---

# 20. Long-Term Vision

The FDE should become a reusable feature detection library capable of powering multiple applications.

The React + Electron course editor is the first consumer.

Future applications should be able to use the same engine without modification.

---

# 21. Definition of Done

A feature is complete when:

✓ Code implemented

✓ Unit tests written

✓ Build passes

✓ Tests pass

✓ Ready for release

Nothing is considered complete before this point.

---

# 22. Immediate Next Steps

1. Remove all placeholder tests.
2. Remove generated `dist` test files from version control.
3. Ensure the repository returns to a clean test run.
4. Implement `ImageCropper`.
5. Implement `BoundaryTracer`.
6. Implement `PolygonOptimizer`.
7. Build the first working `GreenDetector`.
8. Verify end-to-end detection through `DetectionPipeline`.

---

# 23. Guiding Principle

Build the smallest thing that works.

Ship early.

Improve continuously.

Keep the codebase simple, modular, and maintainable.

Every release should provide real value while leaving the architecture clean enough to support future detectors without major refactoring.
