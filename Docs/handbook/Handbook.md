\# Feature Detection Engine (FDE)

\# Project Handbook

\*\*Version:\*\* 2.0.0

\*\*Edition:\*\* OpenCV Edition

\*\*Status:\*\* Authoritative Project Specification

\*\*Last Updated:\*\* August 2026

\---

Table of Contents

[Table of Contents 1](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754289)

[1\. Introduction 3](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754290)

[2\. Vision 3](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754291)

[3\. Project Goals 4](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754292)

[4\. Scope 5](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754293)

[5\. Non Goals 5](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754294)

[6\. Technology Stack 6](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754295)

[6.1 Language 6](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754296)

[6.2 Runtime 6](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754297)

[6.3 Package Manager 6](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754298)

[7\. OpenCV Philosophy 6](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754299)

[8\. High Level Architecture 8](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754300)

[9\. Package Structure 9](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754301)

[10 Dependency Rules 10](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754302)

[11\. Coding Standards 10](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754303)

[12\. Development Principles 11](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754304)

[13\. Detection Pipeline 12](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754305)

[14\. Pipeline Overview 12](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754306)

[15\. OpenCV Pre-processing 14](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754307)

[16\. Green Detection 14](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754308)

[17\. Green Fringe Generation 17](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754309)

[18\. Tee Box Detection 19](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754310)

[19\. Bunker Detection 20](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754311)

[20\. Fringe Clipping 21](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754312)

[21\. Fairway Detection 23](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754313)

[22\. Future Detectors 25](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754314)

[23\. Detector Independence 25](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754315)

[24\. Geometry Standards 26](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754316)

[25\. Public API 26](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754317)

[26\. Detection Request 27](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754318)

[27\. Detection Result 28](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754319)

[28\. Host Application Responsibilities 28](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754320)

[29\. Feature Detection Engine Responsibilities 29](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754321)

[30\. Folder Structure 29](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754322)

[31\. Coding Standards 30](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754323)

[32\. SOLID Principles 30](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754324)

[33\. Naming Conventions 31](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754325)

[34\. File Organisation 32](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754326)

[35\. Error Handling 32](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754327)

[36\. Logging 33](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754328)

[37\. Performance Targets 33](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754329)

[38\. Testing Strategy 34](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754330)

[39\. Test Categories 34](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754331)

[40\. Continuous Integration 35](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754332)

[41\. Code Reviews 35](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754333)

[42\. Documentation 36](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754334)

[43\. Definition of Done 36](file:///C:\Program%20Files\KMSpico\temp\29d71e27-d805-4827-9308-bbacf8f0198d_FDE_updated_documentation.zip.98d\HANDBOOK.docx#_Toc236754335)

\---

# Introduction

This handbook is the authoritative specification for the Feature Detection

Engine (FDE).

All architectural decisions, coding standards and implementation details

must follow this document.

When implementation decisions arise, this handbook takes precedence over

conversation history.

The objective of the project is to build a reusable golf course feature

detection engine capable of identifying golf course features from aerial

imagery and producing clean editable vector geometry.

The engine is designed to be embedded into desktop applications,

React applications and command line workflows.

\---

# Vision

\# Imagery Sources

The Feature Detection Engine is designed primarily to analyse high-resolution

satellite and aerial imagery of golf courses.

Typical image sources include:

\- Google Maps Satellite imagery\*

\- Bing Maps Aerial imagery\*

\- Commercial aerial photography

\- Drone imagery

\- Orthophotos

\- Survey imagery

The engine operates on raster images and is independent of the imagery

provider.

The preferred workflow is:

1\. Capture or export a high-resolution aerial image.

2\. Supply the image to the Feature Detection Engine.

3\. Detect golf course features.

4\. Review and edit generated polygons.

5\. Export geometry for use by downstream applications.

\*Users are responsible for complying with the licensing and terms of service

of the imagery provider. The Feature Detection Engine does not download,

scrape, or redistribute imagery.

\---

# Project Goals

The project aims to provide:

\- Automated feature detection.

\- High quality editable polygons.

\- Consistent geometry.

\- Fast processing.

\- Cross platform support.

\- Easy integration.

\- Clean architecture.

\- Comprehensive automated tests.

\---

# Scope

The engine will detect golf course features including:

1. Greens
2. Green Fringes
3. Tee Boxes
4. Bunkers
5. Fairways
6. Water Hazards
7. Cart Paths
8. Trees
9. Rough

\- Future features

Each detector is developed independently.

\---

# Non Goals

The engine will not:

\- Edit imagery.

\- Produce rendered maps.

\- Perform GIS editing.

\- Replace CAD software.

\- Provide a graphical editor.

\- Become a Unity package.

The engine exists purely as a reusable detection library.

\---

# Technology Stack

## 6.1 Language

TypeScript

## 6.2 Runtime

Node.js

6.3 Package Manager

pnpm

\## Testing

Vitest

\## Build

TypeScript Project References

\## Computer Vision

OpenCV

\## User Interfaces

React

Electron

CLI

\---

# 7\. OpenCV Philosophy

OpenCV is responsible for generic computer vision.

FDE is responsible for golf specific intelligence.

This distinction is fundamental.

OpenCV performs:

\- Image loading

\- Colour conversion

\- HSV thresholding

\- Image filtering

\- Morphological operations

\- Contour extraction

\- Polygon approximation

\- Shape analysis

FDE performs:

\- Green identification

\- Fringe generation

\- Tee box identification

\- Bunker identification

\- Fairway identification

\- Geometry cleanup

\- Feature relationships

\- Output generation

The project should never reimplement algorithms already provided by OpenCV

unless a golf-specific enhancement is required.

\---

# 8\. High Level Architecture

\`\`\`

React / Electron / CLI

│

▼

FeatureDetectionEngine

│

▼

Detection Pipeline

│

▼

OpenCV Pipeline

│

▼

Feature Detectors

│

▼

Geometry Processing

│

▼

Domain Objects

\`\`\`

The architecture is deliberately layered.

Each layer has a single responsibility.

\---

# 9\. Package Structure

The repository is organised into packages.

\`\`\`

packages/

domain/

core/

cli/

react/

electron/

\`\`\`

\### domain

Pure domain models.

No OpenCV dependency.

\### core

Detection engine.

OpenCV integration.

Geometry generation.

\### cli

Command line interface.

\### react

React integration.

\### electron

Electron integration.

\---

10 Dependency Rules

Dependencies must only point downwards.

\`\`\`

React

│

Electron

│

CLI

│

Core

│

Domain

\`\`\`

Domain must never reference OpenCV.

Core may reference OpenCV.

UI packages must not perform image processing.

\---

# 11\. Coding Standards

The project follows strict SOLID principles.

Every class should have one responsibility.

Prefer composition over inheritance.

Avoid unnecessary abstraction.

Avoid premature optimisation.

Public APIs should remain small.

Keep files focused.

Classes should normally remain under approximately

200 lines unless justified.

Methods should normally remain under approximately

30 lines.

\---

# 12\. Development Principles

Development follows Test Driven Development.

The workflow is:

Red

Green

Refactor

Every completed task must satisfy:

\- pnpm exec tsc --build

\- pnpm run test

before work continues.

No feature is considered complete until:

\- code compiles

\- tests pass

\- documentation updated

\---

# 13\. Detection Pipeline

The detection engine processes golf holes in a strict order.

Each stage produces information used by later stages.

Detectors are intentionally ordered to reduce ambiguity and improve

overall detection quality.

The pipeline is:

1\. OpenCV Pre-processing

2\. Green Detection

3\. Green Fringe Generation

4\. Tee Box Detection

5\. Bunker Detection

6\. Fringe Clipping

7\. Fairway Detection

8\. Future Detectors

The output of every stage becomes available to later stages.

\---

# 14\. Pipeline Overview

\`\`\`mermaid

flowchart TD

A\[Input Image\]

Satellite / Aerial Image

│

▼

OpenCV Pipeline

│

▼

Feature Detection

│

▼

Editable Geometry

\--> B\[OpenCV Pre-processing\]

B --> C\[Green Detection\]

C --> D\[Green Fringe Generation\]

D --> E\[Tee Box Detection\]

E --> F\[Bunker Detection\]

F --> G\[Fringe Clipping\]

G --> H\[Fairway Detection\]

H --> I\[Future Detectors\]

\`\`\`

\---

# 15\. OpenCV Pre-processing

OpenCV pre-processing exists to prepare the image for all detectors.

This stage performs generic image operations only.

No golf-specific logic belongs here.

The pre-processing stage may include:

\- Image loading

\- Colour conversion

\- HSV conversion

\- Noise reduction

\- Blur filters

\- Morphological opening

\- Morphological closing

\- Thresholding

\- Contour extraction

\- Polygon approximation

This stage produces reusable intermediate results for detectors.

Detectors should avoid repeating expensive OpenCV operations whenever

possible.

\---

# 16\. Green Detection

\## Purpose

Detect putting greens and generate editable polygons.

Greens are the highest priority feature.

All later processing depends on successful green detection.

\---

\## Inputs

\- Pre-processed image

\- OpenCV contour information

\---

\## Outputs

\- Green polygons

\- Confidence scores

\---

\## Requirements

Detected greens must:

\- Represent the visible putting surface.

\- Produce editable polygons.

\- Avoid excessive vertices.

\- Remain accurate after simplification.

\- Be independent features.

\---

\## Geometry Requirements

Green polygons:

\- Must be closed polygons.

\- Must not self-intersect.

\- Must be editable.

\- Must support simplification.

\- Must preserve shape accuracy.

\---

\## Confidence

Every detected green includes a confidence value.

Confidence ranges:

\`\`\`

0.0

to

1.0

\`\`\`

Example:

\`\`\`

0.92

\`\`\`

\## Detector Responsibility

The Green Detector is responsible only for:

\- Identifying greens.

\- Producing polygons.

\- Producing confidence values.

It is not responsible for:

\- Fringe creation.

\- Bunker clipping.

\- Fairway detection.

\---

# 17\. Green Fringe Generation

\## Purpose

Generate a fringe polygon around every detected green.

Fringes are generated.

They are never directly detected.

\---

\## Rationale

Fringes have highly variable visual appearance.

Generating fringes provides:

\- Consistent width.

\- Better geometry.

\- Predictable editing.

\- Faster processing.

\- Reduced image analysis.

\---

\## Inputs

\- Green polygon

\---

\## Outputs

\- Fringe polygon

\---

\## Default Width

The default fringe width is: 600 mm

\`\`\`

Equivalent to: 2 feet

\`\`\`

This value may become configurable in future versions.

Version 2 uses a fixed width.

\---

\## Generation Method

The fringe is generated by offsetting the green polygon outward.

\`\`\`mermaid flowchart LR

A\[Green Polygon\]

\--> B\[Offset 600 mm\]

\--> C\[Fringe Polygon\]

\`\`\`

\---

\## Fringe Requirements

Fringes must:

\- Be editable.

\- Exist as independent polygons.

\- Exist on their own layer.

\- Preserve green shape.

\- Remain valid polygons.

\---

\## Fringe Ownership

Every fringe belongs to exactly one green.

A fringe cannot exist without a green.

\---

# 18\. Tee Box Detection

\## Purpose

Detect tee boxes.

\---

\## Inputs

\- Pre-processed image

\- Existing green data

\---

\## Outputs

\- Tee polygons

\- Confidence values

\---

\## Requirements

Tee polygons must:

\- Be editable.

\- Be closed polygons.

\- Avoid self-intersection.

\- Preserve shape accuracy.

\---

\## Detector Responsibility

The Tee Detector is responsible only for:

\- Detecting tee boxes.

\- Producing polygons.

\- Producing confidence values.

\---

# 19\. Bunker Detection

\## Purpose

Detect bunkers.

\---

\## Inputs

\- Pre-processed image

\- Green geometry

\- Fringe geometry

\- Tee geometry

\---

\## Outputs

\- Bunker polygons

\- Confidence values

\---

\## Requirements

Bunkers must:

\- Produce editable polygons.

\- Produce closed polygons.

\- Avoid self-intersection.

\- Support clipping operations.

\---

\## Detector Responsibility

The Bunker Detector is responsible only for:

\- Detecting bunkers.

\- Producing polygons.

\- Producing confidence values.

\---

# 20\. Fringe Clipping

\## Purpose

Allow bunkers to encroach into generated fringe geometry.

This stage ensures realistic green complexes.

\---

\## Inputs

\- Green polygons

\- Fringe polygons

\- Bunker polygons

\---

\## Outputs

\- Updated fringe polygons

\---

\## Behaviour

If a bunker intersects a fringe:

The bunker removes overlapping fringe geometry.

Example:

\`\`\`text

Green

██████

Fringe

▓▓▓▓▓▓▓▓

Bunker

◯

Result

▓▓▓ ◯ ▓▓▓

\`\`\`

\---

\## Rationale

Many golf courses have bunkers immediately adjacent to greens.

Generated fringes must respect bunker boundaries.

\---

\## Responsibility

Fringe Clipping is responsible only for:

\- Geometry subtraction.

\- Fringe modification.

It is not responsible for bunker detection.

\---

# 21\. Fairway Detection

\## Purpose

Detect fairways after the green complex has been fully established.

Fairways are intentionally detected after:

\- Greens

\- Fringes

\- Bunkers

This provides context and reduces ambiguity.

\---

\## Inputs

\- Green polygons

\- Fringe polygons

\- Bunker polygons

\- Tee polygons

\- Pre-processed image

\---

\## Outputs

\- Fairway polygons

\- Confidence values

\---

\## Requirements

Fairways must:

\- Produce editable polygons.

\- Avoid self-intersection.

\- Support simplification.

\- Preserve shape accuracy.

\---

\## Detector Responsibility

The Fairway Detector is responsible only for:

\- Detecting fairways.

\- Producing polygons.

\- Producing confidence values.

\---

# 22\. Future Detectors

Future releases may include:

\- Water hazards

\- Cart paths

\- Trees

\- Rough

\- Waste areas

\- Practice greens

\- Driving ranges

\- Buildings

\- Bridges

These detectors must integrate into the existing pipeline without

breaking previous detectors.

\---

# 23\. Detector Independence

Every detector must:

\- Have one responsibility.

\- Be individually testable.

\- Be replaceable.

\- Avoid knowledge of UI frameworks.

\- Avoid knowledge of persistence.

\- Avoid knowledge of React.

\- Avoid knowledge of Electron.

\---

# 24\. Geometry Standards

All produced polygons must:

\- Be closed.

\- Be editable.

\- Avoid self-intersections.

\- Preserve shape accuracy.

\- Support simplification.

\- Support clipping.

\- Support future export formats.

\- Public API

\- React integration

\- Electron integration

\- Coding standards

\- Testing strategy

\- Build requirements

\- CI pipeline

\- Error handling

\- Performance targets

\---

# 25\. Public API

The Feature Detection Engine exposes a small, stable public API.

The engine should be easy to integrate into any host application.

The primary entry point is:

\`\`\`typescript

const engine = new FeatureDetectionEngine();

\`\`\`

Processing is initiated by passing a \`DetectionRequest\` and receiving a

\`DetectionResult\`.

\`\`\`typescript

const result = await engine.detect(request);

\`\`\`

The public API must remain independent of OpenCV.

\---

# 26\. Detection Request

All processing is initiated through a \`DetectionRequest\`.

The request contains:

\- Source image

\- Requested features

\- Processing options

\- Optional metadata

Future versions may extend this object without breaking compatibility.

\---

# 27\. Detection Result

The detection result contains:

\- Detected features

\- Geometry

\- Confidence scores

\- Processing time

\- Warnings

\- Optional diagnostics

The result should provide enough information for the host application to

display, edit and export detected features.

\---

# 28\. Host Application Responsibilities

The host application is responsible for:

\- Displaying imagery.

\- Allowing navigation and zooming.

\- Selecting the area to process.

\- Passing the selected image to the FDE.

\- Displaying returned geometry.

\- Editing geometry if required.

\- Exporting final results.

The FDE does not perform any user interface operations.

\---

# 29\. Feature Detection Engine Responsibilities

The Feature Detection Engine is responsible for:

\- Validating requests.

\- Processing images.

\- Detecting golf features.

\- Generating polygons.

\- Generating green fringes.

\- Clipping fringes around bunkers.

\- Returning editable geometry.

\- Reporting confidence values.

The engine should remain completely independent of the host application.

\---

# 30\. Folder Structure

The recommended repository layout is:

\`\`\`

packages/

domain/

core/

cli/

react/

electron/

docs/

examples/

scripts/

.github/

\`\`\`

Each package should have a single responsibility.

\---

# 31\. Coding Standards

The project follows modern TypeScript best practices.

Guidelines include:

\- Strict TypeScript mode.

\- No implicit \`any\`.

\- Readonly where possible.

\- Explicit return types for public methods.

\- Prefer interfaces for contracts.

\- Prefer composition over inheritance.

\- Avoid global state.

\---

# 32\. SOLID Principles

All code should follow SOLID.

\### Single Responsibility

Each class has one responsibility.

\### Open / Closed

Classes should be open for extension but closed for modification.

\### Liskov Substitution

Derived implementations should behave consistently.

\### Interface Segregation

Small focused interfaces are preferred.

\### Dependency Inversion

Depend upon abstractions rather than implementations.

\---

# 33\. Naming Conventions

Classes

\`\`\`

GreenDetector

\`\`\`

Interfaces

\`\`\`

DetectionRequest

\`\`\`

Enums

\`\`\`

GolfFeatureType

\`\`\`

Methods

\`\`\`

detectGreen()

\`\`\`

Variables

\`\`\`

greenPolygon

\`\`\`

Constants

\`\`\`

DEFAULT_FRINGE_WIDTH

\`\`\`

\---

# 34\. File Organisation

Each file should normally contain:

\- One public class

\- One public interface

\- One public enum

Avoid combining unrelated classes into a single file.

\---

# 35\. Error Handling

Errors should be meaningful.

Examples include:

\- Invalid image

\- Unsupported image format

\- Empty image

\- Corrupted image

\- Invalid request

Internal implementation details should not be exposed to the caller.

\---

# 36\. Logging

Logging should be optional.

Typical log levels:

\- Error

\- Warning

\- Information

\- Debug

\- Trace

Logging should never affect detection results.

\---

# 37\. Performance Targets

The engine should prioritise correctness over premature optimisation.

Performance goals for a single golf hole:

| Image Size | Target Time |

|------------|-------------|

| 1024 × 1024 | < 1 second |

| 2048 × 2048 | < 3 seconds |

| 4096 × 4096 | < 8 seconds |

These targets will be reviewed as detectors are implemented.

\---

# 38\. Testing Strategy

All development follows Test-Driven Development (TDD).

Workflow:

1\. Write a failing test.

2\. Implement the minimum code.

3\. Make the test pass.

4\. Refactor.

5\. Repeat.

Every detector must have dedicated unit tests.

Integration tests verify the complete detection pipeline.

\---

# 39\. Test Categories

Tests are grouped into:

\- Unit Tests

\- Integration Tests

\- Geometry Tests

\- Performance Tests

\- Regression Tests

Regression tests should be added whenever a bug is fixed.

\---

# 40\. Continuous Integration

Every pull request should execute:

\`\`\`

pnpm install

pnpm exec tsc --build

pnpm run test

\`\`\`

Future CI pipelines may also include:

\- ESLint

\- Prettier

\- Coverage reports

\- Documentation validation

\---

# 41\. Code Reviews

All code should be reviewed against the following checklist:

\- Does it compile?

\- Do all tests pass?

\- Are new tests included?

\- Is documentation updated?

\- Does it follow SOLID?

\- Is the public API unchanged?

\- Is the implementation readable?

\---

# 42\. Documentation

Documentation is considered part of the project.

Whenever behaviour changes, the relevant documentation should also be updated.

Key project documents include:

\- HANDBOOK.md

\- ARCHITECTURE.md

\- ROADMAP.md

\- PROGRESS.md

\- DECISIONS.md

\- CHANGELOG.md

\---

# 43\. Definition of Done

A task is complete only when:

\- Implementation is finished.

\- Tests pass.

\- TypeScript builds successfully.

\- Documentation is updated.

\- Code has been reviewed.

\- No known regressions exist.

\- Project governance

\- Release roadmap

\- Milestones

\- Architectural Decision Records (ADR)

\- Future enhancements

\- Contribution guidelines

\- Glossary

\- Appendix

\- Mermaid architecture diagrams

**Part 4 – Governance & Roadmap**

**Still to be completed**

Governance

Release process

ADR log

Roadmap

Contribution guide

Glossary

Architecture diagrams

Appendices

# Part 5 – Current Implementation Baseline

This section records the current implementation baseline as of August 2026. It supplements the original Version 2.0 specification and is authoritative where it describes the currently implemented browser/OpenCV stack.

## Technology Baseline

• Language: TypeScript.

• Package manager: npm.

• Browser development server: Vite.

• Testing: Vitest.

• Computer vision: OpenCV.js 1.2.1.

• OpenCV.js runtime file: node_modules\\opencv.js\\opencv.js.

• HTML entry point: index.html.

• Browser entry point: src/browser/main.ts.

## Verified Build and Test State

The current verified commands are:

npx tsc --noEmit

npx vitest run

npx vitest run tests/integration/OpenCvJsContourDetection.test.ts

The latest verified full test run passes 12 test files and 32 tests. The real OpenCV.js contour integration test also passes.

## Verified Browser State

• The Vite browser application starts successfully.

• A real golf-course image can be selected.

• The image is processed successfully.

• OpenCV.js initialises and performs real processing.

• No browser console errors were observed.

• A Green feature result is returned.

Current limitation: the observed Green test returned a polygon covering the complete 575 x 620 image with confidence 0.5. Therefore the OpenCV runtime integration is working, but the current Green detection strategy is not yet sufficiently feature-specific.

## User-Guided Centre-Click Workflow

The agreed next workflow is user-guided detection using an approximate centre/seed click.

### Bunker Workflow

Select Bunker once.

Click approximately near the centre of bunker 1.

Process the bunker using the click as a seed/location.

Repeat the click for bunker 2, 3, 4 and 5 without reselecting Bunker.

Return each detected bunker as editable geometry.

### Green Workflow

Select Green.

Click approximately near the centre of the green.

Use the click as the seed/location for detection.

Return the detected green as editable geometry.

The centre click is intended to be approximate rather than pixel-perfect.

## Implementation Constraint

The seed/centre point must be represented in the public application/domain request without exposing OpenCV-specific types. The host/browser UI captures the click; the application layer passes the seed to the appropriate detector; the OpenCV adapter remains responsible only for OpenCV operations.

## Next Development Milestone

Milestone 3 — User-Guided Feature Detection

• Add seed/centre-point support to the detection request.

• Add tests for the new request behaviour.

• Implement seed-guided Green detection.

• Implement seed-guided Bunker detection.

• Allow repeated bunker clicks after one feature selection.

• Improve Green detection so the full source image is not accepted as the Green polygon.

• Add browser/integration tests for the new interaction.

Documentation rule: architectural or workflow changes must be recorded in the handbook, decision log, progress tracker, and change log before or alongside implementation.