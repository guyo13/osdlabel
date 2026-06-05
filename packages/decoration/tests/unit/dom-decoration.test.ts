import { describe, expect, it } from 'vitest';
import type { AnnotationId } from '@osdlabel/annotation';
import type { Decoration, DomDecoration, DecorationProvider } from '../../src/index.js';

const annId = (s: string): AnnotationId => s as AnnotationId;

describe('DomDecoration', () => {
  it('is part of the Decoration union and narrows on type', () => {
    const decorations: readonly Decoration[] = [
      {
        type: 'dom',
        id: 'dom:a',
        relatedAnnotationIds: [annId('a')],
        anchor: { x: 1, y: 2 },
        content: { annotationId: annId('a') },
        style: { pointerEvents: 'auto', zIndex: 5, width: 120, height: 80 },
      },
    ];

    const domOnly = decorations.filter((d): d is DomDecoration => d.type === 'dom');
    expect(domOnly).toHaveLength(1);
    expect(domOnly[0]!.content).toEqual({ annotationId: annId('a') });
    expect(domOnly[0]!.style?.pointerEvents).toBe('auto');
  });

  it('can be produced by a consumer provider over annotations', () => {
    // A minimal consumer-authored provider that maps each annotation to a DOM
    // decoration anchored at the geometry's first point (point geometry here).
    const provider: DecorationProvider = ({ annotations }) =>
      annotations.map(
        (ann): DomDecoration => ({
          type: 'dom',
          id: `panel:${ann.id}`,
          relatedAnnotationIds: [ann.id],
          anchor: ann.geometry.type === 'point' ? ann.geometry.position : { x: 0, y: 0 },
          content: { annotationId: ann.id, label: ann.label },
        }),
      );

    const result = provider({
      annotations: [
        {
          id: annId('a'),
          toolType: 'point',
          geometry: { type: 'point', position: { x: 3, y: 4 } },
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
          label: 'Cell',
        },
      ],
      selectedAnnotationId: null,
    });

    expect(result).toHaveLength(1);
    const dom = result[0] as DomDecoration;
    expect(dom.type).toBe('dom');
    expect(dom.anchor).toEqual({ x: 3, y: 4 });
    expect(dom.content).toEqual({ annotationId: annId('a'), label: 'Cell' });
  });
});
