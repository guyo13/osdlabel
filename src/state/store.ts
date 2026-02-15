import { createStore, produce } from 'solid-js/store';
import { Annotation, AnnotationId, ImageId, AnnotationState, UIState, ContextState, AnnotationContextId, AnnotationType } from '../core/types.js';

// --- Stores ---

export function createAnnotationStore() {
    const [state, setStore] = createStore<AnnotationState>({
        byImage: {},
    });
    return { state, setStore };
}

export function createUiStore() {
    const [uiState, setUiStore] = createStore<UIState>({
        activeTool: null,
        activeCellIndex: 0,
        gridColumns: 1,
        gridRows: 1,
        gridAssignments: {},
        selectedAnnotationId: null,
    });
    return { uiState, setUiStore };
}

export function createContextStore() {
    const [contextState, setContextStore] = createStore<ContextState>({
        contexts: [],
        activeContextId: null,
    });
    return { contextState, setContextStore };
}

// --- Actions ---

export function createActions(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _state: AnnotationState,
    setStore: any,
    uiState: UIState,
    setUiStore: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _contextState: ContextState,
    setContextStore: any
) {
    return {
        addAnnotation: (annotation: Annotation) => {
            setStore(
                produce((s: AnnotationState) => {
                    if (!s.byImage) s.byImage = {};
                    if (!s.byImage[annotation.imageId]) {
                        s.byImage[annotation.imageId] = {};
                    }
                    const imageGroup = s.byImage[annotation.imageId];
                    if (imageGroup) {
                         imageGroup[annotation.id] = annotation;
                    }
                })
            );
        },
        updateAnnotation: (id: AnnotationId, imageId: ImageId, patch: Partial<Annotation>) => {
            setStore(
                'byImage',
                imageId,
                produce((imageAnns: Record<AnnotationId, Annotation> | undefined) => {
                    if (imageAnns && imageAnns[id]) {
                        Object.assign(imageAnns[id], patch);
                        (imageAnns[id] as { updatedAt: string }).updatedAt = new Date().toISOString();
                    }
                })
            );
        },
        deleteAnnotation: (id: AnnotationId, imageId: ImageId) => {
             setStore(
                produce((s: AnnotationState) => {
                    if (s.byImage && s.byImage[imageId]) {
                        delete s.byImage[imageId][id];
                    }
                })
            );

            // Also deselect if deleted
            if (uiState.selectedAnnotationId === id) {
                setUiStore('selectedAnnotationId', null);
            }
        },
        setActiveTool: (tool: AnnotationType | 'select' | null) => {
             setUiStore('activeTool', tool);
        },
        setActiveContext: (contextId: AnnotationContextId) => {
            setContextStore('activeContextId', contextId);
        },
        setContexts: (contexts: any[]) => {
            setContextStore('contexts', contexts);
        }
    };
}

// Instantiate Global Singletons for Backward Compatibility / Tests
const { state: annotationState, setStore } = createAnnotationStore();
const { uiState, setUiStore } = createUiStore();
const { contextState, setContextStore } = createContextStore();
const actions = createActions(annotationState, setStore, uiState, setUiStore, contextState, setContextStore);
const constraintStatus: any = {};

export { annotationState, uiState, contextState, actions, constraintStatus };
