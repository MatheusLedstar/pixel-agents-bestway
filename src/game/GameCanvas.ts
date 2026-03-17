/**
 * GameCanvas — 2D hybrid canvas for the pixel office map.
 *
 * Operates at TWO levels simultaneously:
 *  - Pixel level  (pixelW × pixelH): for placing half-block sprite pixels
 *  - Char level   (charW  × charH):  for box-drawing, text, UI elements
 *
 * charH = pixelH / 2 (half-block: 2 pixel rows per terminal row)
 * charW = pixelW      (1 pixel column = 1 terminal column)
 *
 * Rendering order (bottom → top):
 *  1. Pixel layer  – background tiles & agent sprites
 *  2. Char layer   – walls, corridors, zone names, labels
 *  3. Overlay layer – speech bubbles, popups, UI
 */

import { renderHalfBlock, hexToRgb } from './PixelCanvas.js';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface CharCell {
  char: string;
  fg?: string;    // hex '#RRGGBB' or Ink color name
  bg?: string;    // hex background (optional)
  bold?: boolean;
  dim?: boolean;
}

export type PixelGrid = (string | null)[][];

// ──────────────────────────────────────────────────────────────
// ANSI helpers
// ──────────────────────────────────────────────────────────────

const INK_COLOR_MAP: Record<string, string> = {
  black:         '\x1b[30m',
  red:           '\x1b[31m',
  green:         '\x1b[32m',
  yellow:        '\x1b[33m',
  blue:          '\x1b[34m',
  magenta:       '\x1b[35m',
  cyan:          '\x1b[36m',
  white:         '\x1b[37m',
  gray:          '\x1b[90m',
  redBright:     '\x1b[91m',
  greenBright:   '\x1b[92m',
  yellowBright:  '\x1b[93m',
  blueBright:    '\x1b[94m',
  magentaBright: '\x1b[95m',
  cyanBright:    '\x1b[96m',
  whiteBright:   '\x1b[97m',
};

function fgAnsi(color: string | undefined): string {
  if (!color) return '';
  if (INK_COLOR_MAP[color]) return INK_COLOR_MAP[color]!;
  if (color.startsWith('#')) {
    const [r, g, b] = hexToRgb(color);
    return `\x1b[38;2;${r};${g};${b}m`;
  }
  return '';
}

function bgAnsi(color: string | undefined): string {
  if (!color) return '';
  if (color.startsWith('#')) {
    const [r, g, b] = hexToRgb(color);
    return `\x1b[48;2;${r};${g};${b}m`;
  }
  return '';
}

function renderCharCell(cell: CharCell): string {
  let out = '';
  if (cell.bold) out += '\x1b[1m';
  if (cell.dim) out += '\x1b[2m';
  out += fgAnsi(cell.fg);
  out += bgAnsi(cell.bg);
  out += cell.char;
  if (cell.bold || cell.dim || cell.fg || cell.bg) out += '\x1b[0m';
  return out;
}

// ──────────────────────────────────────────────────────────────
// GameCanvas class
// ──────────────────────────────────────────────────────────────

export class GameCanvas {
  readonly charW: number;
  readonly charH: number;
  readonly pixelW: number;
  readonly pixelH: number;

  // Pixel layer (bg): [pixelRow][pixelCol] = hex color or null
  private pixels: (string | null)[][];

  // Char layer (fg): [charRow][charCol] = CharCell or null (transparent)
  private chars: (CharCell | null)[][];

  constructor(charW: number, charH: number) {
    this.charW = charW;
    this.charH = charH;
    this.pixelW = charW;
    this.pixelH = charH * 2;

    this.pixels = Array.from({ length: this.pixelH }, () =>
      Array.from({ length: this.pixelW }, () => null)
    );
    this.chars = Array.from({ length: charH }, () =>
      Array.from({ length: charW }, () => null)
    );
  }

  // ── Pixel layer operations ────────────────────────────────

  putPixel(px: number, py: number, color: string): void {
    if (px >= 0 && px < this.pixelW && py >= 0 && py < this.pixelH) {
      this.pixels[py]![px] = color;
    }
  }

  /** Place a PixelGrid at pixel position (px, py) */
  drawPixelGrid(grid: PixelGrid, px: number, py: number): void {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
        const color = grid[row]?.[col];
        if (color !== null && color !== undefined) {
          this.putPixel(px + col, py + row, color);
        }
      }
    }
  }

  /** Fill a pixel rectangle with a solid color */
  fillPixelRect(px: number, py: number, pw: number, ph: number, color: string): void {
    for (let row = py; row < py + ph; row++) {
      for (let col = px; col < px + pw; col++) {
        this.putPixel(col, row, color);
      }
    }
  }

  /** Tile a 4x4 pixel pattern across a rect */
  tilePixelPattern(
    px: number, py: number,
    pw: number, ph: number,
    pattern: PixelGrid,
  ): void {
    const th = pattern.length;
    const tw = pattern[0]?.length ?? 0;
    if (tw === 0 || th === 0) return;

    for (let row = 0; row < ph; row++) {
      for (let col = 0; col < pw; col++) {
        const color = pattern[row % th]?.[col % tw];
        if (color !== null && color !== undefined) {
          this.putPixel(px + col, py + row, color);
        }
      }
    }
  }

  // ── Char layer operations ─────────────────────────────────

  putChar(cx: number, cy: number, cell: CharCell): void {
    if (cx >= 0 && cx < this.charW && cy >= 0 && cy < this.charH) {
      this.chars[cy]![cx] = cell;
    }
  }

  putCharAt(cx: number, cy: number, char: string, fg?: string, bold?: boolean, dim?: boolean): void {
    this.putChar(cx, cy, { char, fg, bold, dim });
  }

  putString(cx: number, cy: number, text: string, fg?: string, bold?: boolean, dim?: boolean): void {
    for (let i = 0; i < text.length; i++) {
      this.putChar(cx + i, cy, { char: text[i] ?? ' ', fg, bold, dim });
    }
  }

  /** Draw a horizontal line */
  drawHLine(cx: number, cy: number, len: number, char: string, fg?: string): void {
    for (let i = 0; i < len; i++) {
      this.putCharAt(cx + i, cy, char, fg);
    }
  }

  /** Draw a vertical line */
  drawVLine(cx: number, cy: number, len: number, char: string, fg?: string): void {
    for (let i = 0; i < len; i++) {
      this.putCharAt(cx, cy + i, char, fg);
    }
  }

  /** Draw a box border (single or double style) */
  drawBox(
    cx: number, cy: number,
    cw: number, ch: number,
    style: 'single' | 'double' | 'heavy',
    fg?: string,
    bold?: boolean,
  ): void {
    const STYLES = {
      single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
      double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
      heavy:  { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
    };
    const s = STYLES[style];

    this.putChar(cx,          cy,          { char: s.tl, fg, bold });
    this.putChar(cx + cw - 1, cy,          { char: s.tr, fg, bold });
    this.putChar(cx,          cy + ch - 1, { char: s.bl, fg, bold });
    this.putChar(cx + cw - 1, cy + ch - 1, { char: s.br, fg, bold });

    for (let i = 1; i < cw - 1; i++) {
      this.putChar(cx + i, cy,          { char: s.h, fg, bold });
      this.putChar(cx + i, cy + ch - 1, { char: s.h, fg, bold });
    }
    for (let i = 1; i < ch - 1; i++) {
      this.putChar(cx,          cy + i, { char: s.v, fg, bold });
      this.putChar(cx + cw - 1, cy + i, { char: s.v, fg, bold });
    }
  }

  /** Fill a char rectangle */
  fillChars(cx: number, cy: number, cw: number, ch: number, char: string, fg?: string): void {
    for (let row = cy; row < cy + ch; row++) {
      for (let col = cx; col < cx + cw; col++) {
        this.putCharAt(col, row, char, fg);
      }
    }
  }

  /** Draw a centered string inside a rect */
  drawCenteredString(cx: number, cy: number, cw: number, text: string, fg?: string, bold?: boolean): void {
    const pad = Math.max(0, Math.floor((cw - text.length) / 2));
    this.putString(cx + pad, cy, text, fg, bold);
  }

  // ── Composite rendering ───────────────────────────────────

  /**
   * Render the canvas into an array of ANSI-encoded strings (one per terminal row).
   *
   * For each terminal row:
   *  1. Get the two pixel rows (top = 2*row, bottom = 2*row+1)
   *  2. For each column, produce the half-block character using pixel colors
   *  3. Overlay char layer cells on top (transparent null cells show through)
   */
  renderLines(): string[] {
    const lines: string[] = [];

    for (let cy = 0; cy < this.charH; cy++) {
      let line = '';
      const py0 = cy * 2;      // top pixel row
      const py1 = cy * 2 + 1;  // bottom pixel row

      for (let cx = 0; cx < this.charW; cx++) {
        const charCell = this.chars[cy]?.[cx];

        if (charCell !== null && charCell !== undefined) {
          // Char layer has content — render it as text
          line += renderCharCell(charCell);
        } else {
          // Pixel layer: half-block rendering
          const topPx = this.pixels[py0]?.[cx] ?? null;
          const botPx = this.pixels[py1]?.[cx] ?? null;
          line += renderHalfBlock(topPx, botPx);
        }
      }

      lines.push(line);
    }

    return lines;
  }

  /** Merge another canvas on top of this one (compositing) */
  composite(other: GameCanvas, offsetX: number = 0, offsetY: number = 0): void {
    // Composite pixels
    for (let py = 0; py < other.pixelH; py++) {
      for (let px = 0; px < other.pixelW; px++) {
        const color = other.pixels[py]?.[px];
        if (color !== null && color !== undefined) {
          this.putPixel(offsetX + px, offsetY * 2 + py, color);
        }
      }
    }
    // Composite chars
    for (let cy = 0; cy < other.charH; cy++) {
      for (let cx = 0; cx < other.charW; cx++) {
        const cell = other.chars[cy]?.[cx];
        if (cell !== null && cell !== undefined) {
          this.putChar(offsetX + cx, offsetY + cy, cell);
        }
      }
    }
  }
}
