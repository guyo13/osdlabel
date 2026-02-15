import { createStore } from 'solid-js/store';
import { UIState } from '../core/types';

export function createUIStore() {
  const [state, setState] = createStore<UIState>({
    activeTool: null,
    activeCellIndex: 0,
    gridColumns: 1,
    gridRows: 1,
    gridAssignments: {},
    selectedAnnotationId: null,
  });
  return { state, setState };
}
