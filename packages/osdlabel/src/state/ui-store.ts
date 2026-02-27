import { createStore } from 'solid-js/store';
import { UIState } from '../core/types.js';

export function createUIStore() {
  const [state, setState] = createStore<UIState>({
    activeTool: null,
    activeCellIndex: 0,
    gridColumns: 1,
    gridRows: 1,
    gridAssignments: { 0: '' as any }, // Will be set by app logic
    selectedAnnotationId: null,
  });
  return { state, setState };
}
