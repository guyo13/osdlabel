import { Rect, Circle, Line, Polyline, Polygon, util, FabricObject, Color } from 'fabric';
import './fabric-module.js';
import { Annotation, AnnotationStyle, Geometry, AnnotationType, RawAnnotationData } from './types.js';

export function getFabricOptions(style: AnnotationStyle, id: string) {
    const fill = new Color(style.fillColor);
    if (style.fillOpacity !== undefined) {
        fill.setAlpha(style.fillOpacity);
    }

    return {
        fill: fill.toRgba(),
        stroke: style.strokeColor,
        strokeWidth: style.strokeWidth,
        strokeDashArray: style.strokeDashArray ? [...style.strokeDashArray] : null,
        opacity: style.opacity,
        id,
        strokeUniform: true,
    };
}

/**
 * Serialize a Fabric object into a RawAnnotationData envelope.
 * The `id` property is included automatically via FabricObject.customProperties.
 */
export function serializeFabricObject(obj: FabricObject): RawAnnotationData {
    return {
        format: 'fabric',
        data: obj.toObject() as Record<string, unknown>,
    };
}

/**
 * Deserialize a RawAnnotationData envelope back into a Fabric object.
 */
export async function deserializeFabricObject(raw: RawAnnotationData): Promise<FabricObject | null> {
    if (raw.format !== 'fabric') return null;

    const data = raw.data;
    const objects = await util.enlivenObjects([data]);
    if (objects.length === 0) return null;

    return objects[0] as FabricObject;
}

/**
 * Create a Fabric object from an Annotation's rawAnnotationData.
 * Sets selectable/evented to true for committed annotations.
 */
export async function createFabricObjectFromRawData(annotation: Annotation): Promise<FabricObject | null> {
    const obj = await deserializeFabricObject(annotation.rawAnnotationData);
    if (!obj) return null;

    obj.set({
        selectable: true,
        evented: true,
    });

    return obj;
}

export function getGeometryFromFabricObject(obj: FabricObject, type: AnnotationType): Geometry | null {
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
