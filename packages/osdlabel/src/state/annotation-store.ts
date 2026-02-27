import { createStore } from 'solid-js/store';
import { AnnotationState } from '../core/types.js';

export function createAnnotationStore() {
  const [state, setState] = createStore<AnnotationState>({
    byImage: {},
    version: 0,
  });
  return { state, setState };
}
