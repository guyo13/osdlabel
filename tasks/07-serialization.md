# Task 07 — Serialization & State Persistence

**Depends on:** Task 06
**Spec sections:** §4.2, §7.4

## Objective

Implement the JSON serialization/deserialization layer and the external API for loading initial state and reacting to state changes.

## Steps

### 1. Create `src/core/annotations/serialization.ts`

**`serialize(state: AnnotationState, images: ImageSource[]): AnnotationDocument`**

- Iterate all images, collect their annotations, produce the `AnnotationDocument` envelope.
- Include version string `'1.0.0'` and current timestamp.

**`deserialize(doc: AnnotationDocument): Record<ImageId, Record<AnnotationId, Annotation>>`**

- Validate the document structure (version, required fields).
- Return the `byImage` map ready to be loaded into the store.
- Throw a typed error (`SerializationError`) if validation fails.

**`validateAnnotation(annotation: unknown): annotation is Annotation`**

- Type guard that validates the shape of an annotation object.
- Check: id is string, geometry has valid type discriminator, style has required fields, coordinates are finite numbers.

### 2. Wire `initialAnnotations` prop

In the `AnnotatorProvider`, when `initialAnnotations` is provided:

- On mount, call `deserialize` (or directly populate the store) with the initial data.
- For each annotation, create the corresponding Fabric object on the correct ViewerCell's canvas.

### 3. Wire `onAnnotationsChange` callback

Create a `createEffect` in the `AnnotatorProvider` that watches the annotation store. On any change, serialize the current state and call `props.onAnnotationsChange` with the full annotation array.

**Important:** Use `createEffect` with `on()` to avoid firing on the initial mount (unless you want to — discuss in the code comments).

```typescript
createEffect(
  on(
    () => JSON.stringify(annotationState.byImage), // deep-ish tracking
    () => {
      if (props.onAnnotationsChange) {
        const allAnnotations = getAllAnnotationsFlat(annotationState);
        props.onAnnotationsChange(allAnnotations);
      }
    },
    { defer: true }, // skip initial
  ),
);
```

### 4. Wire `onConstraintChange` callback

Similarly, watch the `constraintStatus` memo and call `props.onConstraintChange` when it changes.

### 5. Update the dev app

- Add a "Load Sample Data" button that calls the Annotator with pre-existing annotations.
- Add a "Export JSON" button that reads the current state via `onAnnotationsChange` and displays it in a `<pre>` block.
- Verify round-trip: export → reload page → load the exported JSON → annotations appear.

### 6. Write unit tests

**`tests/unit/annotations/serialization.test.ts`:**

- Test serialize → deserialize round-trip preserves all data.
- Test validation rejects malformed annotations (missing fields, invalid geometry type, NaN coordinates).
- Test version check (reject documents with unknown version).
- Test empty state serialization.

## NOT in scope for this task

- Grid view
- Filmstrip
- Keyboard shortcuts

## Verification

1. Load the dev app with `initialAnnotations` — annotations render immediately on the image.
2. Draw new annotations → `onAnnotationsChange` fires with the complete annotation list.
3. Export JSON → copy → reload → import → all annotations restored at correct positions.
4. Malformed JSON is rejected with a clear error.
5. `pnpm typecheck` passes.
6. `pnpm test` passes.
