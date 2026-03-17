// Pixel art sprite definitions for agent characters
// Each sprite is a 12-row x 8-column grid of hex colors (or null for transparent)
// At half-block rendering, each sprite occupies 8 wide x 6 tall terminal cells

import type { PixelGrid } from './PixelCanvas.js';
import type { ActivityState } from '../map/activityMapper.js';

// ──────────────────────────────────────────────────────────────
// Color palettes per agent type — diverse skin tones & styles
// ──────────────────────────────────────────────────────────────

export interface AgentPalette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  accent: string;
}

export const AGENT_PALETTES: Record<string, AgentPalette> = {
  // Developer roles
  'csharp-developer':      { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#9B59B6', pants: '#2C3E50', accent: '#8E44AD' },
  'swift-developer':       { skin: '#C68642', hair: '#2C1A0A', shirt: '#F97316', pants: '#3B1F0A', accent: '#EA580C' },
  'js-developer':          { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#F1C40F', pants: '#2C3E50', accent: '#F39C12' },
  'ts-developer':          { skin: '#F1C27D', hair: '#1A1A1A', shirt: '#3498DB', pants: '#2C3E50', accent: '#2980B9' },
  'python-developer':      { skin: '#8D5524', hair: '#1A0A00', shirt: '#27AE60', pants: '#1A2E1A', accent: '#2ECC71' },
  'rust-developer':        { skin: '#FFD5B4', hair: '#B5451B', shirt: '#D35400', pants: '#2C3E50', accent: '#E67E22' },
  'go-developer':          { skin: '#F0C891', hair: '#3D2B1F', shirt: '#00ADD8', pants: '#1A3A4A', accent: '#00B4D8' },
  'java-developer':        { skin: '#FFD5B4', hair: '#1A1A1A', shirt: '#E74C3C', pants: '#2C2C2C', accent: '#C0392B' },
  'kotlin-developer':      { skin: '#F1C27D', hair: '#2C3E50', shirt: '#7F8C8D', pants: '#2C3E50', accent: '#E74C3C' },
  'sql-server-expert':     { skin: '#FFDBB4', hair: '#1A1A2E', shirt: '#3498DB', pants: '#2C3E50', accent: '#2980B9' },
  'winforms-developer':    { skin: '#FFD5B4', hair: '#4A2C0A', shirt: '#884EA0', pants: '#2C3E50', accent: '#7D3C98' },
  'blazor-architect':      { skin: '#F0C891', hair: '#4A2C0A', shirt: '#6C3483', pants: '#2C3E50', accent: '#A569BD' },
  'api-designer':          { skin: '#8D5524', hair: '#1A0800', shirt: '#2E86C1', pants: '#1A2C4A', accent: '#5DADE2' },
  'performance-optimizer': { skin: '#C68642', hair: '#2C3E50', shirt: '#F39C12', pants: '#2C1A00', accent: '#E67E22' },

  // Specialized roles
  'security-expert':       { skin: '#FFD5B4', hair: '#1A1A1A', shirt: '#E74C3C', pants: '#1A1A1A', accent: '#C0392B' },
  'tester-qa':             { skin: '#F1C27D', hair: '#8B6914', shirt: '#2ECC71', pants: '#1A3A1A', accent: '#27AE60' },
  'qa-reviewer':           { skin: '#FFDBB4', hair: '#4A2C0A', shirt: '#1ABC9C', pants: '#2C3E50', accent: '#16A085' },
  'devops':                { skin: '#C68642', hair: '#7F8C8D', shirt: '#95A5A6', pants: '#2C3E50', accent: '#BDC3C7' },
  'ux-designer':           { skin: '#8D5524', hair: '#D4A017', shirt: '#E91E63', pants: '#2C2C2C', accent: '#F06292' },
  'tech-lead-gestor':      { skin: '#F1C27D', hair: '#2C3E50', shirt: '#2C3E50', pants: '#34495E', accent: '#F1C40F' },
  'meta-orchestrator':     { skin: '#FFDBB4', hair: '#D4A017', shirt: '#F1C40F', pants: '#2C3E50', accent: '#FFD700' },
  'architect':             { skin: '#FFD5B4', hair: '#1A1A1A', shirt: '#2C3E50', pants: '#1A1A1A', accent: '#3498DB' },
  'data-scientist':        { skin: '#C68642', hair: '#1A0800', shirt: '#9B59B6', pants: '#2C1A3A', accent: '#8E44AD' },
  'ml-engineer':           { skin: '#F1C27D', hair: '#2C1A0A', shirt: '#1ABC9C', pants: '#1A2A2A', accent: '#16A085' },

  // Generic fallback
  default: { skin: '#FFD5B4', hair: '#2C3E50', shirt: '#1ABC9C', pants: '#2C3E50', accent: '#16A085' },
};

// ──────────────────────────────────────────────────────────────
// Common color shorthands
// ──────────────────────────────────────────────────────────────
const _: null = null;
const W = '#FFFFFF';
const K = '#1A1A1A';
const BR = '#8B4513';
const GR = '#808080';
const LG = '#C0C0C0';
const YL = '#FFD700';
const RD = '#FF0000';
const OG = '#FF6600';
const GN = '#00CC00';
const CY = '#00CCCC';
const BL = '#3498DB';
const MG = '#FF00FF';
const DG = '#333333';

type SpriteTemplate = (p: AgentPalette) => PixelGrid;

// ──────────────────────────────────────────────────────────────
// Activity sprites (existing, enhanced with more detail)
// ──────────────────────────────────────────────────────────────

// IDLE: sitting with coffee cup, relaxed pose
const idleSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, p.skin, p.skin, p.skin, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, BR],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, BR],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, K, K, _, _, K, K, _],
];

const idleSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, p.skin, p.skin, p.skin, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, BR, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, K, K, _, _, K, K, _],
];

// THINKING: hand on chin, animated thought bubble
const thinkingSpriteA: SpriteTemplate = (p) => [
  [_, _, _, _, _, _, CY, _],
  [_, _, _, _, _, CY, W, CY],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const thinkingSpriteB: SpriteTemplate = (p) => [
  [_, _, _, _, _, CY, W, CY],
  [_, _, _, _, _, _, CY, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// READING: book in front, focused gaze
const readingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, BR, BR, BR, BR, p.skin, _],
  [_, _, BR, W, W, BR, _, _],
  [_, _, BR, BR, BR, BR, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const readingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, BR, BR, BR, BR, p.skin, _],
  [_, _, BR, BR, W, BR, _, _],
  [_, _, BR, BR, BR, BR, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// WRITING: keyboard in front, typing animation
const writingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, p.skin, DG, DG, DG, DG, p.skin, p.skin],
  [_, _, DG, DG, DG, DG, _, _],
  [_, BL, GN, BL, _, GN, BL, _],
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
  [_, p.skin, DG, DG, DG, DG, p.skin, _],
  [p.skin, _, DG, DG, DG, DG, _, _],
  [_, GN, BL, _, GN, BL, GN, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// SEARCHING: magnifying glass, eyes moving
const searchingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, _, p.skin, W, p.hair, _],
  [_, _, p.skin, _, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.skin, CY, CY],
  [_, _, _, _, _, _, CY, CY],
  [_, _, p.pants, p.pants, p.pants, p.pants, BR, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const searchingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, W, p.skin, W, p.skin, p.hair, _],
  [_, _, K, p.skin, K, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [CY, CY, p.skin, p.shirt, p.shirt, p.shirt, _, _],
  [CY, CY, _, _, _, _, _, _],
  [_, BR, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// TESTING: test tube + sparks
const testingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, YL],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GN, _],
  [_, _, p.shirt, p.shirt, _, p.skin, GN, YL],
  [_, _, _, _, _, _, GN, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const testingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, YL, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, YL],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GN, YL],
  [_, _, p.shirt, p.shirt, _, p.skin, GN, _],
  [_, _, _, _, _, _, GN, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// RUNNING: gear spinning beside
const runningSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, GR],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, GR, LG],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, GR],
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
  [GR, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [LG, GR, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [GR, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.skin, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// MESSAGING: speech balloon above
const messagingSpriteA: SpriteTemplate = (p) => [
  [_, W, W, W, W, W, W, _],
  [_, W, K, K, K, W, _, _],
  [_, W, W, W, W, _, _, _],
  [_, _, _, W, _, _, _, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const messagingSpriteB: SpriteTemplate = (p) => [
  [_, _, W, W, W, W, W, _],
  [_, _, W, K, K, K, W, _],
  [_, _, _, W, W, W, _, _],
  [_, _, _, _, W, _, _, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// DEPLOYING: rocket beside
const deployingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, W],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, LG],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, LG],
  [_, _, p.skin, K, p.skin, K, _, LG],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, LG],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, LG],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, RD],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, OG],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, RD],
  [_, _, p.pants, _, _, p.pants, _, OG],
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
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, OG],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, RD],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, OG],
  [_, _, p.pants, _, _, p.pants, _, YL],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// DEBUGGING: wrench + magnifier
const debuggingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [GR, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, CY],
  [GR, _, p.shirt, p.shirt, p.shirt, _, _, CY],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, RD, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const debuggingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GR, CY],
  [_, _, p.shirt, p.shirt, p.shirt, _, GR, CY],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, RD, p.pants, _, _],
  [_, _, K, _, YL, K, _, _],
];

// CELEBRATING: arms raised, confetti, star eyes
const celebratingSpriteA: SpriteTemplate = (p) => [
  [YL, _, _, _, _, _, _, MG],
  [_, MG, p.hair, p.hair, p.hair, p.hair, YL, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, YL, p.skin, YL, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, p.pants, p.pants, _, p.pants, _],
  [_, p.pants, _, _, _, _, p.pants, _],
  [_, K, _, _, _, _, K, _],
];

const celebratingSpriteB: SpriteTemplate = (p) => [
  [_, MG, _, YL, _, GN, _, CY],
  [CY, _, p.hair, p.hair, p.hair, p.hair, _, YL],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, p.pants, p.pants, _, p.pants, _],
  [_, p.pants, _, _, _, _, p.pants, _],
  [_, K, _, _, _, _, K, _],
];

// ERROR: big red X, sad face
const errorSpriteA: SpriteTemplate = (p) => [
  [_, _, RD, _, _, RD, _, _],
  [_, _, _, RD, RD, _, _, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, GR],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, GR],
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const errorSpriteB: SpriteTemplate = (p) => [
  [_, RD, _, _, _, _, RD, _],
  [_, _, RD, _, _, RD, _, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, GR, _],
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
// WALKING sprites — used during zone transitions
// Walking LEFT (moving left on screen)
// ──────────────────────────────────────────────────────────────

const walkLeftSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, p.skin, p.hair, _],
  [_, _, p.skin, K, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],   // arms swinging forward
  [_, _, p.shirt, p.shirt, p.shirt, p.skin, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [p.pants, _, _, p.pants, p.pants, _, _, _],                    // stride: left foot forward
  [p.pants, _, _, _, p.pants, _, _, _],
  [K, _, _, _, K, _, _, _],
];

const walkLeftSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, p.skin, W, p.skin, p.hair, _],
  [_, _, p.skin, p.skin, K, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],  // arms swinging backward
  [_, _, p.skin, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, _, _, p.pants, _, _, p.pants],                          // stride: right foot forward
  [_, _, _, _, p.pants, _, _, p.pants],
  [_, _, _, _, K, _, _, K],
];

// Walking RIGHT (moving right on screen)
const walkRightSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, p.skin, W, p.skin, p.hair, _],
  [_, _, p.skin, p.skin, K, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],  // arms swinging
  [_, _, p.shirt, p.shirt, p.shirt, p.skin, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, _, p.pants, p.pants, _, _, p.pants],                    // stride
  [_, _, _, p.pants, _, _, _, p.pants],
  [_, _, _, K, _, _, _, K],
];

const walkRightSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, p.skin, p.hair, _],
  [_, _, p.skin, K, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],   // opposite arm swing
  [_, _, p.skin, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [p.pants, _, _, _, p.pants, p.pants, _, _],                    // opposite stride
  [p.pants, _, _, _, p.pants, _, _, _],
  [K, _, _, _, K, _, _, _],
];

// ──────────────────────────────────────────────────────────────
// WALKING UP — moving toward top of screen (away from viewer)
// ──────────────────────────────────────────────────────────────

const walkUpSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],  // back of head
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],  // arms at sides
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, _, p.pants, _],                        // legs walking
  [_, p.pants, _, _, _, _, _, p.pants],
  [_, K, _, _, _, _, _, K],
];

const walkUpSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],  // arms at sides (other frame)
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, _, _, _, p.pants, _],                        // legs walking (opposite)
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ──────────────────────────────────────────────────────────────
// WALKING DOWN — moving toward bottom of screen (toward viewer)
// ──────────────────────────────────────────────────────────────

const walkDownSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],               // facing viewer
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin], // arms out
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, _, p.pants, _],
  [_, p.pants, _, _, _, _, _, p.pants],
  [K, _, _, _, _, _, _, K],
];

const walkDownSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],  // arms in
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, _, _, _, p.pants, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ──────────────────────────────────────────────────────────────
// SITTING AT DESK — special idle pose (at computer)
// ──────────────────────────────────────────────────────────────

const sittingSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, BL],  // monitor glow
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, BL, GN],
  [_, DG, DG, DG, DG, DG, _, BL],                    // keyboard
  [_, _, DG, DG, DG, DG, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, K, K, _, _, K, K, _],
];

const sittingSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, K, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, GN, BL],  // monitor different color
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, BL, GN],
  [p.skin, DG, DG, DG, DG, DG, p.skin, BL],            // both hands typing
  [_, _, DG, DG, DG, DG, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
  [_, K, K, _, _, K, K, _],
];

// ──────────────────────────────────────────────────────────────
// PHONE CALL pose — for messaging/comms
// ──────────────────────────────────────────────────────────────

const phoneSpriteA: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, p.skin, DG, _],  // phone at ear
  [_, _, p.shirt, p.shirt, p.shirt, DG, DG, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const phoneSpriteB: SpriteTemplate = (p) => [
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, p.skin, K, p.skin, p.skin, DG, _],
  [_, _, p.shirt, p.shirt, DG, DG, DG, _],  // hand moved
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ──────────────────────────────────────────────────────────────
// Sprite registry
// ──────────────────────────────────────────────────────────────

const SPRITE_TEMPLATES: Record<string, SpriteTemplate[]> = {
  idle:        [sittingSpriteA, sittingSpriteB],   // idle = sitting at desk
  thinking:    [thinkingSpriteA, thinkingSpriteB],
  reading:     [readingSpriteA, readingSpriteB],
  writing:     [writingSpriteA, writingSpriteB],
  searching:   [searchingSpriteA, searchingSpriteB],
  testing:     [testingSpriteA, testingSpriteB],
  running:     [runningSpriteA, runningSpriteB],
  messaging:   [phoneSpriteA, phoneSpriteB],        // messaging = phone call pose
  deploying:   [deployingSpriteA, deployingSpriteB],
  debugging:   [debuggingSpriteA, debuggingSpriteB],
  celebrating: [celebratingSpriteA, celebratingSpriteB],
  error:       [errorSpriteA, errorSpriteB],
  // Walking animations (4 directions)
  walk_left:   [walkLeftSpriteA, walkLeftSpriteB, walkLeftSpriteA, walkLeftSpriteB],
  walk_right:  [walkRightSpriteA, walkRightSpriteB, walkRightSpriteA, walkRightSpriteB],
  walk_up:     [walkUpSpriteA, walkUpSpriteB, walkUpSpriteA, walkUpSpriteB],
  walk_down:   [walkDownSpriteA, walkDownSpriteB, walkDownSpriteA, walkDownSpriteB],
  // Special poses
  sitting:     [sittingSpriteA, sittingSpriteB],
  phone:       [phoneSpriteA, phoneSpriteB],
};

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

export type SpriteState = ActivityState | 'walk_left' | 'walk_right' | 'walk_up' | 'walk_down' | 'sitting' | 'phone';

export function getSprite(
  state: SpriteState,
  agentType: string,
  frame: number,
): PixelGrid {
  const palette = AGENT_PALETTES[agentType] ?? AGENT_PALETTES['default']!;
  const templates = SPRITE_TEMPLATES[state] ?? SPRITE_TEMPLATES['idle']!;
  const templateIndex = frame % templates.length;
  const template = templates[templateIndex]!;
  return template(palette);
}

export function getAgentPalette(agentType: string): AgentPalette {
  return AGENT_PALETTES[agentType] ?? AGENT_PALETTES['default']!;
}
