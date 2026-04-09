import { useAnnotator } from '../state/annotator-context.js';
import type { ImageSource } from '@osdlabel/viewer-api';

export interface FilmstripProps {
  readonly images: readonly ImageSource[];
  readonly position: 'left' | 'right' | 'bottom';
}

export default function Filmstrip({ images, position }: FilmstripProps) {
  const { uiState, actions } = useAnnotator();

  const isAssigned = (imageId: string): boolean => {
    return Object.values(uiState.gridAssignments).some((id) => id === imageId);
  };

  const handleClick = (image: ImageSource) => {
    actions.assignImageToCell(uiState.activeCellIndex, image.id);
  };

  const isVertical = position === 'left' || position === 'right';

  return (
    <div
      data-testid="filmstrip"
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        overflowY: isVertical ? 'auto' : 'hidden',
        overflowX: isVertical ? 'hidden' : 'auto',
        background: '#1a1a2e',
        padding: '4px',
        gap: '4px',
        [isVertical ? 'width' : 'height']: '120px',
        flexShrink: 0,
      }}
    >
      {[...images].map((image) => {
        const assigned = isAssigned(image.id);

        return (
          <div
            key={image.id}
            data-testid={`filmstrip-item-${image.id}`}
            onClick={() => handleClick(image)}
            style={{
              [isVertical ? 'width' : 'height']: '100%',
              [isVertical ? 'height' : 'width']: '80px',
              flexShrink: 0,
              border: assigned ? '2px solid #2196F3' : '2px solid #333',
              borderRadius: '4px',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {image.thumbnailUrl ? (
              <img
                src={image.thumbnailUrl}
                alt={image.label ?? image.id}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: assigned ? '#2a3a5e' : '#2a2a3e',
                  color: '#aaa',
                  fontSize: '10px',
                  fontFamily: 'system-ui, sans-serif',
                  textAlign: 'center',
                  padding: '4px',
                  boxSizing: 'border-box',
                }}
              >
                {image.label ?? image.id}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
