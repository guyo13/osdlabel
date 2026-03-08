import type { Component, JSX } from 'solid-js';
import { AnnotatorProvider } from '../state/annotator-context.js';
import type { AnnotatorProviderProps } from '../state/annotator-context.js';
import { useAnnotator } from '../state/annotator-context.js';
import Toolbar from './Toolbar.js';
import StatusBar from './StatusBar.js';
import GridView from './GridView.js';
import Filmstrip from './Filmstrip.js';
import GridControls from './GridControls.js';
import ViewControls from './ViewControls.js';
import ContextSwitcher from './ContextSwitcher.js';
import type { ImageSource, AnnotationContext } from '../core/types.js';

export interface AnnotatorProps extends Omit<AnnotatorProviderProps, 'children'> {
  /** Available images for annotation */
  readonly images: readonly ImageSource[];
  /** Annotation contexts defining tool constraints */
  readonly contexts: readonly AnnotationContext[];
  /** Whether to show the filmstrip sidebar (default: true) */
  readonly showFilmstrip?: boolean | undefined;
  /** Whether to show the view controls (default: true) */
  readonly showViewControls?: boolean | undefined;
  /** Whether to show the grid controls (default: false) */
  readonly showGridControls?: boolean | undefined;
  /** Whether to show the context switcher (default: false) */
  readonly showContextSwitcher?: boolean | undefined;
  /** Filmstrip position (default: 'left') */
  readonly filmstripPosition?: 'left' | 'right' | 'bottom' | undefined;
  /** Maximum grid dimensions */
  readonly maxGridSize?: { readonly columns: number; readonly rows: number } | undefined;
  /** Custom style for the root container */
  readonly style?: JSX.CSSProperties | undefined;
}

const AnnotatorInner: Component<Omit<AnnotatorProps, keyof AnnotatorProviderProps>> = (props) => {
  const { uiState } = useAnnotator();

  const activeImageId = () => {
    const cellIndex = uiState.activeCellIndex;
    return uiState.gridAssignments[cellIndex];
  };

  const filmstripPosition = () => props.filmstripPosition ?? 'left';
  const showFilmstrip = () => props.showFilmstrip !== false;
  const showViewControls = () => props.showViewControls !== false;
  const showGridControls = () => props.showGridControls === true;
  const showContextSwitcher = () => props.showContextSwitcher === true;
  const maxCols = () => props.maxGridSize?.columns ?? 4;
  const maxRows = () => props.maxGridSize?.rows ?? 4;

  const isHorizontalFilmstrip = () => filmstripPosition() === 'bottom';

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        width: '100%',
        height: '100%',
        ...props.style,
      }}
    >
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          background: '#1a1a1a',
          padding: '4px 8px',
        }}
      >
        <Toolbar />
        {showViewControls() && <ViewControls />}
        {showContextSwitcher() && <ContextSwitcher label="Context:" />}
        {showGridControls() && (
          <div style={{ 'margin-left': 'auto' }}>
            <GridControls maxColumns={maxCols()} maxRows={maxRows()} />
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          'flex-direction': isHorizontalFilmstrip() ? 'column' : 'row',
          flex: '1',
          'min-height': '0',
        }}
      >
        {showFilmstrip() && filmstripPosition() === 'left' && (
          <Filmstrip images={props.images} position="left" />
        )}
        <div style={{ flex: '1', 'min-width': '0', 'min-height': '0' }}>
          <GridView
            columns={uiState.gridColumns}
            rows={uiState.gridRows}
            maxColumns={maxCols()}
            maxRows={maxRows()}
            images={props.images}
          />
        </div>
        {showFilmstrip() && filmstripPosition() === 'right' && (
          <Filmstrip images={props.images} position="right" />
        )}
        {showFilmstrip() && filmstripPosition() === 'bottom' && (
          <Filmstrip images={props.images} position="bottom" />
        )}
      </div>
      <StatusBar imageId={activeImageId()} />
    </div>
  );
};

const Annotator: Component<AnnotatorProps> = (props) => {
  return (
    <AnnotatorProvider
      initialAnnotations={props.initialAnnotations}
      onAnnotationsChange={props.onAnnotationsChange}
      onConstraintChange={props.onConstraintChange}
      keyboardShortcuts={props.keyboardShortcuts}
      shouldSkipKeyboardShortcutPredicate={props.shouldSkipKeyboardShortcutPredicate}
    >
      <AnnotatorSetup contexts={props.contexts} />
      <AnnotatorInner
        images={props.images}
        contexts={props.contexts}
        showFilmstrip={props.showFilmstrip}
        showViewControls={props.showViewControls}
        showGridControls={props.showGridControls}
        showContextSwitcher={props.showContextSwitcher}
        filmstripPosition={props.filmstripPosition}
        maxGridSize={props.maxGridSize}
        style={props.style}
      />
    </AnnotatorProvider>
  );
};

/** Initializes contexts inside the provider (runs once) */
const AnnotatorSetup: Component<{ readonly contexts: readonly AnnotationContext[] }> = (props) => {
  const { actions } = useAnnotator();
  actions.setContexts([...props.contexts]);
  if (props.contexts.length > 0) {
    actions.setActiveContext(props.contexts[0]!.id);
  }
  return null;
};

export default Annotator;
