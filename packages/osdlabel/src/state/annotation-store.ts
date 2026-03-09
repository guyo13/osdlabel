import { createStore } from 'solid-js/store';
import type { AnnotationState } from '../core/types.js';

export function createAnnotationStore() {
  const [state, setState] = createStore<AnnotationState>({
    byImage: {},
    viewTransforms: {},
    changeCounter: 0,
  });
  return { state, setState };
}
