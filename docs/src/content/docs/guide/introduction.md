---
title: Introduction
description: Overview of the OSDLabel library.
---

# Introduction

**OSDLabel** is a powerful image annotation and labeling library built specifically for Deep Zoom Images (DZI). It combines the performance of [OpenSeaDragon](https://openseadragon.github.io/) for high-resolution image viewing with the flexibility of [Fabric.js](http://fabricjs.com/) for canvas-based annotation.

The library is designed with medical imaging workflows in mind, supporting granular per-context tool constraints and multi-image grid layouts.

## Key Features

- **Deep Zoom Support:** Annotate gigapixel images smoothly.
- **Multiple Geometries:** Supports rectangles, circles, lines, points, and paths.
- **Edit Capabilities:** Select, move, resize, and rotate annotations.
- **Constraint System:** Define "contexts" (e.g., specific pathologies) with allowed tools and annotation limits.
- **Grid Layout:** View and annotate multiple images side-by-side in a configurable grid.
- **Filmstrip Navigation:** Quickly switch between available images.
- **Reactive State:** Built on SolidJS for efficient updates and state management.
- **Keyboard Shortcuts:** Accelerate workflows with customizable shortcuts.

## Technology Stack

- **SolidJS:** Core UI framework.
- **Fabric.js (v7):** Canvas manipulation and object model.
- **OpenSeaDragon:** DZI viewer.
- **TypeScript:** Fully typed API.
