import type { Component } from 'solid-js';
import { useAnnotator } from '../state/annotator-context.js';

export interface GridControlsProps {
  readonly maxColumns: number;
  readonly maxRows: number;
}

const GridControls: Component<GridControlsProps> = (props) => {
  const { uiState, actions } = useAnnotator();

  const canAddColumn = () => uiState.gridColumns < props.maxColumns;
  const canRemoveColumn = () => uiState.gridColumns > 1;
  const canAddRow = () => uiState.gridRows < props.maxRows;
  const canRemoveRow = () => uiState.gridRows > 1;

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

  const smallButtonStyle = (enabled: boolean) => ({
    padding: '2px 6px',
    border: 'none',
    'border-radius': '3px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    background: enabled ? '#333' : '#1a1a1a',
    color: enabled ? '#fff' : '#555',
    'font-size': '12px',
    'font-weight': 'bold',
    'min-width': '20px',
  });

  return (
    <div
      data-testid="grid-controls"
      style={{
        display: 'flex',
        gap: '4px',
        'align-items': 'center',
        'font-size': '12px',
        color: '#aaa',
        'font-family': 'system-ui, sans-serif',
      }}
    >
      <span style={{ color: '#888' }}>Grid:</span>
      <button
        data-testid="grid-remove-col"
        disabled={!canRemoveColumn()}
        onClick={() => changeGrid(uiState.gridColumns - 1, uiState.gridRows)}
        style={smallButtonStyle(canRemoveColumn())}
      >
        -
      </button>
      <span data-testid="grid-size" style={{ color: '#fff', 'min-width': '30px', 'text-align': 'center' }}>
        {uiState.gridColumns}x{uiState.gridRows}
      </span>
      <button
        data-testid="grid-add-col"
        disabled={!canAddColumn()}
        onClick={() => changeGrid(uiState.gridColumns + 1, uiState.gridRows)}
        style={smallButtonStyle(canAddColumn())}
      >
        +
      </button>
      <span style={{ color: '#555' }}>|</span>
      <button
        data-testid="grid-remove-row"
        disabled={!canRemoveRow()}
        onClick={() => changeGrid(uiState.gridColumns, uiState.gridRows - 1)}
        style={smallButtonStyle(canRemoveRow())}
      >
        -R
      </button>
      <button
        data-testid="grid-add-row"
        disabled={!canAddRow()}
        onClick={() => changeGrid(uiState.gridColumns, uiState.gridRows + 1)}
        style={smallButtonStyle(canAddRow())}
      >
        +R
      </button>
    </div>
  );
};

export default GridControls;
