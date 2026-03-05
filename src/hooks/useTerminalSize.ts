import { useState, useEffect } from 'react';
import { useStdout } from 'ink';

export interface TerminalSize {
  cols: number;
  rows: number;
}

/**
 * Reactive hook that tracks terminal dimensions.
 * Updates on window resize events.
 */
export function useTerminalSize(): TerminalSize {
  const { stdout } = useStdout();

  const [size, setSize] = useState<TerminalSize>({
    cols: stdout?.columns ?? 120,
    rows: stdout?.rows ?? 40,
  });

  useEffect(() => {
    if (!stdout) return;

    const handleResize = () => {
      setSize({
        cols: stdout.columns ?? 120,
        rows: stdout.rows ?? 40,
      });
    };

    stdout.on('resize', handleResize);
    // Sync initial size
    handleResize();

    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  return size;
}

/**
 * Calculate responsive layout parameters from terminal size and agent count.
 */
export interface GridLayout {
  cols: number;           // Grid columns for desks
  deskWidth: number;      // Width of each desk box (inner)
  compact: boolean;       // Compact mode (small desks)
  commsWidth: number;     // Width of COMMS panel
  maxTaskRows: number;    // Max visible task rows
  maxMsgRows: number;     // Max visible message rows
}

export function calculateLayout(termSize: TerminalSize, agentCount: number): GridLayout {
  const { cols: termCols, rows: termRows } = termSize;

  // Available width for the grid (minus padding, borders, circuit decorations)
  const availableWidth = termCols - 12; // 2 padding + ~10 for borders/decorations

  // Desk width calculation: each desk needs deskWidth + 6 (margin + border)
  // Try to fit as many desks per row as possible
  let deskWidth = 16;  // default
  let compact = false;

  if (termCols < 80) {
    deskWidth = 10;
    compact = true;
  } else if (termCols < 100) {
    deskWidth = 12;
    compact = true;
  } else if (termCols >= 160) {
    deskWidth = 20;
  }

  const deskTotalWidth = deskWidth + 6; // desk + marginX(1)*2 + border(2)
  const maxCols = Math.max(1, Math.floor(availableWidth / deskTotalWidth));

  // Grid columns: try sqrt layout, clamp to maxCols
  let gridCols: number;
  if (agentCount <= maxCols) {
    gridCols = agentCount; // all fit in one row
  } else {
    gridCols = Math.min(maxCols, Math.max(2, Math.ceil(Math.sqrt(agentCount))));
  }

  // COMMS panel width
  const commsWidth = Math.min(50, Math.max(30, termCols - 20));

  // Vertical space: rows available for tasks/messages below the grid
  const gridRows = Math.ceil(agentCount / gridCols);
  const gridHeight = gridRows * 5 + 3; // ~5 lines per desk row + comms
  const headerFooterHeight = 6;        // header + footer + section labels
  const remainingRows = Math.max(4, termRows - gridHeight - headerFooterHeight);

  // Split remaining space: 60% tasks, 40% messages
  const maxTaskRows = Math.max(2, Math.floor(remainingRows * 0.6));
  const maxMsgRows = Math.max(2, Math.floor(remainingRows * 0.4));

  return {
    cols: gridCols,
    deskWidth,
    compact,
    commsWidth,
    maxTaskRows,
    maxMsgRows,
  };
}
