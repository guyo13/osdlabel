---
title: Serialization
description: JSON export/import functions
---

## serialize

```ts
function serialize(state: AnnotationState, images: readonly ImageSource[]): AnnotationDocument;
```

Serialize the current annotation state into a portable JSON document. Creates one `ImageAnnotations` entry per image in the `images` array.

**Example:**

```ts
import { serialize } from 'osdlabel/core';

const doc = serialize(annotationState, images);
const json = JSON.stringify(doc, null, 2);
```

---

## deserialize

```ts
function deserialize(doc: unknown): Record<ImageId, Record<AnnotationId, Annotation>>;
```

Parse and validate a serialized document, returning the `byImage` store structure. Throws `SerializationError` on invalid input.

**Validates:**

- Document version (`'1.0.0'`)
- Required fields (`exportedAt`, `images` array)
- Each annotation's structure (IDs, geometry, timestamps, raw data)

**Example:**

```ts
import { deserialize } from 'osdlabel/core';

try {
  const byImage = deserialize(JSON.parse(jsonString));
  actions.loadAnnotations(byImage);
} catch (e) {
  if (e instanceof SerializationError) {
    console.error('Invalid document:', e.message);
  }
}
```

---

## validateAnnotation

```ts
function validateAnnotation(value: unknown): value is Annotation;
```

Type guard that validates the shape of an annotation object. Checks:

- Required string fields (`id`, `imageId`, `contextId`, `createdAt`, `updatedAt`)
- Geometry structure (discriminated by `type`)
- `rawAnnotationData` structure (format, Fabric version, data type whitelisting)
- Numeric bounds (coordinates, dimensions)
- Path point count limits

Returns `true` if the value is a valid `Annotation`.

---

## getAllAnnotationsFlat

```ts
function getAllAnnotationsFlat(state: AnnotationState): Annotation[];
```

Flatten all annotations from the nested `byImage` store into a single array.

**Example:**

```ts
import { getAllAnnotationsFlat } from 'osdlabel/core';

const all = getAllAnnotationsFlat(annotationState);
console.log(`Total annotations: ${all.length}`);
```

---

## SerializationError

```ts
class SerializationError extends Error {
  name: 'SerializationError';
}
```

Thrown by `deserialize()` when the input document is invalid. The `message` property describes the specific validation failure.
