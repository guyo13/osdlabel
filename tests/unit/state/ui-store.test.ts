import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createUIStore } from '../../../src/state/ui-store.js';
import { createAnnotationId } from '../../../src/core/types.js';

describe('UI Store', () => {
  it('should initialize with correct default values', () => {
    createRoot((dispose) => {
      const { state } = createUIStore();

      expect(state.activeTool).toBeNull();
      expect(state.activeCellIndex).toBe(0);
      expect(state.gridColumns).toBe(1);
      expect(state.gridRows).toBe(1);
      expect(state.gridAssignments).toEqual({ 0: '' });
      expect(state.selectedAnnotationId).toBeNull();

      dispose();
    });
  });

  it('should allow updating state via setState', () => {
    createRoot((dispose) => {
      const { state, setState } = createUIStore();

      setState('activeTool', 'rectangle');
      expect(state.activeTool).toBe('rectangle');

      setState('activeCellIndex', 2);
      expect(state.activeCellIndex).toBe(2);

      setState('gridColumns', 3);
      expect(state.gridColumns).toBe(3);

      setState('gridRows', 4);
      expect(state.gridRows).toBe(4);

      const annotationId = createAnnotationId('test-id');
      setState('selectedAnnotationId', annotationId);
      expect(state.selectedAnnotationId).toBe(annotationId);

      dispose();
    });
  });
});
