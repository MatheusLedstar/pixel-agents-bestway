// Zone tile patterns — each tile is a 4x4 pixel pattern that repeats across the zone floor
// Also provides zone-specific ASCII decoration props for rendering

import type { PixelGrid } from './PixelCanvas.js';

// ──────────────────────────────────────────────────────────────
// Floor tile patterns (4x4, tiled to fill zone background)
// ──────────────────────────────────────────────────────────────

export const ZONE_TILES: Record<string, PixelGrid> = {
  // Planning zone: blue grid lines (blueprint paper)
  planning: [
    ['#1A3050', '#2A4A6B', '#2A4A6B', '#1A3050'],
    ['#2A4A6B', '#4A7A9B', '#3B5E80', '#2A4A6B'],
    ['#2A4A6B', '#3B5E80', '#4A7A9B', '#2A4A6B'],
    ['#1A3050', '#2A4A6B', '#2A4A6B', '#1A3050'],
  ],

  // Coding zone: matrix-rain dark green
  coding: [
    ['#051005', '#0A1A0A', '#051005', '#0D2B0D'],
    ['#0D2B0D', '#051005', '#1A3A1A', '#0A1A0A'],
    ['#0A1A0A', '#1A3A1A', '#051005', '#0D2B0D'],
    ['#0D2B0D', '#0A1A0A', '#0D2B0D', '#051005'],
  ],

  // Testing zone: amber lab checker
  testing: [
    ['#2D2510', '#3D3520', '#2D2510', '#3D3520'],
    ['#3D3520', '#2D2510', '#4A4028', '#2D2510'],
    ['#2D2510', '#4A4028', '#2D2510', '#3D3520'],
    ['#3D3520', '#2D2510', '#3D3520', '#2D2510'],
  ],

  // Deploying zone: metallic launchpad
  deploying: [
    ['#3A2820', '#5A4030', '#5A4030', '#3A2820'],
    ['#5A4030', '#7D5040', '#6B5040', '#5A4030'],
    ['#5A4030', '#6B5040', '#7D5040', '#5A4030'],
    ['#3A2820', '#5A4030', '#5A4030', '#3A2820'],
  ],

  // Comms zone: cyan data waves
  comms: [
    ['#051525', '#0A2A3A', '#0D3A4A', '#0A2A3A'],
    ['#0A2A3A', '#1A4A5A', '#0D3A4A', '#051525'],
    ['#0D3A4A', '#0A2A3A', '#051525', '#0A2A3A'],
    ['#0A2A3A', '#051525', '#0A2A3A', '#1A4A5A'],
  ],

  // Lounge zone: warm wood planks
  lounge: [
    ['#4A2A15', '#5A3A20', '#6B4A30', '#5A3A20'],
    ['#5A3A20', '#7D5A40', '#6B4A30', '#5A3A20'],
    ['#6B4A30', '#5A3A20', '#4A2A15', '#6B4A30'],
    ['#5A3A20', '#6B4A30', '#5A3A20', '#4A2A15'],
  ],

  // Library zone: dark bookshelf rows
  library: [
    ['#0D0D25', '#1A1A3A', '#2A2A4A', '#1A1A3A'],
    ['#1A1A3A', '#0D0D25', '#1A1A3A', '#2A2A4A'],
    ['#0D0D25', '#2A2A4A', '#1A1A3A', '#0D0D25'],
    ['#2A2A4A', '#1A1A3A', '#0D0D25', '#3A3A5A'],
  ],

  // Workshop zone: gray metal grating
  workshop: [
    ['#252525', '#3A3A3A', '#252525', '#3A3A3A'],
    ['#3A3A3A', '#252525', '#4A4A4A', '#252525'],
    ['#252525', '#4A4A4A', '#252525', '#3A3A3A'],
    ['#3A3A3A', '#252525', '#3A3A3A', '#252525'],
  ],
};

// ──────────────────────────────────────────────────────────────
// Zone atmosphere decorations (ASCII art, rendered as text lines)
// Each function takes width and a frame number for animation
// ──────────────────────────────────────────────────────────────

function wrapLine(line: string, width: number): string {
  if (line.length >= width) return line.slice(0, width);
  return line + ' '.repeat(width - line.length);
}

// Planning: blueprint grid lines
export function planningAtmosphere(width: number, frame: number): string[] {
  const gridChars = ['┼', '┼', '─', '─', '│', '┼', '─', '┼'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const idx1 = (i + frame) % gridChars.length;
    const idx2 = (i + frame + 4) % gridChars.length;
    row1 += gridChars[idx1] ?? '─';
    row2 += gridChars[idx2] ?? '─';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Coding: matrix rain effect
const MATRIX_CHARS = '01アイウエオカキクケコ$#@%&*';
export function codingAtmosphere(width: number, frame: number): string[] {
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const h1 = ((i * 31 + frame * 7) % MATRIX_CHARS.length);
    const h2 = ((i * 17 + frame * 11 + 5) % MATRIX_CHARS.length);
    row1 += MATRIX_CHARS[h1] ?? '0';
    row2 += MATRIX_CHARS[h2] ?? '1';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Testing: test pattern / checkerboard
export function testingAtmosphere(width: number, frame: number): string[] {
  const patterns = ['▄▀', '▀▄'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const p = patterns[((i + frame) % 2)] ?? '▄▀';
    row1 += p[0] ?? ' ';
    row2 += p[1] ?? ' ';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Deploying: launch countdown / rocket fire
export function deployingAtmosphere(width: number, frame: number): string[] {
  const fireChars = ['▲', '△', '▵', '◬', '▲'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const idx = (i + frame * 2) % fireChars.length;
    row1 += fireChars[idx] ?? '▲';
    row2 += i % 3 === 0 ? '|' : (i % 3 === 1 ? '·' : ' ');
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Comms: data transmission waves
export function commsAtmosphere(width: number, frame: number): string[] {
  const waveChars = ['≈', '~', '⌇', '≋', '~'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const idx1 = (i + frame * 3) % waveChars.length;
    const idx2 = (i + frame * 2 + 2) % waveChars.length;
    row1 += waveChars[idx1] ?? '~';
    row2 += waveChars[idx2] ?? '≈';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Lounge: warm comfort symbols
export function loungeAtmosphere(width: number, frame: number): string[] {
  const symbols = ['·', '∘', '◦', '·', ' ', '·'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const idx = ((i * 3 + frame) % symbols.length);
    row1 += symbols[idx] ?? '·';
    row2 += symbols[(idx + 3) % symbols.length] ?? ' ';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Library: book spine patterns
export function libraryAtmosphere(width: number, frame: number): string[] {
  const spines = ['▌', '█', '▐', '▌', '░', '▌', '▐', '█'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const idx = (i + (frame % 2)) % spines.length;
    row1 += spines[idx] ?? '▌';
    row2 += spines[(idx + 4) % spines.length] ?? '░';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

// Workshop: sparks + metal sounds
export function workshopAtmosphere(width: number, frame: number): string[] {
  const sparks = ['·', '✦', '*', '·', '✧', '·', ' ', '·'];
  let row1 = '';
  let row2 = '';
  for (let i = 0; i < width; i++) {
    const idx = ((i * 2 + frame * 3) % sparks.length);
    row1 += sparks[idx] ?? '·';
    row2 += sparks[(idx + 2) % sparks.length] ?? '·';
  }
  return [wrapLine(row1, width), wrapLine(row2, width)];
}

export const ZONE_ATMOSPHERE: Record<string, (width: number, frame: number) => string[]> = {
  planning:  planningAtmosphere,
  coding:    codingAtmosphere,
  testing:   testingAtmosphere,
  deploying: deployingAtmosphere,
  comms:     commsAtmosphere,
  lounge:    loungeAtmosphere,
  library:   libraryAtmosphere,
  workshop:  workshopAtmosphere,
};

export const ZONE_ATMOSPHERE_COLORS: Record<string, string> = {
  planning:  'blue',
  coding:    'green',
  testing:   'yellow',
  deploying: 'red',
  comms:     'cyan',
  lounge:    'gray',
  library:   'blue',
  workshop:  'gray',
};

// ──────────────────────────────────────────────────────────────
// Background tile generation
// ──────────────────────────────────────────────────────────────

export function generateZoneBackground(
  zoneId: string,
  width: number,
  height: number,
): PixelGrid {
  const tile = ZONE_TILES[zoneId] ?? ZONE_TILES['coding']!;
  const tileH = tile.length;
  const tileW = tileH > 0 ? (tile[0]?.length ?? 0) : 0;

  if (tileW === 0 || tileH === 0) {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => '#1A1A1A'),
    );
  }

  const grid: PixelGrid = [];
  for (let y = 0; y < height; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < width; x++) {
      row.push(tile[y % tileH]![x % tileW]!);
    }
    grid.push(row);
  }

  return grid;
}
