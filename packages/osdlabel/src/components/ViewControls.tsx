import type { Component } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';
import type { ViewTransform } from '../core/types.js';
import { DEFAULT_VIEW_TRANSFORM } from '../core/types.js';

const ViewControls: Component = () => {
  const { annotationState, uiState, actions } = useAnnotator();

  const activeImageId = () => uiState.gridAssignments[uiState.activeCellIndex];

  const viewTransform = (): ViewTransform => {
    const imageId = activeImageId();
    if (!imageId) return DEFAULT_VIEW_TRANSFORM;
    return annotationState.viewTransforms[imageId] ?? DEFAULT_VIEW_TRANSFORM;
  };

  const isDefault = () => {
    const vt = viewTransform();
    return (
      vt.rotation === 0 &&
      !vt.flippedH &&
      !vt.flippedV
    );
  };

  const buttonStyle = (active: boolean) => ({
    padding: '4px 8px',
    border: 'none',
    'border-radius': '4px',
    cursor: 'pointer',
    background: active ? '#2196F3' : '#333',
    color: '#fff',
    'font-weight': active ? 'bold' : 'normal',
    'font-size': '13px',
    'min-width': '28px',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        'align-items': 'center',
      }}
    >
      <button
        data-testid="view-rotate-ccw"
        onClick={() => actions.rotateActiveImageCCW()}
        title="Rotate counter-clockwise (Shift+L)"
        style={buttonStyle(false)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>
      <button
        data-testid="view-rotate-cw"
        onClick={() => actions.rotateActiveImageCW()}
        title="Rotate clockwise (Shift+R)"
        style={buttonStyle(false)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
      <button
        data-testid="view-flip-h"
        onClick={() => actions.flipActiveImageH()}
        title="Flip horizontal (Shift+H)"
        style={buttonStyle(viewTransform().flippedH)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <polyline points="4 8 8 4 8 20 4 16" />
          <polyline points="20 8 16 4 16 20 20 16" />
        </svg>
      </button>
      <button
        data-testid="view-flip-v"
        onClick={() => actions.flipActiveImageV()}
        title="Flip vertical (Shift+V)"
        style={buttonStyle(viewTransform().flippedV)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="2" y1="12" x2="22" y2="12" />
          <polyline points="8 4 4 8 20 8 16 4" />
          <polyline points="8 20 4 16 20 16 16 20" />
        </svg>
      </button>
      <button
        data-testid="view-reset"
        onClick={() => actions.resetActiveImageView()}
        title="Reset view (Shift+0)"
        disabled={isDefault()}
        style={{
          ...buttonStyle(false),
          opacity: isDefault() ? '0.5' : '1',
          cursor: isDefault() ? 'not-allowed' : 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      {viewTransform().rotation !== 0 && (
        <span style={{ color: '#aaa', 'font-size': '12px', 'margin-left': '2px' }}>
          {viewTransform().rotation}°
        </span>
      )}
    </div>
  );
};

export default ViewControls;
