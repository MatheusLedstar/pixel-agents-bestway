/**
 * FurnitureProps — Zone-specific ASCII furniture/props rendered as pixel art
 * or character art overlays on the zone floor.
 *
 * Each prop is an array of text lines (with optional ANSI) or a PixelGrid.
 */

// ──────────────────────────────────────────────────────────────
// ASCII furniture art (rendered as char-layer overlays)
// Each item is an array of strings, max 6 chars wide, 3 lines tall
// ──────────────────────────────────────────────────────────────

export interface Furniture {
  id: string;
  art: string[];
  color: string;
  width: number;
}

// DESK: where agents sit
export const DESK: Furniture = {
  id: 'desk',
  art: [
    '┌───┐',
    '│ □ │',
    '└───┘',
  ],
  color: '#8B6914',
  width: 5,
};

// COMPUTER MONITOR
export const MONITOR: Furniture = {
  id: 'monitor',
  art: [
    '╔═══╗',
    '║▓▒░║',
    '╚═╧═╝',
  ],
  color: '#3498DB',
  width: 5,
};

// WHITEBOARD (planning)
export const WHITEBOARD: Furniture = {
  id: 'whiteboard',
  art: [
    '╔═══════╗',
    '║─ ─ ─ ─║',
    '╚═══════╝',
  ],
  color: '#ECF0F1',
  width: 9,
};

// TEST TUBE RACK (testing)
export const LAB_RACK: Furniture = {
  id: 'lab_rack',
  art: [
    '┬┬┬┬',
    '║║║║',
    '└┴┴┘',
  ],
  color: '#27AE60',
  width: 4,
};

// ROCKET LAUNCHPAD (deploying)
export const LAUNCHPAD: Furniture = {
  id: 'launchpad',
  art: [
    ' /|\\ ',
    '/ | \\',
    '═════',
  ],
  color: '#E74C3C',
  width: 5,
};

// RADIO TOWER (comms)
export const ANTENNA: Furniture = {
  id: 'antenna',
  art: [
    ' /|\\ ',
    ' ─┼─ ',
    ' │││ ',
  ],
  color: '#00CCCC',
  width: 5,
};

// COUCH (lounge)
export const COUCH: Furniture = {
  id: 'couch',
  art: [
    '┌─┐┌─┐',
    '│ ││ │',
    '└───┘ ',
  ],
  color: '#E67E22',
  width: 6,
};

// BOOKSHELF (library)
export const BOOKSHELF: Furniture = {
  id: 'bookshelf',
  art: [
    '▌█▐▌█▐',
    '▌▐▌▌▐▌',
    '──────',
  ],
  color: '#2980B9',
  width: 6,
};

// TOOL BOX (workshop)
export const TOOLBOX: Furniture = {
  id: 'toolbox',
  art: [
    '┌────┐',
    '│⊞⊟⊠│',
    '└────┘',
  ],
  color: '#95A5A6',
  width: 6,
};

// COFFEE MACHINE (lounge)
export const COFFEE_MACHINE: Furniture = {
  id: 'coffee',
  art: [
    '┌──┐',
    '│☕│',
    '└──┘',
  ],
  color: '#8B4513',
  width: 4,
};

// STATUS BOARD (planning)
export const STATUS_BOARD: Furniture = {
  id: 'status_board',
  art: [
    '┌─────┐',
    '│✓○○○│',
    '└─────┘',
  ],
  color: '#27AE60',
  width: 7,
};

// SERVER RACK (deploying)
export const SERVER_RACK: Furniture = {
  id: 'server',
  art: [
    '╔════╗',
    '║▪▪▪▪║',
    '║▪▪▪▪║',
  ],
  color: '#7F8C8D',
  width: 6,
};

// Bug trap (workshop)
export const BUG_TRAP: Furniture = {
  id: 'bug_trap',
  art: [
    ' ╔═╗ ',
    '╟─┼─╢',
    ' ╚═╝ ',
  ],
  color: '#E74C3C',
  width: 5,
};

// ──────────────────────────────────────────────────────────────
// Zone furniture layouts: which furniture goes in each zone
// ──────────────────────────────────────────────────────────────

export const ZONE_FURNITURE: Record<string, Furniture[]> = {
  planning:  [WHITEBOARD, STATUS_BOARD],
  coding:    [MONITOR, DESK],
  testing:   [LAB_RACK, MONITOR],
  deploying: [SERVER_RACK, LAUNCHPAD],
  comms:     [ANTENNA],
  lounge:    [COUCH, COFFEE_MACHINE],
  library:   [BOOKSHELF],
  workshop:  [TOOLBOX, BUG_TRAP],
};

// ──────────────────────────────────────────────────────────────
// Zone-specific decorative corner icons
// ──────────────────────────────────────────────────────────────

export const ZONE_CORNER_ART: Record<string, string[]> = {
  planning:  ['📋', '✏️'],
  coding:    ['💻', '⌨️'],
  testing:   ['🧪', '✅'],
  deploying: ['🚀', '⚙️'],
  comms:     ['📡', '💬'],
  lounge:    ['☕', '💤'],
  library:   ['📚', '🔍'],
  workshop:  ['🔧', '🐛'],
};
