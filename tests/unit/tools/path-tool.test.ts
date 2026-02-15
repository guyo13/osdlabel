import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathTool } from '../../../src/core/tools/path-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { actions, contextState, annotationState } from '../../../src/state/store.js';
import { createAnnotationContextId, createImageId, ImageId, AnnotationContextId } from '../../../src/core/types.js';
import { Polyline } from 'fabric';

describe('PathTool', () => {
  let tool: PathTool;
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
        { type: 'path' }
      ]
    }]);
    actions.setActiveContext(contextId);
  });

  it('should start a preview path on first pointer down', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    expect(mockCanvas.add).toHaveBeenCalled();
    const addedObj = mockCanvas.add.mock.calls[0][0];
    expect(addedObj).toBeInstanceOf(Polyline);
    // Should have 2 points: start and current pointer
    expect(addedObj.points.length).toBe(2);
    expect(addedObj.points[0]).toEqual({ x: 10, y: 10 });
    expect(addedObj.points[1]).toEqual({ x: 10, y: 10 });
  });

  it('should update the last point on pointer move', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    expect(preview.points[1]).toEqual({ x: 50, y: 50 });
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should add a new segment on subsequent pointer down', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId);

    // First click
    const event1 = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event1, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    // Move
    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    // Second click (adds point at 50,50 and starts new segment)
    const event2 = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event2, { x: 50, y: 50 });

    expect(preview.points.length).toBe(3);
    expect(preview.points[0]).toEqual({ x: 10, y: 10 });
    expect(preview.points[1]).toEqual({ x: 50, y: 50 });
    expect(preview.points[2]).toEqual({ x: 50, y: 50 }); // New segment start
  });

  it('should finish path on double click', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId);

    // Start
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });

    // Move and Click
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });

    // Double click to finish
    tool.onPointerDown({ type: 'pointerdown', detail: 2 } as PointerEvent, { x: 50, y: 50 });

    const imageAnns = annotationState.byImage[imageId];
    expect(imageAnns).toBeDefined();

    const keys = Object.keys(imageAnns);
    const ann = imageAnns[keys[keys.length - 1]];

    expect(ann.geometry.type).toBe('path');
    if (ann.geometry.type === 'path') {
        expect(ann.geometry.points.length).toBe(3); // 10,10 -> 50,50 -> 50,50 (double click adds one last point usually, depends on implementation details, checking logic)
        // Actually, let's trace:
        // 1. Click 10,10 -> points: [{10,10}, {10,10}]
        // 2. Move 50,50 -> points: [{10,10}, {50,50}]
        // 3. Click 50,50 -> points: [{10,10}, {50,50}, {50,50}]
        // 4. Double click -> finish.
        // So geometry points should be what was in preview.
        expect(ann.geometry.points[0]).toEqual({ x: 10, y: 10 });
        expect(ann.geometry.points[1]).toEqual({ x: 50, y: 50 });
    }

    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should finish path on Enter key', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });

    tool.onKeyDown({ key: 'Enter' } as KeyboardEvent);

    const imageAnns = annotationState.byImage[imageId];
    const keys = Object.keys(imageAnns);
    expect(keys.length).toBeGreaterThan(0);
    expect(mockCanvas.remove).toHaveBeenCalled();
  });
});
