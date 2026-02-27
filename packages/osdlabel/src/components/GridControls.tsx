import { Component } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';
import TableSelector from './TableSelector.js';
import styles from './GridControls.module.css';

export interface GridControlsProps {
  readonly maxColumns: number;
  readonly maxRows: number;
}

const GridControls: Component<GridControlsProps> = (props) => {
  const { uiState, actions } = useAnnotator();

  const changeGrid = (newCols: number, newRows: number) => {
    const cols = Math.max(1, Math.min(newCols, props.maxColumns));
    const rows = Math.max(1, Math.min(newRows, props.maxRows));
    actions.setGridDimensions(cols, rows);

    // Clamp active cell index to valid range
    const maxIndex = cols * rows - 1;
    if (uiState.activeCellIndex > maxIndex) {
      actions.setActiveCell(maxIndex);
    }
  };

  return (
    <div data-testid="grid-controls" class={styles.controlsContainer}>
      <TableSelector
        maxColumns={props.maxColumns}
        maxRows={props.maxRows}
        currentColumns={uiState.gridColumns}
        currentRows={uiState.gridRows}
        onSelect={changeGrid}
      />
    </div>
  );
};

export default GridControls;
