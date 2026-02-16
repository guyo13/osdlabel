import { describe, it, expect } from 'vitest';
import { createRoot } from 'solid-js';
import { createAnnotationStore } from '../../../src/state/annotation-store';
import { createUIStore } from '../../../src/state/ui-store';
import { createContextStore, createConstraintStatus } from '../../../src/state/context-store';
import { createActions } from '../../../src/state/actions';
import {
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
  AnnotationContext,
} from '../../../src/core/types';

describe('Constraint Enforcement', () => {
  function createTestStore() {
    return createRoot((dispose) => {
      const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
      const { state: uiState, setState: setUIState } = createUIStore();
      const { state: contextState, setState: setContextState } = createContextStore();

      const actions = createActions(setAnnotationState, setUIState, setContextState);
      const constraintStatus = createConstraintStatus(contextState, annotationState);

      return { annotationState, uiState, contextState, actions, constraintStatus, dispose };
    });
  }

  const imageId = createImageId('img1');
  const contextId1 = createAnnotationContextId('ctx1');
  const contextId2 = createAnnotationContextId('ctx2');

  const context1: AnnotationContext = {
    id: contextId1,
    label: 'Context 1',
    tools: [
      { type: 'rectangle', maxCount: 2 },
      { type: 'circle' }, // unlimited
    ],
  };

  const context2: AnnotationContext = {
    id: contextId2,
    label: 'Context 2',
    tools: [
      { type: 'line', maxCount: 1 },
      { type: 'path', maxCount: 3 },
    ],
  };

  const baseStyle = {
    strokeColor: 'red',
    strokeWidth: 1,
    fillColor: 'none',
    fillOpacity: 0,
    opacity: 1,
  };

  it('should disable tool when maxCount is reached', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context1]);
    actions.setActiveContext(contextId1);

    // Initially enabled
    let status = constraintStatus();
    expect(status.rectangle.enabled).toBe(true);
    expect(status.rectangle.currentCount).toBe(0);
    expect(status.rectangle.maxCount).toBe(2);

    // Add first rectangle
    actions.addAnnotation({
      id: createAnnotationId('r1'),
      imageId,
      contextId: contextId1,
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
      style: baseStyle,
    });

    status = constraintStatus();
    expect(status.rectangle.enabled).toBe(true);
    expect(status.rectangle.currentCount).toBe(1);

    // Add second rectangle — reaches limit
    actions.addAnnotation({
      id: createAnnotationId('r2'),
      imageId,
      contextId: contextId1,
      geometry: { type: 'rectangle', origin: { x: 20, y: 20 }, width: 10, height: 10, rotation: 0 },
      style: baseStyle,
    });

    status = constraintStatus();
    expect(status.rectangle.enabled).toBe(false);
    expect(status.rectangle.currentCount).toBe(2);

    dispose();
  });

  it('should re-enable tool when annotation is deleted', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context1]);
    actions.setActiveContext(contextId1);

    // Add 2 rectangles
    actions.addAnnotation({
      id: createAnnotationId('r1'),
      imageId,
      contextId: contextId1,
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
      style: baseStyle,
    });
    actions.addAnnotation({
      id: createAnnotationId('r2'),
      imageId,
      contextId: contextId1,
      geometry: { type: 'rectangle', origin: { x: 20, y: 20 }, width: 10, height: 10, rotation: 0 },
      style: baseStyle,
    });

    let status = constraintStatus();
    expect(status.rectangle.enabled).toBe(false);

    // Delete one
    actions.deleteAnnotation(createAnnotationId('r1'), imageId);

    status = constraintStatus();
    expect(status.rectangle.enabled).toBe(true);
    expect(status.rectangle.currentCount).toBe(1);

    dispose();
  });

  it('should update tool availability when switching contexts', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context1, context2]);
    actions.setActiveContext(contextId1);

    let status = constraintStatus();
    // Context 1 has rectangle and circle
    expect(status.rectangle.enabled).toBe(true);
    expect(status.circle.enabled).toBe(true);
    // Context 1 does NOT have line or path
    expect(status.line.enabled).toBe(false);
    expect(status.path.enabled).toBe(false);

    // Switch to context 2
    actions.setActiveContext(contextId2);

    status = constraintStatus();
    // Context 2 has line and path
    expect(status.line.enabled).toBe(true);
    expect(status.path.enabled).toBe(true);
    // Context 2 does NOT have rectangle or circle
    expect(status.rectangle.enabled).toBe(false);
    expect(status.circle.enabled).toBe(false);

    dispose();
  });

  it('should never disable unlimited tools (no maxCount)', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context1]);
    actions.setActiveContext(contextId1);

    // Circle is unlimited
    let status = constraintStatus();
    expect(status.circle.enabled).toBe(true);
    expect(status.circle.maxCount).toBeNull();

    // Add many circles
    for (let i = 0; i < 100; i++) {
      actions.addAnnotation({
        id: createAnnotationId(`c${i}`),
        imageId,
        contextId: contextId1,
        geometry: { type: 'circle', center: { x: i * 10, y: 0 }, radius: 5 },
        style: baseStyle,
      });
    }

    status = constraintStatus();
    expect(status.circle.enabled).toBe(true);
    expect(status.circle.currentCount).toBe(100);

    dispose();
  });

  it('should disable all tools when no context is active', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context1]);
    actions.setActiveContext(null);

    const status = constraintStatus();
    expect(status.rectangle.enabled).toBe(false);
    expect(status.circle.enabled).toBe(false);
    expect(status.line.enabled).toBe(false);
    expect(status.point.enabled).toBe(false);
    expect(status.path.enabled).toBe(false);

    dispose();
  });

  it('should count annotations per-context correctly', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context1, context2]);
    actions.setActiveContext(contextId1);

    // Add a rectangle in context1
    actions.addAnnotation({
      id: createAnnotationId('r1'),
      imageId,
      contextId: contextId1,
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
      style: baseStyle,
    });

    // Add a line in context2 (should not affect context1's counts)
    actions.addAnnotation({
      id: createAnnotationId('l1'),
      imageId,
      contextId: contextId2,
      geometry: { type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
      style: baseStyle,
    });

    let status = constraintStatus();
    expect(status.rectangle.currentCount).toBe(1);

    // Switch to context2
    actions.setActiveContext(contextId2);
    status = constraintStatus();
    expect(status.line.currentCount).toBe(1);
    expect(status.line.maxCount).toBe(1);
    expect(status.line.enabled).toBe(false);

    dispose();
  });

  it('should gate tool creation via canAddAnnotation callback pattern', () => {
    const { actions, constraintStatus, dispose } = createTestStore();

    actions.setContexts([context2]);
    actions.setActiveContext(contextId2);

    // Simulate the canAddAnnotation check that tools perform
    const canAddLine = () => constraintStatus().line.enabled;

    expect(canAddLine()).toBe(true);

    // Add 1 line (max is 1)
    actions.addAnnotation({
      id: createAnnotationId('l1'),
      imageId,
      contextId: contextId2,
      geometry: { type: 'line', start: { x: 0, y: 0 }, end: { x: 10, y: 10 } },
      style: baseStyle,
    });

    expect(canAddLine()).toBe(false);

    dispose();
  });
});
