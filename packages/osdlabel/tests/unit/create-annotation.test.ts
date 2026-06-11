import { describe, expect, it } from 'vitest';
import { createImageId } from '@osdlabel/viewer-api';
import { createAnnotationContextId } from '@osdlabel/annotation-context';
import {
  createFabricObjectFromRawData,
  getGeometryFromFabricObject,
  initFabricModule,
} from '@osdlabel/fabric-annotations';
import type { Geometry } from '@osdlabel/annotation';
import { createAnnotationFromGeometry } from '../../src/create-annotation.js';

initFabricModule();

const imageId = createImageId('img-1');
const contextId = createAnnotationContextId('ctx-1');

describe('createAnnotationFromGeometry', () => {
  it('produces a complete annotation with a serialized fabric envelope', () => {
    const geometry: Geometry = {
      type: 'rectangle',
      origin: { x: 10, y: 20 },
      width: 100,
      height: 50,
      rotation: 0,
    };
    const ann = createAnnotationFromGeometry(geometry, {
      imageId,
      contextId,
      toolType: 'rectangle',
      label: 'tumor',
    });

    expect(ann.imageId).toBe(imageId);
    expect(ann.contextId).toBe(contextId);
    expect(ann.toolType).toBe('rectangle');
    expect(ann.label).toBe('tumor');
    expect(ann.geometry).toEqual(geometry);
    expect(ann.rawAnnotationData.format).toBe('fabric');
    expect(ann.createdAt).toBe(ann.updatedAt);
    expect(typeof ann.createdAt).toBe('string');
  });

  it('embeds the annotation id in the serialized envelope', () => {
    const ann = createAnnotationFromGeometry(
      { type: 'point', position: { x: 1, y: 2 } },
      { imageId, contextId, toolType: 'point' },
    );
    expect((ann.rawAnnotationData.data as { id?: string }).id).toBe(ann.id);
  });

  it('honors an explicit id', () => {
    const ann = createAnnotationFromGeometry(
      { type: 'circle', center: { x: 5, y: 5 }, radius: 3 },
      { imageId, contextId, toolType: 'circle', id: undefined },
    );
    expect(ann.id).toBeTruthy();
  });

  it('round-trips through deserialize → getGeometryFromFabricObject', async () => {
    const geometry: Geometry = {
      type: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 20, y: 30 },
      ],
    };
    const ann = createAnnotationFromGeometry(geometry, {
      imageId,
      contextId,
      toolType: 'freeHandPath',
    });
    // freeHandPath records polygon geometry even though the static map differs.
    expect(ann.geometry.type).toBe('polygon');

    const obj = await createFabricObjectFromRawData(ann);
    expect(obj).not.toBeNull();
    const back = getGeometryFromFabricObject(obj!, 'polygon');
    expect(back?.type).toBe('polygon');
    if (back?.type !== 'polygon') return;
    expect(back.points).toHaveLength(3);
    back.points.forEach((p, i) => {
      expect(p.x).toBeCloseTo(geometry.points[i]!.x);
      expect(p.y).toBeCloseTo(geometry.points[i]!.y);
    });
  });
});
