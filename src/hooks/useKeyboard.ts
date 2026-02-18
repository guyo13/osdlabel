import { onMount, onCleanup } from 'solid-js';
import { useAnnotator, ActiveToolKeyHandlerRef } from '../state/annotator-context.js';
import { useConstraints } from './useConstraints.js';
import { KeyboardShortcutMap } from '../core/types.js';
import { MAX_GRID_SIZE } from '../core/constants.js';

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcutMap = {
  selectTool: 'v',
  rectangleTool: 'r',
  circleTool: 'c',
  lineTool: 'l',
  pointTool: 'p',
  pathTool: 'd',
  cancel: 'Escape',
  delete: 'Delete',
  deleteAlt: 'Backspace',
  gridCell1: '1',
  gridCell2: '2',
  gridCell3: '3',
  gridCell4: '4',
  gridCell5: '5',
  gridCell6: '6',
  gridCell7: '7',
  gridCell8: '8',
  gridCell9: '9',
  increaseGridColumns: '=',
  decreaseGridColumns: '-',
  pathFinish: 'Enter',
  pathClose: 'c',
  pathCancel: 'Escape',
} as const;

export function useKeyboard(
  shortcuts: KeyboardShortcutMap,
  activeToolKeyHandlerRef: ActiveToolKeyHandlerRef,
  shouldSkipTargetPredicate?: (target: HTMLElement) => boolean
) {
  const { actions, uiState } = useAnnotator();
  const { isToolEnabled } = useConstraints();

  const handleKeyDown = (e: KeyboardEvent) => {
    // Suppress shortcuts if typing in input/textarea/contenteditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      shouldSkipTargetPredicate?.(target)
    ) {
      return;
    }

    if (activeToolKeyHandlerRef.handler) {
      const consumed = activeToolKeyHandlerRef.handler(e);
      if (consumed) return;
    }

    const key = e.key;
    const keyLower = key.toLowerCase();

    // Tools
    if (keyLower === shortcuts.selectTool.toLowerCase()) {
      actions.setActiveTool('select');
    } else if (keyLower === shortcuts.rectangleTool.toLowerCase()) {
      if (isToolEnabled('rectangle')) actions.setActiveTool('rectangle');
    } else if (keyLower === shortcuts.circleTool.toLowerCase()) {
      if (isToolEnabled('circle')) actions.setActiveTool('circle');
    } else if (keyLower === shortcuts.lineTool.toLowerCase()) {
      if (isToolEnabled('line')) actions.setActiveTool('line');
    } else if (keyLower === shortcuts.pointTool.toLowerCase()) {
      if (isToolEnabled('point')) actions.setActiveTool('point');
    } else if (keyLower === shortcuts.pathTool.toLowerCase()) {
      if (isToolEnabled('path')) actions.setActiveTool('path');
    }

    // Cancel / Escape
    else if (key === shortcuts.cancel) {
      if (uiState.selectedAnnotationId !== null) {
        actions.setSelectedAnnotation(null);
      } else {
        actions.setActiveTool(null);
      }
    }

    // Delete
    else if (key === shortcuts.delete || key === shortcuts.deleteAlt) {
      const activeImageId = uiState.gridAssignments[uiState.activeCellIndex];
      if (uiState.selectedAnnotationId && activeImageId) {
        actions.deleteAnnotation(uiState.selectedAnnotationId, activeImageId);
        actions.setSelectedAnnotation(null);
      }
    }

    // Grid Cells
    else if (key === shortcuts.gridCell1) actions.setActiveCell(0);
    else if (key === shortcuts.gridCell2) actions.setActiveCell(1);
    else if (key === shortcuts.gridCell3) actions.setActiveCell(2);
    else if (key === shortcuts.gridCell4) actions.setActiveCell(3);
    else if (key === shortcuts.gridCell5) actions.setActiveCell(4);
    else if (key === shortcuts.gridCell6) actions.setActiveCell(5);
    else if (key === shortcuts.gridCell7) actions.setActiveCell(6);
    else if (key === shortcuts.gridCell8) actions.setActiveCell(7);
    else if (key === shortcuts.gridCell9) actions.setActiveCell(8);

    // Grid Columns
    else if (key === shortcuts.increaseGridColumns || (shortcuts.increaseGridColumns === '=' && key === '+')) {
      const maxCols = MAX_GRID_SIZE.columns;
      if (uiState.gridColumns < maxCols) {
        actions.setGridDimensions(uiState.gridColumns + 1, uiState.gridRows);
      }
    } else if (key === shortcuts.decreaseGridColumns) {
      if (uiState.gridColumns > 1) {
        actions.setGridDimensions(uiState.gridColumns - 1, uiState.gridRows);
      }
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
}
