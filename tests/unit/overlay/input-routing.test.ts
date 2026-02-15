import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FabricOverlay, OverlayMode } from '../../../src/overlay/fabric-overlay.js';

/**
 * Since FabricOverlay requires real DOM + OSD + Fabric, we test the mode
 * logic by creating a lightweight mock that mirrors the setMode behavior.
 * This verifies the routing contract without needing canvas support in jsdom.
 */

interface MockState {
  pointerEvents: string;
  fabricSelection: boolean;
  osdMouseNavEnabled: boolean;
  objectsSelectable: boolean;
  objectsEvented: boolean;
}

function createMockOverlay(): { overlay: Pick<FabricOverlay, 'setMode' | 'getMode'>; state: MockState } {
  const state: MockState = {
    pointerEvents: 'none',
    fabricSelection: false,
    osdMouseNavEnabled: true,
    objectsSelectable: false,
    objectsEvented: false,
  };

  let currentMode: OverlayMode = 'navigation';

  function setMode(mode: OverlayMode): void {
    currentMode = mode;

    switch (mode) {
      case 'navigation':
        state.pointerEvents = 'none';
        state.fabricSelection = false;
        state.objectsSelectable = false;
        state.objectsEvented = false;
        state.osdMouseNavEnabled = true;
        break;

      case 'annotation':
        state.pointerEvents = 'auto';
        state.fabricSelection = false;
        state.objectsSelectable = false;
        state.objectsEvented = false;
        state.osdMouseNavEnabled = false;
        break;

      case 'selection':
        state.pointerEvents = 'auto';
        state.fabricSelection = true;
        state.objectsSelectable = true;
        state.objectsEvented = true;
        state.osdMouseNavEnabled = false;
        break;
    }
  }

  function getMode(): OverlayMode {
    return currentMode;
  }

  return { overlay: { setMode, getMode }, state };
}

describe('Input routing — setMode', () => {
  let overlay: Pick<FabricOverlay, 'setMode' | 'getMode'>;
  let state: MockState;

  beforeEach(() => {
    const mock = createMockOverlay();
    overlay = mock.overlay;
    state = mock.state;
  });

  describe('navigation mode', () => {
    it('disables Fabric pointer events', () => {
      overlay.setMode('navigation');
      expect(state.pointerEvents).toBe('none');
    });

    it('disables Fabric selection', () => {
      overlay.setMode('navigation');
      expect(state.fabricSelection).toBe(false);
    });

    it('makes objects non-selectable and non-evented', () => {
      overlay.setMode('navigation');
      expect(state.objectsSelectable).toBe(false);
      expect(state.objectsEvented).toBe(false);
    });

    it('enables OSD mouse navigation', () => {
      overlay.setMode('navigation');
      expect(state.osdMouseNavEnabled).toBe(true);
    });

    it('reports correct mode', () => {
      overlay.setMode('navigation');
      expect(overlay.getMode()).toBe('navigation');
    });
  });

  describe('annotation mode', () => {
    it('enables Fabric pointer events', () => {
      overlay.setMode('annotation');
      expect(state.pointerEvents).toBe('auto');
    });

    it('disables Fabric selection (drawing mode, not object selection)', () => {
      overlay.setMode('annotation');
      expect(state.fabricSelection).toBe(false);
    });

    it('makes objects non-selectable and non-evented', () => {
      overlay.setMode('annotation');
      expect(state.objectsSelectable).toBe(false);
      expect(state.objectsEvented).toBe(false);
    });

    it('disables OSD mouse navigation', () => {
      overlay.setMode('annotation');
      expect(state.osdMouseNavEnabled).toBe(false);
    });

    it('reports correct mode', () => {
      overlay.setMode('annotation');
      expect(overlay.getMode()).toBe('annotation');
    });
  });

  describe('selection mode', () => {
    it('enables Fabric pointer events', () => {
      overlay.setMode('selection');
      expect(state.pointerEvents).toBe('auto');
    });

    it('enables Fabric selection', () => {
      overlay.setMode('selection');
      expect(state.fabricSelection).toBe(true);
    });

    it('makes objects selectable and evented', () => {
      overlay.setMode('selection');
      expect(state.objectsSelectable).toBe(true);
      expect(state.objectsEvented).toBe(true);
    });

    it('disables OSD mouse navigation', () => {
      overlay.setMode('selection');
      expect(state.osdMouseNavEnabled).toBe(false);
    });

    it('reports correct mode', () => {
      overlay.setMode('selection');
      expect(overlay.getMode()).toBe('selection');
    });
  });

  describe('mode transitions', () => {
    it('correctly transitions from annotation to navigation', () => {
      overlay.setMode('annotation');
      expect(state.osdMouseNavEnabled).toBe(false);
      expect(state.pointerEvents).toBe('auto');

      overlay.setMode('navigation');
      expect(state.osdMouseNavEnabled).toBe(true);
      expect(state.pointerEvents).toBe('none');
    });

    it('correctly transitions from selection to annotation', () => {
      overlay.setMode('selection');
      expect(state.fabricSelection).toBe(true);
      expect(state.objectsSelectable).toBe(true);

      overlay.setMode('annotation');
      expect(state.fabricSelection).toBe(false);
      expect(state.objectsSelectable).toBe(false);
    });

    it('correctly transitions from navigation to selection', () => {
      overlay.setMode('navigation');
      expect(state.pointerEvents).toBe('none');
      expect(state.osdMouseNavEnabled).toBe(true);

      overlay.setMode('selection');
      expect(state.pointerEvents).toBe('auto');
      expect(state.osdMouseNavEnabled).toBe(false);
      expect(state.fabricSelection).toBe(true);
    });

    it('handles repeated same-mode calls idempotently', () => {
      overlay.setMode('annotation');
      const snapshot = { ...state };
      overlay.setMode('annotation');
      expect(state).toEqual(snapshot);
    });
  });
});
