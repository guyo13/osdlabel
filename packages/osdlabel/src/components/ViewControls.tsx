import type { Component } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';
import { DEFAULT_VIEW_TRANSFORM } from '../core/types.js';

const ViewControls: Component = () => {
  const { uiState, annotationState, actions } = useAnnotator();

  const activeImageId = () => uiState.gridAssignments[uiState.activeCellIndex];
  const currentTransform = () => {
    const id = activeImageId();
    if (!id) return DEFAULT_VIEW_TRANSFORM;
    return annotationState.viewTransforms[id] ?? DEFAULT_VIEW_TRANSFORM;
  };

  const buttonStyle = (active = false) => ({
    padding: '4px 8px',
    border: 'none',
    'border-radius': '4px',
    cursor: 'pointer',
    background: active ? '#2196F3' : '#333',
    color: '#fff',
    display: 'flex',
    'align-items': 'center',
    justifyContent: 'center',
    gap: '4px',
    'font-size': '12px',
    height: '28px',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        'align-items': 'center',
        background: '#1a1a1a',
        padding: '2px 4px',
        'border-radius': '6px',
      }}
    >
      <button
        data-testid="view-rotate-ccw"
        title="Rotate Counter-Clockwise (Shift+L)"
        onClick={() => actions.rotateActiveImageCCW()}
        style={buttonStyle()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
        </svg>
      </button>

      <button
        data-testid="view-rotate-cw"
        title="Rotate Clockwise (Shift+R)"
        onClick={() => actions.rotateActiveImageCW()}
        style={buttonStyle()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
        </svg>
      </button>

      {currentTransform().rotation !== 0 && (
        <span
          style={{
            color: '#aaa',
            'font-size': '11px',
            'margin-left': '2px',
            'margin-right': '4px',
            'min-width': '24px',
            'text-align': 'center',
          }}
        >
          {currentTransform().rotation}°
        </span>
      )}

      <button
        data-testid="view-flip-h"
        title="Flip Horizontal (Shift+H)"
        onClick={() => actions.flipActiveImageH()}
        style={buttonStyle(currentTransform().flippedH)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 20 13 15 8" />
          <polyline points="9 8 4 13 9 18" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      </button>

      <button
        data-testid="view-flip-v"
        title="Flip Vertical (Shift+V)"
        onClick={() => actions.flipActiveImageV()}
        style={buttonStyle(currentTransform().flippedV)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="8 15 13 20 18 15" />
          <polyline points="18 9 13 4 8 9" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </button>

      <button
        data-testid="view-reset"
        title="Reset View (Shift+0)"
        onClick={() => actions.resetActiveImageView()}
        style={buttonStyle()}
      >
        Reset
      </button>
    </div>
  );
};

export default ViewControls;
