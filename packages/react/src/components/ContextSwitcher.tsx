import type { AnnotationContextId } from '@osdlabel/annotation-context';
import { useAnnotator } from '../state/annotator-context.js';

export interface ContextSwitcherProps {
  readonly label?: string | undefined;
}

export default function ContextSwitcher({ label }: ContextSwitcherProps) {
  const { contextState, actions } = useAnnotator();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {label && <span style={{ color: '#fff', fontSize: '13px' }}>{label}</span>}
      <select
        value={contextState.activeContextId ?? ''}
        onChange={(e) => actions.setActiveContext(e.currentTarget.value as AnnotationContextId)}
        style={{
          padding: '2px 4px',
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        {contextState.contexts.map((context) => (
          <option key={context.id} value={context.id}>
            {context.label}
          </option>
        ))}
      </select>
    </div>
  );
}
