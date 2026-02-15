import { createAnnotationStore } from './annotation-store.js';
import { createUIStore } from './ui-store.js';
import { createContextStore, createConstraintStatus } from './context-store.js';
import { createActions } from './actions.js';

const { state: annotationState, setState: setAnnotationState } = createAnnotationStore();
const { state: uiState, setState: setUIState } = createUIStore();
const { state: contextState, setState: setContextState } = createContextStore();

const actions = createActions(setAnnotationState, setUIState, setContextState);
const constraintStatus = createConstraintStatus(contextState, annotationState);

export { annotationState, uiState, contextState, actions, constraintStatus };
