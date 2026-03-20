import { createStore } from 'solid-js/store';
import type { UIState } from '@osdlabel/annotation';

export function createUIStore() {
  const [state, setState] = createStore<UIState>({
    activeTool: null,
    activeCellIndex: 0,
    gridColumns: 1,
    gridRows: 1,
    gridAssignments: {},
    selectedAnnotationId: null,
    cellTransforms: {},
  });
  return { state, setState };
}
