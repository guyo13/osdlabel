import { Rect, Circle, Line, Polyline, Polygon, util, FabricObject } from 'fabric';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';
import { Annotation, AnnotationType, Point, Geometry, AnnotationStyle, ImageId, AnnotationContextId, AnnotationId, ToolConstraint, createAnnotationId } from '../types.js';
import { generateId } from '../../utils/id.js';

/** Framework-agnostic callbacks that tools use to interact with application state */
export interface ToolCallbacks {
  readonly getActiveContextId: () => AnnotationContextId | null;
  readonly getToolConstraint: (type: AnnotationType) => ToolConstraint | undefined;
  readonly addAnnotation: (annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>) => void;
  readonly updateAnnotation: (id: AnnotationId, imageId: ImageId, patch: Partial<Omit<Annotation, 'id' | 'imageId' | 'createdAt' | 'updatedAt'>>) => void;
  readonly deleteAnnotation: (id: AnnotationId, imageId: ImageId) => void;
  readonly setSelectedAnnotation: (id: AnnotationId | null) => void;
  readonly getAnnotation: (id: AnnotationId, imageId: ImageId) => Annotation | undefined;
}

/** A Fabric object that may be associated with an annotation */
export interface AnnotatedFabricObject extends FabricObject {
  annotationId?: AnnotationId;
  updatedAt?: string;
}

export interface AnnotationTool {
  /** Tool identifier */
  readonly type: AnnotationType | 'select';

  /** Called when the tool becomes active */
  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void;

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
  protected callbacks: ToolCallbacks | null = null;

  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void {
    this.overlay = overlay;
    this.imageId = imageId;
    this.callbacks = callbacks;
  }

  deactivate(): void {
    this.overlay = null;
    this.imageId = null;
    this.callbacks = null;
  }

  abstract onPointerDown(event: PointerEvent, imagePoint: Point): void;
  abstract onPointerMove(event: PointerEvent, imagePoint: Point): void;
  abstract onPointerUp(event: PointerEvent, imagePoint: Point): void;
  onKeyDown(_event: KeyboardEvent): void {}
  abstract cancel(): void;
}

export function createAnnotationFromFabricObject(
  obj: FabricObject,
  imageId: ImageId,
  contextId: AnnotationContextId,
  style: AnnotationStyle,
  type: AnnotationType
): Omit<Annotation, 'createdAt' | 'updatedAt'> | null {
  const geometry = getGeometryFromFabricObject(obj, type);
  if (!geometry) return null;

  return {
    id: createAnnotationId(generateId()),
    imageId,
    contextId,
    geometry,
    style,
  };
}

function getGeometryFromFabricObject(obj: FabricObject, type: AnnotationType): Geometry | null {
  if (type === 'rectangle' && obj instanceof Rect) {
    const width = obj.width * obj.scaleX;
    const height = obj.height * obj.scaleY;
    const left = obj.left;
    const top = obj.top;

    return {
      type: 'rectangle',
      origin: { x: left, y: top },
      width: width,
      height: height,
      rotation: obj.angle,
    };
  }

  if (type === 'circle' && obj instanceof Circle) {
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
      // Polygon extends Polyline in Fabric, so instanceof Polyline matches both
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
              closed: obj instanceof Polygon,
          };
      }
  }

  return null;
}
