import { type Component, Show } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';
import { DEFAULT_VIEW_TRANSFORM } from '../core/types.js';

export const ViewControls: Component = () => {
  const { annotationState, actions, activeImageId } = useAnnotator();

  const viewTransform = () => {
    const id = activeImageId();
    if (!id) return DEFAULT_VIEW_TRANSFORM;
    return annotationState.viewTransforms[id] ?? DEFAULT_VIEW_TRANSFORM;
  };

  const isActive = () => !!activeImageId();

  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '4px',
        padding: '8px',
        'background-color': '#1e1e1e',
        'border-radius': '4px',
        'margin-left': '8px',
      }}
    >
      <button
        type="button"
        title="Rotate CCW (Shift+L)"
        data-testid="view-rotate-ccw"
        disabled={!isActive()}
        onClick={() => actions.rotateActiveImageCCW()}
        style={{
          width: '32px',
          height: '32px',
          'background-color': '#333',
          border: 'none',
          'border-radius': '4px',
          color: 'white',
          cursor: isActive() ? 'pointer' : 'default',
          opacity: isActive() ? '1' : '0.5',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      <button
        type="button"
        title="Rotate CW (Shift+R)"
        data-testid="view-rotate-cw"
        disabled={!isActive()}
        onClick={() => actions.rotateActiveImageCW()}
        style={{
          width: '32px',
          height: '32px',
          'background-color': '#333',
          border: 'none',
          'border-radius': '4px',
          color: 'white',
          cursor: isActive() ? 'pointer' : 'default',
          opacity: isActive() ? '1' : '0.5',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>

      <div style={{ width: '1px', height: '24px', 'background-color': '#555', margin: '0 4px' }} />

      <button
        type="button"
        title="Flip Horizontal (Shift+H)"
        data-testid="view-flip-h"
        disabled={!isActive()}
        onClick={() => actions.flipActiveImageH()}
        style={{
          width: '32px',
          height: '32px',
          'background-color': viewTransform().flippedH ? '#2196F3' : '#333',
          border: 'none',
          'border-radius': '4px',
          color: 'white',
          cursor: isActive() ? 'pointer' : 'default',
          opacity: isActive() ? '1' : '0.5',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20" />
          <path d="m3 7 5 5-5 5V7z" />
          <path d="m21 7-5 5 5 5V7z" />
        </svg>
      </button>

      <button
        type="button"
        title="Flip Vertical (Shift+V)"
        data-testid="view-flip-v"
        disabled={!isActive()}
        onClick={() => actions.flipActiveImageV()}
        style={{
          width: '32px',
          height: '32px',
          'background-color': viewTransform().flippedV ? '#2196F3' : '#333',
          border: 'none',
          'border-radius': '4px',
          color: 'white',
          cursor: isActive() ? 'pointer' : 'default',
          opacity: isActive() ? '1' : '0.5',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12h20" />
          <path d="m7 3 5 5 5-5H7z" />
          <path d="m7 21 5-5 5 5H7z" />
        </svg>
      </button>

      <Show when={viewTransform().rotation !== 0 || viewTransform().flippedH || viewTransform().flippedV}>
        <div style={{ width: '1px', height: '24px', 'background-color': '#555', margin: '0 4px' }} />
        <button
          type="button"
          title="Reset View (Shift+0)"
          data-testid="view-reset"
          onClick={() => actions.resetActiveImageView()}
          style={{
            padding: '0 8px',
            height: '32px',
            'background-color': '#d32f2f',
            border: 'none',
            'border-radius': '4px',
            color: 'white',
            cursor: 'pointer',
            'font-size': '12px',
            'font-weight': 'bold',
          }}
        >
          Reset
        </button>
      </Show>
    </div>
  );
};
