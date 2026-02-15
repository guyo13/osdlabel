import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectTool } from '../../../src/core/tools/select-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { createImageId, createAnnotationContextId } from '../../../src/core/types.js';

describe('SelectTool', () => {
  let tool: SelectTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: any;
  const imageId = createImageId('test-image-select');

  beforeEach(() => {
    vi.clearAllMocks();

    mockCanvas = {
      on: vi.fn(),
      off: vi.fn(),
      discardActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
      getActiveObject: vi.fn(),
      remove: vi.fn(),
    };

    mockOverlay = {
      canvas: mockCanvas,
    } as unknown as FabricOverlay;

    tool = new SelectTool();
  });

  it('should attach event listeners on activate', () => {
    tool.activate(mockOverlay, imageId);
    expect(mockCanvas.on).toHaveBeenCalledWith('selection:created', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('selection:cleared', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('object:modified', expect.any(Function));
  });

  it('should detach event listeners on deactivate', () => {
    tool.activate(mockOverlay, imageId);
    tool.deactivate();
    expect(mockCanvas.off).toHaveBeenCalledWith('selection:created', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('selection:cleared', expect.any(Function));
    expect(mockCanvas.off).toHaveBeenCalledWith('object:modified', expect.any(Function));
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
  });
});
