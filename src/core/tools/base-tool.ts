import { Rect, Circle, Line, Polyline, util, FabricObject } from 'fabric';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';
import { Annotation, AnnotationType, Point, Geometry, AnnotationStyle, ImageId, AnnotationContextId, createAnnotationId } from '../types.js';
import { generateId } from '../../utils/id.js';

export interface AnnotationTool {
  /** Tool identifier */
  readonly type: AnnotationType | 'select';

  /** Called when the tool becomes active */
  activate(overlay: FabricOverlay, imageId: ImageId): void;

  /** Called when the tool is deactivated */
  deactivate(): void;

  /** Handle pointer down — start drawing */
  onPointerDown(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer move — update drawing preview */
  onPointerMove(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer up — commit the annotation */
  onPointerUp(event: PointerEvent, imagePoint: Point): void;

  /** Handle key down */
  onKeyDown(event: KeyboardEvent): void;

  /** Cancel the current drawing interaction */
  cancel(): void;
}

export abstract class BaseTool implements AnnotationTool {
  abstract readonly type: AnnotationType | 'select';
  protected overlay: FabricOverlay | null = null;
  protected imageId: ImageId | null = null;

  activate(overlay: FabricOverlay, imageId: ImageId): void {
    this.overlay = overlay;
    this.imageId = imageId;
  }

  deactivate(): void {
    this.overlay = null;
    this.imageId = null;
  }

  abstract onPointerDown(event: PointerEvent, imagePoint: Point): void;
  abstract onPointerMove(event: PointerEvent, imagePoint: Point): void;
  abstract onPointerUp(event: PointerEvent, imagePoint: Point): void;
  onKeyDown(_event: KeyboardEvent): void {} // Optional implementation
  abstract cancel(): void;
}

export function createAnnotationFromFabricObject(
  obj: FabricObject,
  imageId: ImageId,
  contextId: AnnotationContextId,
  style: AnnotationStyle,
  type: AnnotationType
): Annotation | null {
  const geometry = getGeometryFromFabricObject(obj, type);
  if (!geometry) return null;

  const now = new Date().toISOString();
  return {
    id: createAnnotationId(generateId()),
    imageId,
    contextId,
    geometry,
    style,
    createdAt: now,
    updatedAt: now,
  };
}

function getGeometryFromFabricObject(obj: FabricObject, type: AnnotationType): Geometry | null {
  if (type === 'rectangle' && obj instanceof Rect) {
    // Fabric's width/height are pre-scaling. We need effective width/height.
    // Also handle negative scaling (flipping).
    const width = obj.width * obj.scaleX;
    const height = obj.height * obj.scaleY;
    const left = obj.left;
    const top = obj.top;

    // Normalize if scale is negative
    // But usually we just store as is or normalize?
    // Let's assume positive width/height for now or normalize.
    // Standard geometry usually expects positive width/height.

    // transformPoint logic for rotation?
    // The spec says: origin: Point, width, height, rotation.
    // origin is top-left.
    return {
      type: 'rectangle',
      origin: { x: left, y: top },
      width: width,
      height: height,
      rotation: obj.angle,
    };
  }

  if (type === 'circle' && obj instanceof Circle) {
      // Fabric circle radius is unscaled.
      const radius = obj.radius * Math.max(Math.abs(obj.scaleX), Math.abs(obj.scaleY));
      const center = obj.getCenterPoint();
      return {
          type: 'circle',
          center: { x: center.x, y: center.y },
          radius: radius,
      };
  }

  if (type === 'line' && obj instanceof Line) {
      const matrix = obj.calcTransformMatrix();
      const cx = (obj.x1 + obj.x2) / 2;
      const cy = (obj.y1 + obj.y2) / 2;
      const p1 = util.transformPoint({ x: obj.x1 - cx, y: obj.y1 - cy }, matrix);
      const p2 = util.transformPoint({ x: obj.x2 - cx, y: obj.y2 - cy }, matrix);
      return {
          type: 'line',
          start: { x: p1.x, y: p1.y },
          end: { x: p2.x, y: p2.y },
      };
  }

  if (type === 'point' && obj instanceof Circle) {
      const center = obj.getCenterPoint();
      return {
          type: 'point',
          position: { x: center.x, y: center.y },
      };
  }

  if (type === 'path') {
      if (obj instanceof Polyline) {
          const matrix = obj.calcTransformMatrix();
          const pathOffset = obj.pathOffset || { x: 0, y: 0 };
          const points = (obj.points || []).map(p => {
              const centeredP = { x: p.x - pathOffset.x, y: p.y - pathOffset.y };
              const tp = util.transformPoint(centeredP, matrix);
              return { x: tp.x, y: tp.y };
          });
          return {
              type: 'path',
              points: points,
              closed: false, // Polyline is open usually. Polygon is closed.
          };
      }
       // Handle Path if needed, but spec mentions Polyline for path tool
  }

  return null;
}
