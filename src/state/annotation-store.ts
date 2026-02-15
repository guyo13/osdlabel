import { createStore } from 'solid-js/store';
import { AnnotationState } from '../core/types';

export function createAnnotationStore() {
  const [state, setState] = createStore<AnnotationState>({
    byImage: {},
  });
  return { state, setState };
}
