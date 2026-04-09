import { createStore } from 'solid-js/store';
import type { UIState } from '@osdlabel/viewer-api';
import { createInitialUIState } from 'osdlabel';

export function createUIStore() {
  const [state, setState] = createStore<UIState>(createInitialUIState());
  return { state, setState };
}
