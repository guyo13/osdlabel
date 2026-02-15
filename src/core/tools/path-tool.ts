import { Polyline } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { actions, contextState } from '../../state/store.js';
import { AnnotationType, Point, AnnotationStyle } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';

export class PathTool extends BaseTool {
  readonly type: AnnotationType = 'path';
  private preview: Polyline | null = null;

  onPointerDown(event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    // Handle double click to finish
    if (event.detail === 2) {
        this.finish();
        return;
    }

    if (!this.preview) {
        // Start new path
        // First point is the start. Second point is the rubber band end (initially same as start).
        this.preview = new Polyline([imagePoint, { ...imagePoint }], {
            fill: 'transparent',
            stroke: 'rgba(0,0,0,0.5)',
            strokeWidth: 2 / this.overlay.canvas.getZoom(),
            strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
            selectable: false,
            evented: false,
            objectCaching: false,
        });
        this.overlay.canvas.add(this.preview);
    } else {
        // Add point
        // The last point in current points array is the one being moved by onPointerMove.
        // We want to "commit" that position and add a NEW last point for the next segment.
        const points = this.preview.points || [];
        points.push({ ...imagePoint });

        // Force update points
        this.preview.set({ points: [...points] });
    }

    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview) return;

    const points = this.preview.points;
    if (!points || points.length === 0) return;

    // Update last point (rubber band end)
    const lastPoint = points[points.length - 1];
    if (lastPoint) {
      lastPoint.x = imagePoint.x;
      lastPoint.y = imagePoint.y;
    }

    this.preview.set({ dirty: true });
    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    // No-op
  }

  onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Enter') {
          this.finish();
      } else if (event.key === 'Escape') {
          this.cancel();
      }
  }

  private finish() {
      if (!this.overlay || !this.preview || !this.imageId) {
          this.cancel();
          return;
      }

      const points = this.preview.points || [];
      if (points.length < 2) {
          this.cancel();
          return;
      }

      const activeContextId = contextState.activeContextId;
      if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        this.cancel();
        return;
      }

      const activeContext = contextState.contexts.find(c => c.id === activeContextId);
      const toolConstraint = activeContext?.tools.find(t => t.type === this.type);

      const style: AnnotationStyle = {
        ...DEFAULT_ANNOTATION_STYLE,
        ...toolConstraint?.defaultStyle,
      };

      const annotation = createAnnotationFromFabricObject(
        this.preview,
        this.imageId,
        activeContextId,
        style,
        this.type
      );

      this.overlay.canvas.remove(this.preview);
      this.preview = null;
      this.overlay.canvas.requestRenderAll();

      if (annotation) {
        actions.addAnnotation(annotation);
      }
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.preview = null;
  }
}
