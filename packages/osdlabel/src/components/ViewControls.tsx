import type { Component } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';
import { DEFAULT_VIEW_TRANSFORM } from '../core/types.js';

const ViewControls: Component = () => {
  const { annotationState, uiState, actions } = useAnnotator();

  const activeImageId = () => uiState.gridAssignments[uiState.activeCellIndex];
  const currentTransform = () => {
    const imageId = activeImageId();
    if (!imageId) return DEFAULT_VIEW_TRANSFORM;
    return annotationState.viewTransforms[imageId] ?? DEFAULT_VIEW_TRANSFORM;
  };

  const isFlippedH = () => currentTransform().flippedH;
  const isFlippedV = () => currentTransform().flippedV;
  const rotation = () => currentTransform().rotation;
  const hasTransform = () => rotation() !== 0 || isFlippedH() || isFlippedV();

  const buttonStyle = (active: boolean) => ({
    padding: '4px 8px',
    border: 'none',
    'border-radius': '4px',
    cursor: 'pointer',
    background: active ? '#2196F3' : '#333',
    color: '#fff',
    'font-weight': active ? 'bold' : 'normal',
    'font-size': '13px',
    display: 'flex',
    'align-items': 'center',
    'justify-content': 'center',
    'min-width': '28px',
    height: '26px',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        'align-items': 'center',
        'border-left': '1px solid #444',
        'padding-left': '8px',
        'margin-left': '4px',
      }}
    >
      {/* Rotate CCW */}
      <button
        data-testid="view-rotate-ccw"
        onClick={() => actions.rotateActiveImageCCW()}
        title="Rotate Counter-Clockwise (Shift+L)"
        style={buttonStyle(false)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      {/* Rotate CW */}
      <button
        data-testid="view-rotate-cw"
        onClick={() => actions.rotateActiveImageCW()}
        title="Rotate Clockwise (Shift+R)"
        style={buttonStyle(false)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>

      {/* Flip Horizontal */}
      <button
        data-testid="view-flip-h"
        onClick={() => actions.flipActiveImageH()}
        title="Flip Horizontal (Shift+H)"
        style={buttonStyle(isFlippedH())}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18" />
          <path d="M16 7l4 5-4 5" />
          <path d="M8 7l-4 5 4 5" />
        </svg>
      </button>

      {/* Flip Vertical */}
      <button
        data-testid="view-flip-v"
        onClick={() => actions.flipActiveImageV()}
        title="Flip Vertical (Shift+V)"
        style={buttonStyle(isFlippedV())}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12h18" />
          <path d="M7 8l5-4 5 4" />
          <path d="M7 16l5 4 5-4" />
        </svg>
      </button>

      {/* Reset */}
      <button
        data-testid="view-reset"
        onClick={() => actions.resetActiveImageView()}
        title="Reset View (Shift+0)"
        style={buttonStyle(false)}
        disabled={!hasTransform()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasTransform() ? 'currentColor' : '#666'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      {/* Rotation label */}
      {rotation() !== 0 && (
        <span
          data-testid="view-rotation-label"
          style={{
            color: '#aaa',
            'font-size': '11px',
            'margin-left': '2px',
          }}
        >
          {rotation()}°
        </span>
      )}
    </div>
  );
};

export default ViewControls;
