import { Component, createContext, useContext, JSX } from 'solid-js';
import { AnnotationState, UIState, ContextState } from '../core/types.js';
import { createAnnotationStore, createActions, createUiStore, createContextStore } from '../state/store.js';

interface AnnotatorContextValue {
  state: AnnotationState;
  uiState: UIState;
  contextState: ContextState;
  actions: ReturnType<typeof createActions>;
}

const AnnotatorContext = createContext<AnnotatorContextValue>();

export const AnnotatorProvider: Component<{ children: JSX.Element }> = (props) => {
  const { state, setStore } = createAnnotationStore();
  const { uiState, setUiStore } = createUiStore();
  const { contextState, setContextStore } = createContextStore();

  const actions = createActions(state, setStore, uiState, setUiStore, contextState, setContextStore);

  const value: AnnotatorContextValue = {
    state,
    uiState,
    contextState,
    actions,
  };

  return (
    <AnnotatorContext.Provider value={value}>
      {props.children}
    </AnnotatorContext.Provider>
  );
};

export function useAnnotator() {
  const context = useContext(AnnotatorContext);
  if (!context) {
    throw new Error('useAnnotator must be used within an AnnotatorProvider');
  }
  return context;
}
