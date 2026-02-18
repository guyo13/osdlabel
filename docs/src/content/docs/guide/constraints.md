---
title: Constraints
description: Understanding the annotation constraint system.
---

# Constraint System

OSDLabel features a powerful constraint system to define allowed annotation types and limits per context. This is particularly useful for medical imaging where specific pathologies (e.g., "Fracture") might only allow certain shapes (e.g., "Line", "Rectangle") and a maximum number of annotations (e.g., 3).

## Key Concepts

- **Context:** Represents a specific annotation task or pathology. Only one context is active at a time.
- **Tool Constraint:** Defines which tools are available for a given context and their usage limits.

## Configuration

Constraints are defined via the `contexts` prop.

```typescript
import { AnnotationContext } from 'osdlabel/dist/core/types';

const CONTEXTS: AnnotationContext[] = [
  {
    id: 'ctx-1',
    label: 'Fracture',
    tools: [
      { type: 'line', maxCount: 3 }, // Max 3 lines
      { type: 'rectangle', maxCount: 2 }, // Max 2 rectangles
    ],
  },
  {
    id: 'ctx-2',
    label: 'Pneumothorax',
    tools: [
      { type: 'path', maxCount: 2 }, // Max 2 paths
      { type: 'circle', maxCount: 1 }, // Max 1 circle
    ],
  },
];
```

## Behavior

- **Tool Availability:** When a limit is reached for a specific tool in the active context, the tool button is automatically disabled.
- **Auto-Switching:** If the active tool reaches its limit during usage, the system switches back to the select tool.
- **Deletion:** Deleting an annotation re-enables the corresponding tool if the count drops below the limit.
- **Context Switching:** Switching contexts updates available tools and resets the UI to match the new context's constraints.
