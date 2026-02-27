import { Component, createSignal, For, Show } from 'solid-js';
import styles from './GridControls.module.css';

interface TableSelectorProps {
  maxColumns: number;
  maxRows: number;
  currentColumns: number;
  currentRows: number;
  onSelect: (cols: number, rows: number) => void;
}

const TableSelector: Component<TableSelectorProps> = (props) => {
  const [hoverCols, setHoverCols] = createSignal<number | null>(null);
  const [hoverRows, setHoverRows] = createSignal<number | null>(null);
  const [isOpen, setIsOpen] = createSignal(false);

  const handleMouseEnter = (c: number, r: number) => {
    setHoverCols(c);
    setHoverRows(r);
  };

  const handleClick = (c: number, r: number) => {
    props.onSelect(c, r);
    setIsOpen(false);
  };

  const getCellColor = (c: number, r: number) => {
    const targetCols = hoverCols() ?? props.currentColumns;
    const targetRows = hoverRows() ?? props.currentRows;
    const isSelected = c <= targetCols && r <= targetRows;
    return isSelected ? '#2196F3' : '#444';
  };

  // Icon for the grid button
  const GridIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1h14v14H1V1zm2 2v4h4V3H3zm6 0v4h4V3H9zM3 9v4h4V9H3zm6 0v4h4V9H9z"
        fill-rule="evenodd"
        clip-rule="evenodd"
      />
    </svg>
  );

  return (
    <div class={styles.container} onMouseLeave={() => setIsOpen(false)}>
      <button
        data-testid="grid-selector-trigger"
        onClick={() => setIsOpen(!isOpen())}
        class={styles.triggerButton}
        title="Change Grid Layout"
      >
        <GridIcon />
        <span data-testid="grid-size">
          {props.currentColumns}x{props.currentRows}
        </span>
      </button>

      <Show when={isOpen()}>
        <div
          data-testid="grid-selector-popover"
          class={styles.popover}
          onMouseLeave={() => {
            setHoverCols(null);
            setHoverRows(null);
          }}
        >
          <div class={styles.popoverContent}>
            <div class={styles.dimensionsLabel}>
              {hoverCols() ?? props.currentColumns} x {hoverRows() ?? props.currentRows}
            </div>
            <div
              class={styles.gridContainer}
              style={{
                'grid-template-columns': `repeat(${props.maxColumns}, 1fr)`,
              }}
            >
              <For each={Array.from({ length: props.maxRows }, (_, i) => i + 1)}>
                {(r) => (
                  <For each={Array.from({ length: props.maxColumns }, (_, i) => i + 1)}>
                    {(c) => (
                      <div
                        data-testid={`grid-cell-${c}-${r}`}
                        onMouseEnter={() => handleMouseEnter(c, r)}
                        onClick={() => handleClick(c, r)}
                        class={styles.gridCell}
                        style={{
                          background: getCellColor(c, r),
                        }}
                      />
                    )}
                  </For>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default TableSelector;
