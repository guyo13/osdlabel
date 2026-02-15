import { createContext, useContext, JSX, Accessor } from 'solid-js';
import { AnnotationState, UIState, ConstraintStatus } from '../core/types';
import { createAnnotationStore } from './annotation-store';
import { createUIStore } from './ui-store';
import { createContextStore, createConstraintStatus, ContextState } from './context-store';
import { createActions } from './actions';

interface AnnotatorContextValue {
  annotationState: AnnotationState;
  uiState: UIState;
  contextState: ContextState;
  constraintStatus: Accessor<ConstraintStatus>;
  actions: ReturnType<typeof createActions>;
}

const AnnotatorContext = createContext<AnnotatorContextValue>();

export function AnnotatorProvider(props: { children: JSX.Element }) {
  const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
  const { state: uiState, setState: setUIState } = createUIStore();
  const { state: contextState, setState: setContextState } = createContextStore();

  const actions = createActions(setAnnotationState, setUIState, setContextState);
  const constraintStatus = createConstraintStatus(contextState, annotationState);

  const value: AnnotatorContextValue = {
    annotationState,
    uiState,
    contextState,
    constraintStatus,
    actions,
  };

  return (
    <AnnotatorContext.Provider value={value}>
      {props.children}
    </AnnotatorContext.Provider>
  );
}

export function useAnnotator() {
  const context = useContext(AnnotatorContext);
  if (!context) {
    throw new Error('useAnnotator must be used within an AnnotatorProvider');
  }
  return context;
}
