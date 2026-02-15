# Backlog — @guyo13/osdlabel

Tracked issues, improvements, and deferred work items.

---

## Open

### BL-001: Overlay vibration during browser window resize

**Severity:** Low (cosmetic)
**Observed in:** Task 02 — OSD–Fabric overlay integration
**Status:** Deferred

**Description:**
When the browser window is resized (especially rapidly), the Fabric annotation overlay exhibits a brief vibration/jitter before settling to the correct position. The annotations end up in the correct final position but the transient movement is visually noticeable.

**Context:**
- Zoom and fast panning were fixed by switching from async `requestRenderAll()` to synchronous `renderAll()` in the sync handler (the async version deferred the Fabric paint to the next rAF, causing a 1-frame lag).
- The resize path calls `fabricCanvas.setDimensions()` followed by `sync()`, both synchronous. The remaining vibration likely comes from the browser's own resize event batching — `resize` events may fire at a different cadence than OSD's internal rAF loop, and OSD's own viewport state may not be fully settled when the resize handler runs.

**Potential investigation paths:**
1. Debounce or throttle the resize handler with `requestAnimationFrame` to coalesce rapid resize events.
2. Use `ResizeObserver` on the OSD container instead of (or in addition to) OSD's `resize` event, which may fire at a more predictable time.
3. Temporarily hide the Fabric canvas during resize and re-show after a short debounce.
4. Investigate whether OSD's `resize` event fires before or after it updates its internal viewport dimensions.

---

## Resolved

_(None yet)_
