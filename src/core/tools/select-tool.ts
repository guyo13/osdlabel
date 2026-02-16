import { FabricObject } from 'fabric';
import { BaseTool, AnnotatedFabricObject, ToolCallbacks } from './base-tool.js';
import { ImageId, Point } from '../types.js';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';
import { getGeometryFromFabricObject } from '../fabric-utils.js';

interface SelectionEvent {
  readonly selected: FabricObject[];
  readonly e?: Event;
}

interface SelectionClearedEvent {
  readonly deselected: FabricObject[];
  readonly e?: Event;
}

interface ObjectModifiedEvent {
  readonly target: FabricObject;
  readonly e?: Event;
}

export class SelectTool extends BaseTool {
  readonly type = 'select' as const;

  private readonly handleSelectionCreated = (e: SelectionEvent) => this.onSelectionCreated(e);
  private readonly handleSelectionCleared = (e: SelectionClearedEvent) => this.onSelectionCleared(e);
  private readonly handleObjectModified = (e: ObjectModifiedEvent) => this.onObjectModified(e);

  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void {
    super.activate(overlay, imageId, callbacks);
    if (!this.overlay) return;

    this.overlay.canvas.on('selection:created', this.handleSelectionCreated);
    this.overlay.canvas.on('selection:updated', this.handleSelectionCreated);
    this.overlay.canvas.on('selection:cleared', this.handleSelectionCleared);
    this.overlay.canvas.on('object:modified', this.handleObjectModified);
  }

  deactivate(): void {
    if (this.overlay) {
        this.overlay.canvas.off('selection:created', this.handleSelectionCreated);
        this.overlay.canvas.off('selection:updated', this.handleSelectionCreated);
        this.overlay.canvas.off('selection:cleared', this.handleSelectionCleared);
        this.overlay.canvas.off('object:modified', this.handleObjectModified);

        this.overlay.canvas.discardActiveObject();
        this.overlay.canvas.requestRenderAll();
    }
    super.deactivate();
  }

  onPointerDown(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerMove(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {}

  cancel(): void {
      this.overlay?.canvas.discardActiveObject();
      this.overlay?.canvas.requestRenderAll();
  }

  private onSelectionCreated(e: SelectionEvent) {
      if (!this.callbacks) return;
      const selected = e.selected || [];
      if (selected.length === 1) {
          const obj = selected[0] as AnnotatedFabricObject;
          const annotationId = obj.annotationId;
          if (annotationId) {
              this.callbacks.setSelectedAnnotation(annotationId);
          }
      } else {
          this.callbacks.setSelectedAnnotation(null);
      }
  }

  private onSelectionCleared(_e: SelectionClearedEvent) {
      if (!this.callbacks) return;
      this.callbacks.setSelectedAnnotation(null);
  }

  private onObjectModified(e: ObjectModifiedEvent) {
      if (!this.callbacks) return;
      const obj = e.target;
      if (!obj || !this.imageId) return;

      const annotationId = (obj as AnnotatedFabricObject).annotationId;
      if (!annotationId) return;

      const currentAnnotation = this.callbacks.getAnnotation(annotationId, this.imageId);
      if (!currentAnnotation) return;

      const geometry = getGeometryFromFabricObject(obj, currentAnnotation.geometry.type);

      if (geometry) {
          this.callbacks.updateAnnotation(annotationId, this.imageId, {
              geometry: geometry
          });
      }
  }
}
