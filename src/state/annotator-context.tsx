import { createContext, useContext, createEffect, on, JSX, Accessor } from 'solid-js';
import { produce } from 'solid-js/store';
import {
  Annotation,
  AnnotationState,
  UIState,
  ConstraintStatus,
  ContextState,
  AnnotationId,
  ImageId,
  KeyboardShortcutMap,
} from '../core/types.js';
import { createAnnotationStore } from './annotation-store.js';
import { createUIStore } from './ui-store.js';
import { createContextStore, createConstraintStatus } from './context-store.js';
import { createActions } from './actions.js';
import { getAllAnnotationsFlat } from '../core/annotations/serialization.js';
import { DEFAULT_KEYBOARD_SHORTCUTS, useKeyboard } from '../hooks/useKeyboard.js';

interface AnnotatorContextValue {
  annotationState: AnnotationState;
  uiState: UIState;
  contextState: ContextState;
  constraintStatus: Accessor<ConstraintStatus>;
  actions: ReturnType<typeof createActions>;
}

const KeyboardHandler = (props: { shortcuts: KeyboardShortcutMap }) => {
  useKeyboard(props.shortcuts);
  return null;
};

const AnnotatorContext = createContext<AnnotatorContextValue>();

export interface AnnotatorProviderProps {
  readonly children: JSX.Element;
  /** Pre-existing annotations to load on mount */
  readonly initialAnnotations?: Record<ImageId, Record<AnnotationId, Annotation>> | undefined;
  /** Called when annotation state changes (after initial mount) */
  readonly onAnnotationsChange?: ((annotations: Annotation[]) => void) | undefined;
  /** Called when constraint status changes (after initial mount) */
  readonly onConstraintChange?: ((status: ConstraintStatus) => void) | undefined;
  readonly keyboardShortcuts?: Partial<KeyboardShortcutMap> | undefined;
}

export function AnnotatorProvider(props: AnnotatorProviderProps) {
  const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
  const { state: uiState, setState: setUIState } = createUIStore();
  const { state: contextState, setState: setContextState } = createContextStore();

  const actions = createActions(setAnnotationState, setUIState, setContextState);
  const constraintStatus = createConstraintStatus(contextState, annotationState);

  // Load initial annotations if provided
  if (props.initialAnnotations) {
    setAnnotationState(produce((state) => {
      for (const [imageId, annMap] of Object.entries(props.initialAnnotations!)) {
        state.byImage[imageId as ImageId] = { ...annMap };
      }
    }));
  }

  // Fire onAnnotationsChange when annotations change (defer: skip initial mount)
  createEffect(on(
    () => JSON.stringify(annotationState.byImage),
    () => {
      if (props.onAnnotationsChange) {
        const allAnnotations = getAllAnnotationsFlat(annotationState);
        props.onAnnotationsChange(allAnnotations);
      }
    },
    { defer: true }
  ));

  // Fire onConstraintChange when constraint status changes (defer: skip initial mount)
  createEffect(on(
    constraintStatus,
    (status) => {
      if (props.onConstraintChange) {
        props.onConstraintChange(status);
      }
    },
    { defer: true }
  ));

  const value: AnnotatorContextValue = {
    annotationState,
    uiState,
    contextState,
    constraintStatus,
    actions,
  };

  const mergedShortcuts = { ...DEFAULT_KEYBOARD_SHORTCUTS, ...props.keyboardShortcuts };

  return (
    <AnnotatorContext.Provider value={value}>
      <KeyboardHandler shortcuts={mergedShortcuts} />
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
