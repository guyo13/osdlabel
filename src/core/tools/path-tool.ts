import { Polyline } from 'fabric';
import { BaseTool } from './base-tool.js';
import { AnnotationType, Point, AnnotationStyle, createAnnotationId } from '../types.js';
import { DEFAULT_ANNOTATION_STYLE } from '../constants.js';
import { generateId } from '../../utils/id.js';

/** Distance in image-space pixels to snap-close to the first point */
const CLOSE_THRESHOLD_SCREEN_PX = 10;

export class PathTool extends BaseTool {
  readonly type: AnnotationType = 'path';
  private preview: Polyline | null = null;
  /** Committed vertices (does not include the live cursor point) */
  private vertices: Point[] = [];

  onPointerDown(event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    // Handle double click to finish as open polyline
    if (event.detail === 2) {
        this.finish(false);
        return;
    }

    if (this.vertices.length === 0) {
        // First point — start a new path
        this.vertices.push({ x: imagePoint.x, y: imagePoint.y });

        this.preview = new Polyline(
            [{ x: imagePoint.x, y: imagePoint.y }, { x: imagePoint.x, y: imagePoint.y }],
            {
                fill: 'transparent',
                stroke: 'rgba(0,0,0,0.5)',
                strokeWidth: 2 / this.overlay.canvas.getZoom(),
                strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
                selectable: false,
                evented: false,
                objectCaching: false,
            },
        );
        this.overlay.canvas.add(this.preview);
    } else {
        // Check if clicking near the first point to close
        if (this.vertices.length >= 3 && this.isNearFirstPoint(imagePoint)) {
            this.finish(true);
            return;
        }

        // Add new vertex
        this.vertices.push({ x: imagePoint.x, y: imagePoint.y });

        // Update preview: all committed vertices + a live cursor point
        if (this.preview) {
            const previewPoints = [
                ...this.vertices.map(p => ({ x: p.x, y: p.y })),
                { x: imagePoint.x, y: imagePoint.y },
            ];
            this.preview.set({ points: previewPoints });
        }
    }

    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview || this.vertices.length === 0) return;

    // Update the last (live cursor) point in the preview
    const previewPoints = [
        ...this.vertices.map(p => ({ x: p.x, y: p.y })),
        { x: imagePoint.x, y: imagePoint.y },
    ];
    this.preview.set({ points: previewPoints, dirty: true });
    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    // No-op — path tool uses click (not drag) to add points
  }

  onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Enter') {
          this.finish(false);
      } else if (event.key === 'c' || event.key === 'C') {
          // Close the path and finish
          if (this.vertices.length >= 3) {
              this.finish(true);
          }
      } else if (event.key === 'Escape') {
          this.cancel();
      }
  }

  private isNearFirstPoint(imagePoint: Point): boolean {
      if (this.vertices.length === 0 || !this.overlay) return false;
      const first = this.vertices[0]!;

      // Convert both points to screen space to get a zoom-independent threshold
      const firstScreen = this.overlay.imageToScreen(first);
      const currentScreen = this.overlay.imageToScreen(imagePoint);

      const dx = currentScreen.x - firstScreen.x;
      const dy = currentScreen.y - firstScreen.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      return dist < CLOSE_THRESHOLD_SCREEN_PX;
  }

  private finish(closed: boolean) {
      if (!this.overlay || !this.imageId || !this.callbacks) {
          this.cancel();
          return;
      }

      // Need at least 2 points for an open path, 3 for a closed polygon
      const minPoints = closed ? 3 : 2;
      if (this.vertices.length < minPoints) {
          this.cancel();
          return;
      }

      const activeContextId = this.callbacks.getActiveContextId();
      if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        this.cancel();
        return;
      }

      if (!this.callbacks.canAddAnnotation(this.type)) {
        this.cancel();
        return;
      }

      const toolConstraint = this.callbacks.getToolConstraint(this.type);

      const style: AnnotationStyle = {
        ...DEFAULT_ANNOTATION_STYLE,
        ...toolConstraint?.defaultStyle,
      };

      // Build geometry directly from tracked vertices (not from the Fabric preview object)
      const annotation = {
        id: createAnnotationId(generateId()),
        imageId: this.imageId,
        contextId: activeContextId,
        geometry: {
          type: 'path' as const,
          points: this.vertices.map(p => ({ x: p.x, y: p.y })),
          closed,
        },
        style,
      };

      // Clean up preview
      if (this.preview) {
          this.overlay.canvas.remove(this.preview);
      }
      this.preview = null;
      this.vertices = [];
      this.overlay.canvas.requestRenderAll();

      this.callbacks.addAnnotation(annotation);
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.preview = null;
    this.vertices = [];
  }
}
