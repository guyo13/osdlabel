---
title: Usage
description: How to use OSDLabel.
---

# Usage

## Basic Setup

Wrap your application (or the annotation part of it) with `AnnotatorProvider` and pass the configuration. The `Annotator` component simplifies this setup by wrapping `AnnotatorProvider` for you.

```tsx
import { Annotator } from 'osdlabel';
import type { ImageSource, AnnotationContext } from 'osdlabel/dist/core/types';

// Define available images
const IMAGES: ImageSource[] = [
  {
    id: 'img-1',
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Highsmith',
  },
  {
    id: 'img-2',
    dziUrl: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
    label: 'Duomo',
  },
];

// Define annotation contexts (optional)
const CONTEXTS: AnnotationContext[] = [
  {
    id: 'default',
    label: 'Default',
    tools: [
      { type: 'rectangle' },
      { type: 'circle' },
    ],
  },
];

function App() {
  const handleAnnotationChange = (annotations) => {
    console.log('Annotations updated:', annotations);
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Annotator
        images={IMAGES}
        contexts={CONTEXTS}
        activeContextId="default"
        onAnnotationsChange={handleAnnotationChange}
        showFilmstrip={true}
        maxGridSize={{ columns: 2, rows: 2 }}
      />
    </div>
  );
}

export default App;
```

## Configuring Contexts

Contexts define which tools are available and their limits.

```typescript
const CONTEXTS: AnnotationContext[] = [
  {
    id: 'fracture',
    label: 'Fracture',
    tools: [
      { type: 'line', maxCount: 3 }, // Limit to 3 lines
      { type: 'rectangle', maxCount: 2 }, // Limit to 2 rectangles
    ],
  },
  {
    id: 'general',
    label: 'General',
    tools: [
      { type: 'point' }, // Unlimited points
      { type: 'path' },
    ],
  },
];
```

## Managing State

The `Annotator` component is controlled via props.

- **`images`**: List of DZI sources.
- **`contexts`**: Available annotation contexts.
- **`activeContextId`**: ID of the currently active context.
- **`initialAnnotations`**: Load pre-existing annotations.
- **`onAnnotationsChange`**: Callback when annotations are added, updated, or removed.
