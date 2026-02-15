import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointTool } from '../../../src/core/tools/point-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { actions, contextState, annotationState } from '../../../src/state/store.js';
import { createAnnotationContextId, createImageId, ImageId, AnnotationContextId } from '../../../src/core/types.js';

describe('PointTool', () => {
  let tool: PointTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: any;
  const imageId = createImageId('test-image');
  const contextId = createAnnotationContextId('test-context');

  beforeEach(() => {
    vi.clearAllMocks();

    mockCanvas = {
      add: vi.fn(),
      remove: vi.fn(),
      requestRenderAll: vi.fn(),
      getZoom: vi.fn().mockReturnValue(1),
    };

    mockOverlay = {
      canvas: mockCanvas,
    } as unknown as FabricOverlay;

    // Setup store
    actions.setContexts([{
      id: contextId,
      label: 'Test Context',
      tools: [
        { type: 'point' }
      ]
    }]);
    actions.setActiveContext(contextId);
  });

  it('should create annotation on pointer down', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 30, y: 30 });

    const imageAnns = annotationState.byImage[imageId];
    expect(imageAnns).toBeDefined();

    const keys = Object.keys(imageAnns);
    const ann = imageAnns[keys[keys.length - 1]];

    expect(ann.geometry.type).toBe('point');
    if (ann.geometry.type === 'point') {
        expect(ann.geometry.position.x).toBe(30);
        expect(ann.geometry.position.y).toBe(30);
    }

    // PointTool does not add preview
    expect(mockCanvas.add).not.toHaveBeenCalled();
  });

  it('should ignore pointer move', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 30 }); // Should do nothing

    expect(mockCanvas.requestRenderAll).not.toHaveBeenCalled();
  });

  it('should ignore pointer up', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 10, y: 10 }); // Should do nothing
  });
});
