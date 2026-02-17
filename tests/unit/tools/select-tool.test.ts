import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectTool } from '../../../src/core/tools/select-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { createImageId, createAnnotationContextId, createAnnotationId, Annotation } from '../../../src/core/types.js';
import { FabricObject } from 'fabric';

describe('SelectTool', () => {
  let tool: SelectTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    discardActiveObject: ReturnType<typeof vi.fn>;
    requestRenderAll: ReturnType<typeof vi.fn>;
    getActiveObject: ReturnType<typeof vi.fn>;
    getActiveObjects: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let mockCallbacks: ToolCallbacks;
  let capturedHandlers: Record<string, (...args: unknown[]) => void>;
  const imageId = createImageId('test-image-select');
  const contextId = createAnnotationContextId('test-context');

  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandlers = {};

    mockCanvas = {
      on: vi.fn().mockImplementation((eventName: string, handler: (...args: unknown[]) => void) => {
        capturedHandlers[eventName] = handler;
      }),
      off: vi.fn(),
      discardActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
      getActiveObject: vi.fn(),
      getActiveObjects: vi.fn().mockReturnValue([]),
      remove: vi.fn(),
    };

    mockOverlay = {
      canvas: mockCanvas,
    } as unknown as FabricOverlay;

    mockCallbacks = {
      getActiveContextId: () => contextId,
      getToolConstraint: (type) => ({ type }),
      canAddAnnotation: () => true,
      addAnnotation: vi.fn(),
      updateAnnotation: vi.fn(),
      deleteAnnotation: vi.fn(),
      setSelectedAnnotation: vi.fn(),
      getAnnotation: vi.fn().mockReturnValue(undefined),
    };

    tool = new SelectTool();
  });

  it('should attach event listeners on activate', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);
    expect(mockCanvas.on).toHaveBeenCalledWith('selection:created', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('selection:cleared', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('object:modified', expect.any(Function));
  });

  it('should detach event listeners on deactivate', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);
    tool.deactivate();
    expect(mockCanvas.off).toHaveBeenCalledWith('selection:created', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('selection:cleared', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('object:modified', expect.any(Function));
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
  });

  it('should trigger setSelectedAnnotation on selection:created with single object', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const annId = createAnnotationId('ann-1');
    const mockObj = { id: annId } as unknown as FabricObject;

    capturedHandlers['selection:created']({ selected: [mockObj] });

    expect(mockCallbacks.setSelectedAnnotation).toHaveBeenCalledWith(annId);
  });

  it('should trigger setSelectedAnnotation(null) on selection:created with multiple objects', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const mockObj1 = { id: createAnnotationId('ann-1') } as unknown as FabricObject;
    const mockObj2 = { id: createAnnotationId('ann-2') } as unknown as FabricObject;

    capturedHandlers['selection:created']({ selected: [mockObj1, mockObj2] });

    expect(mockCallbacks.setSelectedAnnotation).toHaveBeenCalledWith(null);
  });

  it('should trigger setSelectedAnnotation(null) on selection:cleared', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);

    capturedHandlers['selection:cleared']({ deselected: [] });

    expect(mockCallbacks.setSelectedAnnotation).toHaveBeenCalledWith(null);
  });

  it('should trigger updateAnnotation with fabricObject on object:modified', () => {
    const annId = createAnnotationId('ann-1');
    const mockAnnotation: Annotation = {
      id: annId,
      imageId,
      contextId,
      geometry: { type: 'rectangle', origin: { x: 0, y: 0 }, width: 10, height: 10, rotation: 0 },
      rawAnnotationData: { format: 'fabric', data: { type: 'Rect' } },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const getAnnotationMock = vi.fn().mockReturnValue(mockAnnotation);
    const callbacksWithAnnotation: ToolCallbacks = {
      ...mockCallbacks,
      getAnnotation: getAnnotationMock,
    };

    tool.activate(mockOverlay, imageId, callbacksWithAnnotation);

    const mockTarget = { id: annId } as unknown as FabricObject;
    capturedHandlers['object:modified']({ target: mockTarget });

    // updateAnnotation should be called with the fabricObject directly
    expect(callbacksWithAnnotation.updateAnnotation).toHaveBeenCalledWith(annId, imageId, mockTarget);
  });

  it('should trigger deleteAnnotation on Delete key', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const annId = createAnnotationId('ann-1');
    const mockObj = { id: annId, type: 'rect' } as unknown as FabricObject;

    mockCanvas.getActiveObjects.mockReturnValue([mockObj]);

    tool.onKeyDown({ key: 'Delete' } as KeyboardEvent);

    expect(mockCallbacks.deleteAnnotation).toHaveBeenCalledWith(annId, imageId);
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
  });

  it('should trigger deleteAnnotation on Backspace key', () => {
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const annId = createAnnotationId('ann-2');
    const mockObj = { id: annId, type: 'circle' } as unknown as FabricObject;

    mockCanvas.getActiveObjects.mockReturnValue([mockObj]);

    tool.onKeyDown({ key: 'Backspace' } as KeyboardEvent);

    expect(mockCallbacks.deleteAnnotation).toHaveBeenCalledWith(annId, imageId);
  });
});
