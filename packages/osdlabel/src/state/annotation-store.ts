import { createStore } from 'solid-js/store';
import { AnnotationState } from '../core/types.js';

export function createAnnotationStore() {
  const [state, setState] = createStore<AnnotationState>({
    byImage: {},
    reloadGeneration: 0,
    version: 0,
  });
  return { state, setState };
}
