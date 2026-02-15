import { BaseTool, createAnnotationFromFabricObject, ToolCallbacks } from './base-tool.js';
import { AnnotationType, Point, AnnotationId } from '../types.js';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';
import { ImageId } from '../types.js';
import { FabricObject } from 'fabric';

export interface FabricAnnotationObject extends FabricObject {
    annotationId?: AnnotationId;
    annotationType?: AnnotationType;
}

export class SelectTool extends BaseTool {
  readonly type: AnnotationType | 'select' = 'select';

  private onSelectionCreatedBind = this.onSelectionCreated.bind(this);
  private onSelectionUpdatedBind = this.onSelectionUpdated.bind(this);
  private onSelectionClearedBind = this.onSelectionCleared.bind(this);
  private onObjectModifiedBind = this.onObjectModified.bind(this);

  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void {
      super.activate(overlay, imageId, callbacks);
      if (!this.overlay) return;

      this.overlay.canvas.selection = true;
      this.overlay.canvas.defaultCursor = 'default';
      this.overlay.canvas.hoverCursor = 'move';

      this.overlay.canvas.getObjects().forEach((obj) => {
          obj.set({
              selectable: true,
              evented: true,
              hoverCursor: 'move',
          });
      });

      this.overlay.canvas.on('selection:created', this.onSelectionCreatedBind);
      this.overlay.canvas.on('selection:updated', this.onSelectionUpdatedBind);
      this.overlay.canvas.on('selection:cleared', this.onSelectionClearedBind);
      this.overlay.canvas.on('object:modified', this.onObjectModifiedBind);
  }

  deactivate(): void {
      if (this.overlay) {
          this.overlay.canvas.selection = false;
          this.overlay.canvas.defaultCursor = 'crosshair';

          this.overlay.canvas.getObjects().forEach((obj) => {
              obj.set({
                  selectable: false,
                  evented: false,
              });
          });

          this.overlay.canvas.off('selection:created', this.onSelectionCreatedBind);
          this.overlay.canvas.off('selection:updated', this.onSelectionUpdatedBind);
          this.overlay.canvas.off('selection:cleared', this.onSelectionClearedBind);
          this.overlay.canvas.off('object:modified', this.onObjectModifiedBind);

          this.overlay.canvas.discardActiveObject();
          this.overlay.canvas.requestRenderAll();
      }
      super.deactivate();
  }

  onPointerDown(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerMove(_event: PointerEvent, _imagePoint: Point): void {}
  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {}

  onKeyDown(event: KeyboardEvent): void {
      if ((event.key === 'Delete' || event.key === 'Backspace') && this.overlay) {
          const activeObjects = this.overlay.canvas.getActiveObjects() as FabricAnnotationObject[];
          if (activeObjects.length > 0 && this.callbacks) {
              activeObjects.forEach(obj => {
                  if (obj.annotationId) {
                      this.callbacks?.deleteAnnotation(obj.annotationId);
                  }
                  this.overlay?.canvas.remove(obj);
              });
              this.overlay.canvas.discardActiveObject();
              this.overlay.canvas.requestRenderAll();
          }
      }
  }

  cancel(): void {
      if (this.overlay) {
          this.overlay.canvas.discardActiveObject();
          this.overlay.canvas.requestRenderAll();
      }
  }

  // Fabric v6+ event types are a bit complex with generics.
  // We use simpler typing here compatible with TEventCallback
  private onSelectionCreated(_e: any) {
  }

  private onSelectionUpdated(_e: any) {
  }

  private onSelectionCleared(_e: any) {
  }

  private onObjectModified(e: any) {
      if (!this.overlay || !this.imageId || !this.callbacks) return;

      const target = e.target as FabricAnnotationObject;
      if (!target || !target.annotationId) return;

      const activeContextId = this.callbacks.getActiveContextId();
      if (!activeContextId) return;

      let type: AnnotationType | undefined = target.annotationType;

      if (!type) {
        if (target.type === 'rect') type = 'rectangle';
        else if (target.type === 'circle') type = 'circle';
        else if (target.type === 'line') type = 'line';
        else if (target.type === 'polyline') type = 'path';
      }

      if (!type) {
           return;
      }

      const dummyStyle = this.callbacks.getAnnotationStyle(type);

      const annotation = createAnnotationFromFabricObject(
          target,
          this.imageId,
          activeContextId,
          dummyStyle,
          type
      );

      if (annotation) {
          this.callbacks.updateAnnotation(target.annotationId, { geometry: annotation.geometry });
      }
  }
}
