import { describe, expect, it } from 'vitest';
import type { Annotation, AnnotationId, ToolType } from '@osdlabel/annotation';
import type { PixelSpacing } from '@osdlabel/viewer-api';
import { createLabelProvider, createMeasurementProvider } from '../../src/built-in-providers.js';
import type { TextDecoration } from '../../src/decoration.js';

function ann(
  id: string,
  toolType: ToolType,
  geometry: Annotation['geometry'],
  label?: string,
): Annotation {
  const base = {
    id: id as AnnotationId,
    geometry,
    toolType,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as const;
  return label !== undefined ? { ...base, label } : base;
}

describe('createMeasurementProvider', () => {
  it('emits a single text decoration per annotation with requested metrics', () => {
    const provider = createMeasurementProvider({ area: true, radius: true });
    const a = ann('c1', 'circle', { type: 'circle', center: { x: 10, y: 10 }, radius: 5 });
    const decorations = provider({ annotations: [a] });
    expect(decorations).toHaveLength(1);
    const d = decorations[0] as TextDecoration;
    expect(d.type).toBe('text');
    expect(d.relatedAnnotationIds).toEqual(['c1']);
    expect(d.text).toContain('r:');
    expect(d.text).toContain('A:');
    // No calibration → values in px
    expect(d.text).toContain('px');
  });

  it('uses pixel spacing to render mm values', () => {
    const provider = createMeasurementProvider({ area: true, radius: true });
    const spacing: PixelSpacing = { x: 0.5, y: 0.5, unit: 'mm' };
    const a = ann('c1', 'circle', { type: 'circle', center: { x: 0, y: 0 }, radius: 4 });
    const [d] = provider({ annotations: [a], pixelSpacing: spacing });
    const text = (d as TextDecoration).text;
    expect(text).toContain('mm');
    // radius: 4 * 0.5 = 2.00 mm
    expect(text).toContain('r: 2.00 mm');
    // area: π·16 px² → π·16·0.25 mm² ≈ 12.57 mm²
    expect(text).toMatch(/A: 12\.5[67] mm²/);
  });

  it('skips annotations whose geometry yields no requested metric', () => {
    const provider = createMeasurementProvider({ area: true });
    const point = ann('p1', 'point', { type: 'point', position: { x: 0, y: 0 } });
    const circle = ann('c1', 'circle', { type: 'circle', center: { x: 0, y: 0 }, radius: 3 });
    const decorations = provider({ annotations: [point, circle] });
    expect(decorations).toHaveLength(1);
    expect(decorations[0]!.relatedAnnotationIds).toEqual(['c1']);
  });

  it('produces stable, annotation-scoped ids for diffing', () => {
    const provider = createMeasurementProvider({ area: true });
    const a = ann('rect-1', 'rectangle', {
      type: 'rectangle',
      origin: { x: 0, y: 0 },
      width: 4,
      height: 4,
      rotation: 0,
    });
    const [d] = provider({ annotations: [a] });
    expect(d!.id).toBe('measurement:rect-1');
  });

  it('emits length for lines when length is requested', () => {
    const provider = createMeasurementProvider({ length: true });
    const a = ann('l1', 'line', {
      type: 'line',
      start: { x: 0, y: 0 },
      end: { x: 3, y: 4 },
    });
    const [d] = provider({ annotations: [a] });
    expect((d as TextDecoration).text).toContain('L: 5.00 px');
  });
});

describe('createLabelProvider', () => {
  it('renders annotation.label as a text decoration', () => {
    const provider = createLabelProvider();
    const a = ann('p1', 'point', { type: 'point', position: { x: 0, y: 0 } }, 'tumor');
    const [d] = provider({ annotations: [a] });
    expect((d as TextDecoration).text).toBe('tumor');
    expect(d!.id).toBe('label:p1');
  });

  it('skips annotations without a label', () => {
    const provider = createLabelProvider();
    const a = ann('p1', 'point', { type: 'point', position: { x: 0, y: 0 } });
    expect(provider({ annotations: [a] })).toEqual([]);
  });

  it('honors a custom extractor', () => {
    const provider = createLabelProvider({ extract: () => 'CUSTOM' });
    const a = ann('p1', 'point', { type: 'point', position: { x: 0, y: 0 } });
    const [d] = provider({ annotations: [a] });
    expect((d as TextDecoration).text).toBe('CUSTOM');
  });
});
