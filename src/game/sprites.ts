// Pixel art sprite definitions for agent characters
// Each sprite is a 12-row x 8-column grid of hex colors (or null for transparent)
// At half-block rendering, each sprite occupies 8 wide x 6 tall terminal cells

import type { PixelGrid } from './PixelCanvas.js';
import type { ActivityState } from '../map/activityMapper.js';

// ──────────────────────────────────────────────────────────────
// Color palettes per agent type
// ──────────────────────────────────────────────────────────────

export interface AgentPalette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  accent: string;
}

export const AGENT_PALETTES: Record<string, AgentPalette> = {
  'csharp-developer':      { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#9B59B6', pants: '#2C3E50', accent: '#8E44AD' },
  'swift-developer':       { skin: '#FFD5B4', hair: '#D4A017', shirt: '#F97316', pants: '#2C3E50', accent: '#EA580C' },
  'js-developer':          { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#F1C40F', pants: '#2C3E50', accent: '#F39C12' },
  'sql-server-expert':     { skin: '#FFD5B4', hair: '#1A1A2E', shirt: '#3498DB', pants: '#2C3E50', accent: '#2980B9' },
  'security-expert':       { skin: '#FFD5B4', hair: '#1A1A2E', shirt: '#E74C3C', pants: '#2C3E50', accent: '#C0392B' },
  'tester-qa':             { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#2ECC71', pants: '#2C3E50', accent: '#27AE60' },
  'devops':                { skin: '#FFD5B4', hair: '#7F8C8D', shirt: '#95A5A6', pants: '#2C3E50', accent: '#BDC3C7' },
  'meta-orchestrator':     { skin: '#FFD5B4', hair: '#D4A017', shirt: '#F1C40F', pants: '#2C3E50', accent: '#FFD700' },
  'blazor-architect':      { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#6C3483', pants: '#2C3E50', accent: '#A569BD' },
  'api-designer':          { skin: '#FFD5B4', hair: '#1A1A2E', shirt: '#2E86C1', pants: '#2C3E50', accent: '#5DADE2' },
  'winforms-developer':    { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#884EA0', pants: '#2C3E50', accent: '#7D3C98' },
  'performance-optimizer': { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#F39C12', pants: '#2C3E50', accent: '#E67E22' },
  'kotlin-developer':      { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#7F8C8D', pants: '#2C3E50', accent: '#E74C3C' },
  'qa-reviewer':           { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#1ABC9C', pants: '#2C3E50', accent: '#16A085' },
  'ux-designer':           { skin: '#FFD5B4', hair: '#D4A017', shirt: '#E91E63', pants: '#2C3E50', accent: '#F06292' },
  'tech-lead-gestor':      { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#2C3E50', pants: '#34495E', accent: '#F1C40F' },
  default:                 { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#1ABC9C', pants: '#2C3E50', accent: '#16A085' },
};

// ──────────────────────────────────────────────────────────────
// Transparent shorthand
// ──────────────────────────────────────────────────────────────
const _: null = null;

// ──────────────────────────────────────────────────────────────
// Prop colors (not from palette)
// ──────────────────────────────────────────────────────────────
const W = '#FFFFFF'; // white (eyes, highlights)
const K = '#1A1A1A'; // black (outlines, pupils)
const BR = '#8B4513'; // brown (book, desk, objects)
const GR = '#808080'; // gray (smoke, metal)
const LG = '#C0C0C0'; // light gray
const YL = '#FFD700'; // yellow (sparks, stars, confetti)
const RD = '#FF0000'; // red (error X, fire)
const OG = '#FF6600'; // orange (flames)
const GN = '#00CC00'; // green (test tube, checkmarks)
const CY = '#00CCCC'; // cyan (lens, glow)
const BL = '#3498DB'; // blue (screen glow)
const MG = '#FF00FF'; // magenta (confetti)
const DG = '#333333'; // dark gray (keyboard)

// ──────────────────────────────────────────────────────────────
// Sprite builder — generates sprites using palette colors
// ──────────────────────────────────────────────────────────────

type SpriteTemplate = (p: AgentPalette) => PixelGrid;

// --- IDLE: sitting, eyes closed (lines), cup beside ---
const idleSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],      // row 0: hair top
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _], // row 1: hair full
  [_, p.hair, p.skin, p.skin, p.skin, p.skin, p.hair, _], // row 2: face, closed eyes (skin = closed)
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],       // row 3: chin
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],   // row 4: shirt top
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _], // row 5: shirt body
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, BR], // row 6: arms + cup
  [_, _, p.pants, p.pants, p.pants, p.pants, _, BR],   // row 7: lap + cup
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],    // row 8: legs
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],    // row 9: legs spread (sitting)
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],    // row 10: feet
  [_, K, K, _, _, K, K, _],                            // row 11: shoes
];

const idleSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, p.skin, p.skin, p.skin, p.hair, _], // still closed eyes
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _], // no cup (picked up)
  [_, _, p.pants, p.pants, p.pants, p.pants, BR, _],   // cup in hand
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, K, K, _, _, K, K, _],
];

// --- THINKING: hand on chin, thought bubble with ? above ---
const thinkingSpriteA: SpriteTemplate = (p) => [
  [_, _, _, _, _, _, CY, _],                           // row 0: small bubble dot
  [_, _, _, _, _, CY, W, CY],                          // row 1: thought bubble ?
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],        // row 2: hair top
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],        // row 4: face, eyes open looking up
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],         // row 5: chin with hand
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _], // row 7: hand on chin
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const thinkingSpriteB: SpriteTemplate = (p) => [
  [_, _, _, _, _, CY, W, CY],                          // row 0: thought bubble with ?
  [_, _, _, _, _, _, CY, _],                            // row 1: bubble tail
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],        // eyes looking right
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _], // hand other side
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- READING: book in front, eyes looking down ---
const readingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],        // eyes open, looking down
  [_, _, p.skin, K, p.skin, K, _, _],                   // pupils down
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, BR, BR, BR, BR, p.skin, _],               // holding book (brown rectangle)
  [_, _, BR, W, W, BR, _, _],                            // book pages open
  [_, _, BR, BR, BR, BR, _, _],                          // book bottom
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const readingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],                   // eyes still down
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, BR, BR, BR, BR, p.skin, _],
  [_, _, BR, BR, W, BR, _, _],                           // page turning
  [_, _, BR, BR, BR, BR, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- WRITING: keyboard in front, hands extended, code on screen ---
const writingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],         // focused eyes
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, p.skin, DG, DG, DG, DG, p.skin, p.skin],     // hands on keyboard
  [_, _, DG, DG, DG, DG, _, _],                          // keyboard
  [_, BL, GN, BL, _, GN, BL, _],                         // screen with code lines
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const writingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, DG, DG, DG, DG, p.skin, _],                // one hand typing
  [p.skin, _, DG, DG, DG, DG, _, _],                     // hand moved
  [_, GN, BL, _, GN, BL, GN, _],                         // more code lines
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- SEARCHING: magnifying glass in right hand, eyes looking sideways ---
const searchingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, _, p.skin, W, p.hair, _],          // eyes looking right
  [_, _, p.skin, _, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.skin, CY, CY],     // hand + lens circle
  [_, _, _, _, _, _, CY, CY],                             // lens bottom
  [_, _, p.pants, p.pants, p.pants, p.pants, BR, _],      // handle
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const searchingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, W, p.skin, W, p.skin, p.hair, _],          // eyes looking left
  [_, _, K, p.skin, K, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [CY, CY, p.skin, p.shirt, p.shirt, p.shirt, _, _],     // lens on left side
  [CY, CY, _, _, _, _, _, _],
  [_, BR, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- TESTING: test tube (green rectangle) in hand, sparks ---
const testingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, YL],         // spark
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GN, _], // holding tube
  [_, _, p.shirt, p.shirt, _, p.skin, GN, YL],            // tube + spark
  [_, _, _, _, _, _, GN, _],                               // tube bottom
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const testingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, YL, _],         // spark moved
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, YL],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GN, YL], // sparks
  [_, _, p.shirt, p.shirt, _, p.skin, GN, _],
  [_, _, _, _, _, _, GN, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- RUNNING: gear spinning beside, terminal open ---
const runningSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, GR],     // gear top
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, GR, LG],  // gear body
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, GR],     // gear bottom
  [_, _, p.shirt, p.shirt, p.shirt, p.skin, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const runningSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [GR, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],     // gear left
  [LG, GR, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [GR, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.skin, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- MESSAGING: speech balloon above, mouth open ---
const messagingSpriteA: SpriteTemplate = (p) => [
  [_, W, W, W, W, W, W, _],                              // balloon top
  [_, W, K, K, K, W, _, _],                              // text in balloon
  [_, W, W, W, W, _, _, _],                              // balloon bottom
  [_, _, _, W, _, _, _, _],                               // balloon tail
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],          // eyes open
  [_, _, p.skin, K, p.skin, K, _, _],                    // mouth open (dark)
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const messagingSpriteB: SpriteTemplate = (p) => [
  [_, _, W, W, W, W, W, _],                              // balloon shifted
  [_, _, W, K, K, K, W, _],
  [_, _, _, W, W, W, _, _],
  [_, _, _, _, W, _, _, _],                               // tail
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],           // mouth closed
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- DEPLOYING: rocket beside, flames below ---
const deployingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, W],          // rocket nose
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, LG], // rocket body
  [_, p.hair, p.skin, W, p.skin, W, p.hair, LG],
  [_, _, p.skin, K, p.skin, K, _, LG],                   // rocket body
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, LG],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, LG],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, RD], // rocket fin + flame
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, OG],     // flame
  [_, _, p.pants, p.pants, p.pants, p.pants, _, RD],     // flame
  [_, _, p.pants, _, _, p.pants, _, OG],                  // flame glow
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const deployingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, W],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, LG],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, LG],
  [_, _, p.skin, K, p.skin, K, _, LG],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, LG],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, LG],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, OG], // alternate flame
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, RD],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, OG],
  [_, _, p.pants, _, _, p.pants, _, YL],                  // bright flame
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// --- DEBUGGING: wrench in hand + magnifier, bug being squished ---
const debuggingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [GR, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, CY], // wrench + lens
  [GR, _, p.shirt, p.shirt, p.shirt, _, _, CY],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, RD, p.pants, _, _, p.pants, _, _],                   // bug pixel
  [_, _, K, _, _, K, _, _],
];

const debuggingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GR, CY], // wrench right + lens
  [_, _, p.shirt, p.shirt, p.shirt, _, GR, CY],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, RD, p.pants, _, _],                   // bug moved
  [_, _, K, _, YL, K, _, _],                               // squish spark
];

// --- CELEBRATING: arms raised, confetti, stars ---
const celebratingSpriteA: SpriteTemplate = (p) => [
  [YL, _, _, _, _, _, _, MG],                              // confetti
  [_, MG, p.hair, p.hair, p.hair, p.hair, YL, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, YL, p.skin, YL, p.hair, _],         // star eyes
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],            // big smile
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin], // arms up
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, p.pants, p.pants, _, p.pants, _],
  [_, p.pants, _, _, _, _, p.pants, _],
  [_, K, _, _, _, _, K, _],
];

const celebratingSpriteB: SpriteTemplate = (p) => [
  [_, MG, _, YL, _, GN, _, CY],                           // more confetti
  [CY, _, p.hair, p.hair, p.hair, p.hair, _, YL],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],           // open eyes
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _], // arms wide
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, p.pants, p.pants, _, p.pants, _],
  [_, p.pants, _, _, _, _, p.pants, _],
  [_, K, _, _, _, _, K, _],
];

// --- ERROR: big red X, gray smoke, sad face ---
const errorSpriteA: SpriteTemplate = (p) => [
  [_, _, RD, _, _, RD, _, _],                              // big X top
  [_, _, _, RD, RD, _, _, _],                              // X cross
  [_, _, p.hair, p.hair, p.hair, p.hair, _, GR],           // smoke
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, GR],          // sad eyes (X)
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],            // frown
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const errorSpriteB: SpriteTemplate = (p) => [
  [_, RD, _, _, _, _, RD, _],                              // X shifted
  [_, _, RD, _, _, RD, _, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, GR, _],           // smoke shifted
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, GR],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ──────────────────────────────────────────────────────────────
// Sprite registry: map ActivityState to frames
// ──────────────────────────────────────────────────────────────

const SPRITE_TEMPLATES: Record<string, SpriteTemplate[]> = {
  idle:        [idleSpriteA, idleSpriteB],
  thinking:    [thinkingSpriteA, thinkingSpriteB],
  reading:     [readingSpriteA, readingSpriteB],
  writing:     [writingSpriteA, writingSpriteB],
  searching:   [searchingSpriteA, searchingSpriteB],
  testing:     [testingSpriteA, testingSpriteB],
  running:     [runningSpriteA, runningSpriteB],
  messaging:   [messagingSpriteA, messagingSpriteB],
  deploying:   [deployingSpriteA, deployingSpriteB],
  debugging:   [debuggingSpriteA, debuggingSpriteB],
  celebrating: [celebratingSpriteA, celebratingSpriteB],
  error:       [errorSpriteA, errorSpriteB],
};

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Get the pixel grid for an agent sprite given their current activity state,
 * agent type (for palette selection), and animation frame number.
 *
 * @param state - the agent's current ActivityState
 * @param agentType - the agent type string (used to select color palette)
 * @param frame - animation frame counter (alternates between sprite variants)
 * @returns a 12x8 PixelGrid
 */
export function getSprite(
  state: ActivityState,
  agentType: string,
  frame: number,
): PixelGrid {
  const palette = AGENT_PALETTES[agentType] ?? AGENT_PALETTES['default']!;
  const templates = SPRITE_TEMPLATES[state] ?? SPRITE_TEMPLATES['idle']!;
  const templateIndex = frame % templates.length;
  const template = templates[templateIndex]!;
  return template(palette);
}

/**
 * Get the palette for a given agent type.
 */
export function getAgentPalette(agentType: string): AgentPalette {
  return AGENT_PALETTES[agentType] ?? AGENT_PALETTES['default']!;
}
