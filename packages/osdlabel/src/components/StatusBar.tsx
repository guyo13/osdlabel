import type { Component } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';
import type { ImageId } from '../core/types.js';

export interface StatusBarProps {
  readonly imageId: ImageId | undefined;
}

const StatusBar: Component<StatusBarProps> = (props) => {
  const { uiState, contextState, annotationState } = useAnnotator();

  const activeContextLabel = () => {
    if (!contextState.activeContextId) return 'No context';
    const ctx = contextState.contexts.find((c) => c.id === contextState.activeContextId);
    return ctx?.label ?? 'Unknown';
  };

  const activeToolName = () => {
    const tool = uiState.activeTool;
    if (tool === null) return 'Navigate';
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  };

  const totalAnnotationCount = () => {
    const imgId = props.imageId;
    if (!imgId) return 0;
    const imageAnns = annotationState.byImage[imgId];
    if (!imageAnns) return 0;
    return Object.keys(imageAnns).length;
  };

  return (
    <div
      style={{
        padding: '4px 12px',
        background: '#111',
        color: '#aaa',
        display: 'flex',
        gap: '16px',
        'align-items': 'center',
        'font-family': 'system-ui, sans-serif',
        'font-size': '12px',
        'flex-shrink': '0',
      }}
    >
      <span data-testid="status-context">
        Context: <strong style={{ color: '#fff' }}>{activeContextLabel()}</strong>
      </span>
      <span data-testid="status-tool">
        Tool: <strong style={{ color: '#fff' }}>{activeToolName()}</strong>
      </span>
      <span data-testid="status-count">
        Annotations: <strong style={{ color: '#fff' }}>{totalAnnotationCount()}</strong>
      </span>
    </div>
  );
};

export default StatusBar;
