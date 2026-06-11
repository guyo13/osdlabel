---
"@osdlabel/fabric-annotations": minor
"osdlabel": minor
---

Add `createAnnotationFromGeometry` for seeding annotations from external geometry without the manual Fabric round-trip. The `osdlabel` umbrella (and the `@osdlabel/react` / `@osdlabel/solid` re-exports) gains `createAnnotationFromGeometry(geometry, { imageId, contextId, toolType, style?, id?, label? })`, which builds a complete `OsdAnnotation` including the Fabric `rawAnnotationData` envelope and guarantees the `id` survives serialization. `@osdlabel/fabric-annotations` exposes the underlying `buildFabricObjectFromGeometry` (the inverse of `getGeometryFromFabricObject`).
