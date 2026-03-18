/**
 * Zone tile patterns — each tile is a 4x4 pixel pattern that repeats across the zone floor.
 *
 * Colors derived from PICO-8 palette + Endesga 32 for professional visual coherence:
 *  - PICO-8 dark blue  #1D2B53  (planning blueprint)
 *  - PICO-8 dark green #008751  (coding terminal)
 *  - Endesga orange    #D77643  (deploying launchpad)
 *  - PICO-8 dark pur   #7E2553  (comms transmission)
 *  - Endesga brown     #AB5236  (lounge warm wood)
 *  - PICO-8 dark grey  #5F574F  (workshop metal)
 */

import type { PixelGrid } from './PixelCanvas.js';

// PICO-8 palette references
const P8_DKBLUE  = '#1D2B53';
const P8_DKGRN   = '#008751';
const P8_DKPUR   = '#7E2553';
const P8_BROWN   = '#AB5236';
const P8_DKGRAY  = '#5F574F';

// Derived shades (darkened / lightened from PICO-8 base)
const PLAN_D  = '#0D1828'; // planning dark  (blueprint shadow)
const PLAN_B  = P8_DKBLUE;  // planning base
const PLAN_L  = '#2A3D7A'; // planning light (blueprint line)

const CODE_D  = '#051505'; // coding very dark
const CODE_B  = '#0A2010'; // coding dark green base
const CODE_L  = '#1A4020'; // coding light (matrix strip)

const TEST_D  = '#1A1500'; // testing dark amber
const TEST_B  = '#2A2208'; // testing base (lab floor)
const TEST_L  = '#3D3310'; // testing light checker

const DPLY_D  = '#1A0A00'; // deploy very dark
const DPLY_B  = '#3A1E08'; // deploy base (metal)
const DPLY_L  = '#6B3A18'; // deploy light (hot metal)

const COMM_D  = '#1A0515'; // comms dark
const COMM_B  = P8_DKPUR;  // comms base (transmission purple)
const COMM_L  = '#B03A7A'; // comms light (signal pulse)

const LNGE_D  = '#2A1508'; // lounge dark wood
const LNGE_B  = '#6B3015'; // lounge base (warm planks)
const LNGE_L  = '#9B5530'; // lounge light (wood grain)

const LIBR_D  = '#0A0A18'; // library very dark
const LIBR_B  = '#1A1A3A'; // library base (bookshelf)
const LIBR_L  = '#2A2A5A'; // library light (spine)

const SHOP_D  = '#1A1A1A'; // workshop dark (grating)
const SHOP_B  = P8_DKGRAY; // workshop base (steel)
const SHOP_L  = '#7A7A7A'; // workshop light (highlight)

// ──────────────────────────────────────────────────────────────
// Floor tile patterns (4x4)
// ──────────────────────────────────────────────────────────────

export const ZONE_TILES: Record<string, PixelGrid> = {
  // Planning: blueprint grid — lines at edges, lighter in center
  planning: [
    [PLAN_D,  PLAN_L,  PLAN_L,  PLAN_D ],
    [PLAN_L,  PLAN_B,  PLAN_B,  PLAN_L ],
    [PLAN_L,  PLAN_B,  PLAN_B,  PLAN_L ],
    [PLAN_D,  PLAN_L,  PLAN_L,  PLAN_D ],
  ],

  // Coding: matrix rain — vertical stripes of dark/light green
  coding: [
    [CODE_D,  CODE_L,  CODE_D,  CODE_L ],
    [CODE_B,  CODE_D,  CODE_L,  CODE_B ],
    [CODE_L,  CODE_B,  CODE_D,  CODE_D ],
    [CODE_D,  CODE_L,  CODE_B,  CODE_L ],
  ],

  // Testing: amber checker (lab floor tiles)
  testing: [
    [TEST_D,  TEST_B,  TEST_D,  TEST_B ],
    [TEST_B,  TEST_L,  TEST_B,  TEST_L ],
    [TEST_D,  TEST_B,  TEST_D,  TEST_B ],
    [TEST_B,  TEST_D,  TEST_B,  TEST_D ],
  ],

  // Deploying: hot metal launchpad rivets
  deploying: [
    [DPLY_D,  DPLY_D,  DPLY_D,  DPLY_D ],
    [DPLY_D,  DPLY_L,  DPLY_B,  DPLY_D ],  // rivet highlight
    [DPLY_D,  DPLY_B,  DPLY_L,  DPLY_D ],
    [DPLY_D,  DPLY_D,  DPLY_D,  DPLY_D ],
  ],

  // Comms: transmission wave pattern (purple pulses)
  comms: [
    [COMM_D,  COMM_L,  COMM_D,  COMM_D ],
    [COMM_L,  COMM_B,  COMM_L,  COMM_D ],
    [COMM_D,  COMM_L,  COMM_D,  COMM_L ],
    [COMM_D,  COMM_D,  COMM_L,  COMM_D ],
  ],

  // Lounge: warm wood grain planks (horizontal stripes)
  lounge: [
    [LNGE_L,  LNGE_L,  LNGE_L,  LNGE_L ],
    [LNGE_B,  LNGE_D,  LNGE_B,  LNGE_B ],
    [LNGE_L,  LNGE_L,  LNGE_L,  LNGE_D ],
    [LNGE_B,  LNGE_B,  LNGE_D,  LNGE_B ],
  ],

  // Library: bookshelf spines (alternating thin columns)
  library: [
    [LIBR_D,  LIBR_L,  LIBR_B,  LIBR_L ],
    [LIBR_B,  LIBR_L,  LIBR_D,  LIBR_L ],
    [LIBR_D,  LIBR_L,  LIBR_B,  LIBR_L ],
    [LIBR_B,  LIBR_D,  LIBR_D,  LIBR_L ],
  ],

  // Workshop: metal floor grating (diamond plate)
  workshop: [
    [SHOP_L,  SHOP_D,  SHOP_L,  SHOP_D ],
    [SHOP_D,  SHOP_B,  SHOP_D,  SHOP_B ],
    [SHOP_L,  SHOP_D,  SHOP_L,  SHOP_D ],
    [SHOP_D,  SHOP_L,  SHOP_D,  SHOP_L ],
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
