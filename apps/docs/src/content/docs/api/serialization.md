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
import { serialize } from '@osdlabel/annotation';

const doc = serialize(annotationState, images);
const json = JSON.stringify(doc, null, 2);
```

---

## deserialize

```ts
function deserialize<E extends object = Record<string, never>>(
  doc: unknown,
  extensionValidator?: ExtensionValidator<E>,
): DeserializeResult<E>;
```

Parse and validate a serialized document, returning the `byImage` store structure. Throws `SerializationError` on invalid input.

Pass an `extensionValidator` to also validate extension fields (e.g. `contextId`, `rawAnnotationData`). Accepts either a type guard function or a [Standard Schema](https://github.com/standard-schema/standard-schema) (e.g. from Valibot or Zod).

**Validates:**

- Document version (`'1.0.0'`)
- Required fields (`exportedAt`, `images` array)
- Each annotation's structure (IDs, geometry, timestamps, raw data)

**Example:**

```ts
import { deserialize } from '@osdlabel/annotation';

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

## validateBaseAnnotation

```ts
function validateBaseAnnotation(value: unknown): value is BaseAnnotation;
```

Type guard that validates the base annotation fields (id, imageId, geometry, timestamps). Does **not** validate extension fields — use `createAnnotationValidator` for that.

---

## createAnnotationValidator

```ts
function createAnnotationValidator<E extends object>(
  extensionValidator: ExtensionValidator<E>,
): (value: unknown) => value is Annotation<E>;
```

Creates a composed validator that checks both base annotation fields and extension fields. The `extensionValidator` can be either a type guard function or a Standard Schema (e.g. a Valibot schema from `@osdlabel/validation`).

**Example:**

```ts
import { createAnnotationValidator } from '@osdlabel/annotation';
import { RawAnnotationDataSchema } from '@osdlabel/validation';

// Using a Standard Schema (Valibot)
const validate = createAnnotationValidator(myExtensionSchema);

// Using a type guard function
const validate = createAnnotationValidator(
  (value: unknown): value is MyFields => { /* ... */ }
);
```

---

## getAllAnnotationsFlat

```ts
function getAllAnnotationsFlat(state: AnnotationState): Annotation[];
```

Flatten all annotations from the nested `byImage` store into a single array.

**Example:**

```ts
import { getAllAnnotationsFlat } from '@osdlabel/annotation';

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
