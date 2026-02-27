import { describe, it } from 'vitest';
import { createFabricObjectFromRawData } from '../../src/core/fabric-utils';
import {
  Annotation,
  createAnnotationId,
  createImageId,
  createAnnotationContextId,
  RawAnnotationData,
  Geometry,
} from '../../src/core/types';

describe('Performance: Annotation Loading', () => {
  const COUNT = 1000;
  const annotations: Annotation[] = [];

  // Generate mock annotations
  for (let i = 0; i < COUNT; i++) {
    const rawData: RawAnnotationData = {
      format: 'fabric',
      fabricVersion: '7.2.0',
      data: {
        type: 'Rect',
        width: 100,
        height: 100,
        left: i * 10,
        top: i * 10,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
      },
    };

    const geometry: Geometry = {
      type: 'rectangle',
      origin: { x: i * 10, y: i * 10 },
      width: 100,
      height: 100,
      rotation: 0,
    };

    annotations.push({
      id: createAnnotationId(`ann-${i}`),
      imageId: createImageId('img-1'),
      contextId: createAnnotationContextId('ctx-1'),
      geometry,
      rawAnnotationData: rawData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  it('measures serial loading performance', async () => {
    const start = performance.now();
    for (const ann of annotations) {
      await createFabricObjectFromRawData(ann);
    }
    const end = performance.now();
    const duration = end - start;
    console.log(`Serial loading of ${COUNT} items took: ${duration.toFixed(2)}ms`);
  });

  it('measures parallel loading performance', async () => {
    const start = performance.now();
    await Promise.all(annotations.map((ann) => createFabricObjectFromRawData(ann)));
    const end = performance.now();
    const duration = end - start;
    console.log(`Parallel loading of ${COUNT} items took: ${duration.toFixed(2)}ms`);
  });
});
