---
"osdlabel": minor
"@osdlabel/solid": minor
"@osdlabel/react": minor
"@osdlabel/geometry": minor
---

Add circle→rectangle conversion and interactive polygon/polyline vertex editing.

- Convert a selected circle to its axis-aligned bounding rectangle via a contextual, constraint-aware "Convert to Rect" toolbar button, backed by the pure `circleToBoundingRectangle` helper.
- Edit polygon/polyline vertices: a configurable long-press enters a sticky edit mode with per-vertex move handles and edge-midpoint insertion handles; Delete/Backspace removes a vertex (min 3 polygon / 2 polyline). Reachable from the Select, Polyline, and Free-draw tools; long-press timing/tolerance are Annotator-level options.
- New `@osdlabel/geometry` package holds the geometry math and conversions; `@osdlabel/decoration` re-exports the math so the public API is unchanged.
