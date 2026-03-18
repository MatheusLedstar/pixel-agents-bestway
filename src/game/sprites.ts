/**
 * Pixel art sprite definitions — redesigned from research of professional sources:
 *
 * Sources consulted:
 *  - OpenGameArt.org office worker sprites (16×16 NES-PAL, CC-BY)
 *  - PICO-8 official palette (lospec.com/palette-list/pico-8)
 *  - Endesga 32 palette (lospec.com/palette-list/endesga-32, 190k+ downloads)
 *  - Slynyrd Pixelblog #50: Human Walk Cycle (4 keyframes: contact/down/passing/up)
 *  - Slynyrd Pixelblog #17/#49: Human Anatomy proportions
 *  - Sprite-AI 16x16 pixel art guide (3-shade system, chibi proportions)
 *
 * Design principles applied:
 *  1. Chibi proportions — head ≈ 40% of total height for readability at low resolution
 *  2. 3-shade coloring — shadow / base / highlight per body region, light from top-left
 *  3. PICO-8 + Endesga 32 palette family for visual coherence and vibrance
 *  4. Diverse skin tones — 5 distinct tones from peach to deep brown
 *  5. Walk cycle — 4 keyframe technique: contact (A) → passing (B) → contact opp (C) → passing opp (D)
 *     Arms swing opposite to leading leg (left leg forward = right arm forward)
 *
 * Grid: 12 pixel rows × 8 pixel columns → renders as 8 wide × 6 tall terminal cells
 * Body layout (pixel rows):
 *   0-1  : hair (2 rows)
 *   2    : face — eyes + forehead
 *   3    : face — nose + cheeks
 *   4-6  : shirt — collar, body, lower
 *   7-8  : shirt lower + arms
 *   9-10 : pants — waist, thighs
 *   11   : shoes
 */

import type { PixelGrid } from './PixelCanvas.js';
import type { ActivityState } from '../map/activityMapper.js';

// ──────────────────────────────────────────────────────────────
// PICO-8 palette constants (official hex codes)
// ──────────────────────────────────────────────────────────────
const P8_BLACK   = '#000000';
const P8_DKBLUE  = '#1D2B53';
const P8_DKPUR   = '#7E2553';
const P8_DKGRN   = '#008751';
const P8_BROWN   = '#AB5236';
const P8_DKGRAY  = '#5F574F';
const P8_GRAY    = '#C2C3C7';
const P8_WHITE   = '#FFF1E8';
const P8_RED     = '#FF004D';
const P8_ORANGE  = '#FFA300';
const P8_YELLOW  = '#FFEC27';
const P8_GREEN   = '#00E436';
const P8_BLUE    = '#29ADFF';
const P8_PURPLE  = '#83769C';
const P8_PINK    = '#FF77A8';
const P8_PEACH   = '#FFCCAA';

// Endesga 32 key colors
const EDG_RED    = '#BE4A2F';
const EDG_DKRED  = '#6E2727';
const EDG_ORANGE = '#D77643';
const EDG_SKIN1  = '#E8B796'; // light skin
const EDG_SKIN2  = '#C28569'; // medium-light skin
const EDG_SKIN3  = '#A06B3C'; // medium skin
const EDG_SKIN4  = '#784028'; // medium-dark skin
const EDG_TAN    = '#CB9E7A'; // tan
const EDG_YELLOW = '#FEE761';
const EDG_YLOW2  = '#FEA300';
const EDG_GREEN  = '#63C74D';
const EDG_DKGRN  = '#3E8948';
const EDG_BLUE   = '#3B5DC9';
const EDG_LTBLUE = '#0099DB';
const EDG_LTCYN  = '#2CE8F5';
const EDG_PURPLE = '#9E4FA5';
const EDG_NAVY   = '#273456';
const EDG_DKBR   = '#45283C';
const EDG_SLATE  = '#566C86';
const EDG_LTGRAY = '#A3A7C2';
const EDG_CREAM  = '#F6F7BE';

// ──────────────────────────────────────────────────────────────
// Agent color palettes — full 3-shade system
// Skin tones from lightest (#FFCCAA) to deepest (#3F1D0E)
// ──────────────────────────────────────────────────────────────

export interface AgentPalette {
  // Skin (3 shades: highlight / base / shadow)
  skinHi:  string;
  skin:    string;
  skinSh:  string;
  // Hair (3 shades)
  hairHi:  string;
  hair:    string;
  hairSh:  string;
  // Shirt (3 shades)
  shirtHi: string;
  shirt:   string;
  shirtSh: string;
  // Pants (2 shades)
  pants:   string;
  pantsSh: string;
  // Accents
  accent:  string;
  outline: string;
}

// Skin tone sets (highlight, base, shadow)
const SKIN_LIGHT:    [string, string, string] = [P8_WHITE,   P8_PEACH,  EDG_TAN   ];
const SKIN_FAIR:     [string, string, string] = [P8_PEACH,   EDG_SKIN1, EDG_SKIN2 ];
const SKIN_MEDIUM:   [string, string, string] = [EDG_SKIN2,  EDG_SKIN3, P8_BROWN  ];
const SKIN_WARM:     [string, string, string] = [EDG_TAN,    EDG_SKIN4, EDG_DKRED ];
const SKIN_DEEP:     [string, string, string] = ['#8D5524',  '#5D341A', '#3F1D0E' ];

// Convenience builder
function palette(
  skinSet: [string, string, string],
  hairHi: string, hair: string, hairSh: string,
  shirtHi: string, shirt: string, shirtSh: string,
  pants: string, pantsSh: string,
  accent: string,
): AgentPalette {
  return {
    skinHi: skinSet[0], skin: skinSet[1], skinSh: skinSet[2],
    hairHi, hair, hairSh,
    shirtHi, shirt, shirtSh,
    pants, pantsSh,
    accent,
    outline: P8_BLACK,
  };
}

export const AGENT_PALETTES: Record<string, AgentPalette> = {
  // ── JavaScript / TypeScript ──────────────────────────────
  'js-developer': palette(
    SKIN_FAIR,
    EDG_YELLOW, '#8B6914', '#4A3500',         // golden hair
    P8_YELLOW,  '#D4AE1A', '#8B6914',          // yellow shirt
    P8_DKBLUE,  '#0F1A35',                     // dark blue pants
    P8_ORANGE,                                  // orange accent
  ),
  'ts-developer': palette(
    SKIN_LIGHT,
    EDG_LTBLUE, EDG_BLUE,  P8_DKBLUE,         // blue hair
    P8_BLUE,    EDG_BLUE,  P8_DKBLUE,          // blue shirt
    P8_DKBLUE,  '#0F1A35',
    P8_GRAY,
  ),

  // ── Systems languages ────────────────────────────────────
  'python-developer': palette(
    SKIN_WARM,
    '#4A2C0A', '#2C1A0A', '#1A0A00',           // very dark hair
    EDG_DKGRN, P8_GREEN,  P8_DKGRN,            // green shirt
    '#1A2E1A', '#0A1A0A',
    EDG_YELLOW,
  ),
  'rust-developer': palette(
    SKIN_FAIR,
    '#D4501A', EDG_RED,    EDG_DKRED,           // rust-red hair
    P8_ORANGE, EDG_ORANGE, EDG_RED,             // orange shirt
    P8_DKGRAY, P8_BLACK,
    P8_YELLOW,
  ),
  'go-developer': palette(
    SKIN_MEDIUM,
    '#3D2B1F', '#2A1F15', '#150F08',
    P8_BLUE,   EDG_LTBLUE, EDG_BLUE,           // Go blue shirt
    EDG_NAVY,  P8_DKBLUE,
    EDG_LTCYN,
  ),
  'csharp-developer': palette(
    SKIN_FAIR,
    '#4A2C0A', '#2C1A0A', '#1A0A00',
    '#C084FC', P8_DKPUR, '#4A0070',            // purple shirt (C# brand color)
    P8_DKBLUE, '#0F1A35',
    '#A855F7',
  ),
  'java-developer': palette(
    SKIN_LIGHT,
    P8_BLACK,   P8_DKGRAY, '#1A1A1A',
    P8_ORANGE,  EDG_RED,    EDG_DKRED,          // Java red-orange shirt
    '#2C2C2C',  P8_BLACK,
    P8_YELLOW,
  ),
  'kotlin-developer': palette(
    SKIN_FAIR,
    P8_DKGRAY,  '#3A3A3A', P8_BLACK,
    '#FF6B9D',  P8_PINK,   P8_DKPUR,           // Kotlin gradient pink
    '#2C2C2C',  P8_BLACK,
    EDG_PURPLE,
  ),
  'swift-developer': palette(
    SKIN_WARM,
    '#D4A017', '#8B6914', '#4A3500',
    P8_ORANGE,  EDG_ORANGE, EDG_RED,            // Swift orange
    P8_DKBLUE,  '#0F1A35',
    P8_RED,
  ),

  // ── Specialized roles ────────────────────────────────────
  'security-expert': palette(
    SKIN_DEEP,
    '#1A1A1A',  P8_BLACK,   P8_BLACK,
    P8_RED,     EDG_DKRED,  P8_BLACK,           // red security shirt
    P8_BLACK,   '#0A0A0A',
    '#FF2222',
  ),
  'tester-qa': palette(
    SKIN_MEDIUM,
    '#8B6914', '#5C3D1E', '#3D1E08',
    EDG_GREEN,  P8_DKGRN,   '#1A3A1A',          // QA green
    P8_DKBLUE,  '#0F1A35',
    P8_YELLOW,
  ),
  'qa-reviewer': palette(
    SKIN_FAIR,
    '#4A2C0A', '#2C1A0A', '#1A0A00',
    EDG_LTCYN,  P8_BLUE,    EDG_NAVY,           // teal QA shirt
    P8_DKBLUE,  '#0F1A35',
    P8_GREEN,
  ),
  'devops': palette(
    SKIN_WARM,
    P8_GRAY,    P8_DKGRAY,  '#2A2A2A',
    P8_GRAY,    P8_DKGRAY,  '#3A3A3A',          // grey devops shirt
    '#2A2A2A',  P8_BLACK,
    P8_BLUE,
  ),
  'ux-designer': palette(
    SKIN_LIGHT,
    '#D4A017', '#8B6914', '#4A3500',
    P8_PINK,    P8_DKPUR,   '#6E1040',          // pink design shirt
    '#2C2C2C',  P8_BLACK,
    P8_YELLOW,
  ),
  'api-designer': palette(
    SKIN_DEEP,
    '#1A0A00',  P8_BLACK,   P8_BLACK,
    P8_BLUE,    EDG_BLUE,   P8_DKBLUE,
    P8_DKBLUE,  '#0F1A35',
    EDG_LTCYN,
  ),
  'sql-server-expert': palette(
    SKIN_LIGHT,
    '#1A1A2E',  P8_DKBLUE,  '#0A0A1A',
    EDG_LTBLUE, P8_BLUE,    P8_DKBLUE,
    P8_DKBLUE,  '#0F1A35',
    P8_GRAY,
  ),
  'meta-orchestrator': palette(
    SKIN_MEDIUM,
    EDG_YELLOW,  P8_YELLOW,  EDG_YLOW2,         // golden hair (boss)
    P8_YELLOW,   EDG_YELLOW, '#8B6914',          // gold shirt
    P8_DKBLUE,   '#0F1A35',
    '#FFD700',
  ),
  'tech-lead-gestor': palette(
    SKIN_FAIR,
    '#1A1A1A',  P8_DKGRAY,  P8_BLACK,
    P8_DKGRAY,  '#2A2A2A',  P8_BLACK,           // dark suit
    P8_BLACK,   '#0A0A0A',
    P8_YELLOW,
  ),
  'architect': palette(
    SKIN_LIGHT,
    '#1A1A1A',  P8_DKGRAY,  P8_BLACK,
    P8_DKBLUE,  EDG_NAVY,   '#0A0F1A',          // navy architect suit
    '#1A1A1A',  P8_BLACK,
    P8_BLUE,
  ),
  'blazor-architect': palette(
    SKIN_MEDIUM,
    '#4A2C0A', '#2C1A0A', '#1A0A00',
    '#9F7AEA', P8_DKPUR,   '#4A0070',
    P8_DKBLUE, '#0F1A35',
    '#C084FC',
  ),
  'winforms-developer': palette(
    SKIN_FAIR,
    '#4A2C0A', '#2C1A0A', '#1A0A00',
    '#884EA0',  P8_DKPUR,   '#4A0070',
    P8_DKBLUE,  '#0F1A35',
    P8_GRAY,
  ),
  'performance-optimizer': palette(
    SKIN_WARM,
    '#2C3E50', '#1A2A36', P8_DKBLUE,
    P8_ORANGE,  EDG_ORANGE, EDG_RED,
    '#1A1A1A',  P8_BLACK,
    P8_YELLOW,
  ),
  'data-scientist': palette(
    SKIN_DEEP,
    '#2C1A0A', '#1A0A00', P8_BLACK,
    EDG_PURPLE, '#6A2080',  P8_DKPUR,
    P8_DKBLUE,  '#0F1A35',
    EDG_LTCYN,
  ),
  'ml-engineer': palette(
    SKIN_MEDIUM,
    '#2C1A0A', '#1A0A00', P8_BLACK,
    EDG_LTCYN,  P8_BLUE,   EDG_NAVY,
    '#1A2A2A',  P8_BLACK,
    P8_GREEN,
  ),

  // Fallback
  default: palette(
    SKIN_FAIR,
    '#2C3E50', '#1A2A36', P8_DKBLUE,
    EDG_LTCYN, P8_BLUE,   EDG_NAVY,
    P8_DKBLUE, '#0F1A35',
    P8_GREEN,
  ),
};

// ──────────────────────────────────────────────────────────────
// Transparent shorthand
// ──────────────────────────────────────────────────────────────
const _: null = null;

// ──────────────────────────────────────────────────────────────
// Shared prop colors (not from palette)
// ──────────────────────────────────────────────────────────────
const W   = P8_WHITE;           // whites / highlights
const K   = P8_BLACK;           // outlines / pupils
const GR  = P8_GRAY;            // gray (screen glow, metal)
const LG  = '#D0D0D0';          // light gray
const DG  = P8_DKGRAY;          // dark gray (keyboard)
const YL  = P8_YELLOW;          // yellow (sparks, stars)
const RD  = P8_RED;             // red (fire, error)
const OG  = P8_ORANGE;          // orange (flames)
const GN  = P8_GREEN;           // green (code, checkmarks)
const CY  = EDG_LTCYN;          // cyan (thought bubbles, lens)
const BL  = P8_BLUE;            // blue (screen glow)
const MG  = P8_PINK;            // magenta/pink (confetti)
const BR  = '#7D4E2A';          // brown (book, desk props)
const PU  = P8_DKPUR;           // purple (confetti)

// ──────────────────────────────────────────────────────────────
// Sprite builder type
// ──────────────────────────────────────────────────────────────

type SpriteTemplate = (p: AgentPalette) => PixelGrid;

// ──────────────────────────────────────────────────────────────
// HEAD helper — creates a standardized head with proper shading
// Row 0: hair top (hairHi on outer edge, hair inside)
// Row 1: hair + face (hairSh sides, skin center, eyes)
// Row 2: face (skinSh sides for jaw shading, skin center)
// Row 3: chin / neck
// ──────────────────────────────────────────────────────────────
// Face variants
type EyeStyle = 'open' | 'closed' | 'looking_right' | 'looking_left' | 'star' | 'x';

function makeHead(p: AgentPalette, eyes: EyeStyle = 'open'): PixelGrid {
  let r2: (string | null)[];
  let r3: (string | null)[];

  switch (eyes) {
    case 'open':
      r2 = [_, p.hair, p.skin, W, p.skin, W, p.hair, _];  // white sclera
      r3 = [_, _, p.skin, K, p.skin, K, _, _];              // dark pupils
      break;
    case 'closed':
      r2 = [_, p.hair, p.skin, p.skinSh, p.skin, p.skinSh, p.hair, _]; // closed eyes
      r3 = [_, _, p.skin, p.skin, p.skin, p.skin, _, _];
      break;
    case 'looking_right':
      r2 = [_, p.hair, p.skin, W, p.skin, W, p.hair, _];
      r3 = [_, _, p.skin, p.skin, K, K, _, _]; // pupils right
      break;
    case 'looking_left':
      r2 = [_, p.hair, p.skin, W, p.skin, W, p.hair, _];
      r3 = [_, _, K, K, p.skin, p.skin, _, _]; // pupils left
      break;
    case 'star':
      r2 = [_, p.hair, p.skin, YL, p.skin, YL, p.hair, _]; // star eyes (celebrating)
      r3 = [_, _, p.skin, p.skin, p.skin, p.skin, _, _];
      break;
    case 'x':
      r2 = [_, p.hair, p.skin, RD, p.skin, RD, p.hair, _]; // X eyes (error)
      r3 = [_, _, RD, p.skin, p.skin, RD, _, _];
      break;
    default:
      r2 = [_, p.hair, p.skin, W, p.skin, W, p.hair, _];
      r3 = [_, _, p.skin, K, p.skin, K, _, _];
  }

  return [
    [_, _, p.hairHi, p.hair,  p.hair,  p.hairHi,_, _],  // row 0: hair top + highlight
    [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _], // row 1: hair full
    r2,
    r3,
  ];
}

// ──────────────────────────────────────────────────────────────
// BODY TEMPLATES — reusable body sections
// ──────────────────────────────────────────────────────────────

// Standard upright torso (rows 4–8): collar, body, arms
function makeBody(p: AgentPalette, armPose: 'sides' | 'up' | 'forward' | 'typing' | 'raised'): PixelGrid {
  switch (armPose) {
    case 'sides':
      return [
        [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],        // col highlights
        [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
        [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin], // arms at sides
        [_, p.skinSh, p.shirt, p.shirt, p.shirt, p.shirt, p.skinSh, _],
        [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],              // shirt bottom shadow
      ];
    case 'typing':
      return [
        [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
        [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
        [p.skin, p.skin, DG, DG, DG, DG, p.skin, p.skin],  // hands on keyboard
        [_, _, DG, DG, DG, DG, _, _],                        // keyboard shadow
        [_, BL, GN, BL, GN, BL, GN, _],                     // monitor glow reflected
      ];
    case 'forward':
      return [
        [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
        [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
        [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
        [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],         // arms forward
        [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
      ];
    case 'raised':
      return [
        [p.skin, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, p.skin], // arms up
        [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
        [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
        [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
        [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
      ];
    case 'up':
    default:
      return [
        [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
        [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
        [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
        [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
        [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
      ];
  }
}

// Standard legs — standing pose
function makeLegsStand(p: AgentPalette): PixelGrid {
  return [
    [_, _, p.pants,   p.pants,   p.pants,   p.pants,   _, _],
    [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
    [_, p.pantsSh, p.pants, _, _, p.pants, p.pantsSh, _],
    [_, K, K, _, _, K, K, _],
  ];
}

// Sitting legs — bent at knees
function makeLegssSit(p: AgentPalette): PixelGrid {
  return [
    [_, _, p.pants,   p.pants,   p.pants,   p.pants,   _, _],
    [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
    [_, p.pants, p.pants, _, _, p.pants, p.pants, _],
    [_, K, K, _, _, K, K, _],
  ];
}

// ──────────────────────────────────────────────────────────────
// COMPOSITE HELPERS — stacks head + body + legs into full sprite
// ──────────────────────────────────────────────────────────────

function makeFullSprite(
  head: PixelGrid,
  body: PixelGrid,
  legs: PixelGrid,
): PixelGrid {
  return [...head, ...body, ...legs];
}

// ──────────────────────────────────────────────────────────────
// ACTIVITY SPRITES
// ──────────────────────────────────────────────────────────────

// ─ SITTING AT DESK (idle / default) ─────────────────────────
// Shows agent typing at computer with screen glow
const sittingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, p.skin, DG, DG, DG, DG, p.skin, p.skin],   // typing
    [_, _, DG, DG, DG, DG, BL, _],                        // keyboard + screen glow right
    [BL, GN, GN, BL, BL, GN, GN, BL],                    // monitor glow — code colors
  ],
  makeLegssSit(p),
);

const sittingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'closed'),  // blink frame
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, _, DG, DG, DG, DG, _, p.skin],               // one hand lifted
    [_, _, DG, DG, DG, DG, BL, _],
    [GN, BL, BL, GN, GN, BL, BL, GN],                    // monitor — alternate frame
  ],
  makeLegssSit(p),
);

// ─ THINKING ─────────────────────────────────────────────────
// Hand on chin, animated thought bubble (PICO-8 cyan)
const thinkingSpriteA: SpriteTemplate = (p) => [
  [_, _, _, _, CY, CY, _, _],       // row 0: thought bubble dots
  [_, _, _, CY, W, W, CY, _],       // row 1: thought bubble "?"
  [_, _, p.hairHi, p.hair, p.hair, p.hairHi, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],  // eyes looking up
  [_, _, p.skin, K, p.skin, p.skin, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const thinkingSpriteB: SpriteTemplate = (p) => [
  [_, _, _, CY, W, W, CY, _],       // thought bubble shifts
  [_, _, _, _, CY, CY, _, _],
  [_, _, p.hairHi, p.hair, p.hair, p.hairHi, _, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, W, p.skin, W, p.hair, _],
  [_, _, K, p.skin, p.skin, K, _, _],  // eyes looking right
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ─ READING ──────────────────────────────────────────────────
// Holding open book, eyes downcast (3-shade book cover)
const readingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_left'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, p.skin, BR, BR, BR, BR, p.skin, _],   // holding book (brown cover)
    [_, _, BR, W, W, BR, _, _],                     // open pages (white)
    [_, _, '#5A3010', BR, BR, '#5A3010', _, _],     // book spine shadow
  ],
  makeLegsStand(p),
);

const readingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_right'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, BR, BR, BR, BR, p.skin, _],
    [_, _, BR, BR, W, BR, _, _],                    // page turning
    [_, _, '#5A3010', BR, BR, '#5A3010', _, _],
  ],
  makeLegsStand(p),
);

// ─ WRITING / CODING ─────────────────────────────────────────
// Leaning forward at keyboard, focused (tilted head forward)
const writingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  makeBody(p, 'typing'),
  makeLegssSit(p),
);

const writingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'closed'),  // blink
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, DG, DG, DG, DG, p.skin, p.skin],   // hand moved
    [p.skin, _, DG, DG, DG, DG, _, _],
    [GN, BL, BL, _, GN, BL, BL, GN],
  ],
  makeLegssSit(p),
);

// ─ SEARCHING ────────────────────────────────────────────────
// Magnifying glass — 3-shade lens, wooden handle
const searchingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_right'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.skin, CY, CY],  // lens circle
    [_, _, p.shirt, p.shirt, p.skin, _, CY, CY],
    [_, _, _, _, _, BR, BR, _],   // handle
  ],
  makeLegsStand(p),
);

const searchingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_left'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [CY, CY, p.skin, p.shirt, p.shirt, p.skin, _, _],  // lens other side
    [CY, CY, _, p.skin, p.shirt, p.shirt, _, _],
    [_, BR, BR, _, _, _, _, _],
  ],
  makeLegsStand(p),
);

// ─ TESTING ──────────────────────────────────────────────────
// Test tube with green liquid and PICO-8 green sparks
const testingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, YL],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, GN, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, GN, GN, YL],  // test tube
    [_, _, p.shirt, p.shirt, _, p.skin, GN, _],
    [_, _, _, _, _, _, GN, _],  // tube bottom
  ],
  makeLegsStand(p),
);

const testingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, YL, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, GN, YL],
    [_, p.skin, p.shirt, p.shirt, GN, GN, GN, _],
    [_, _, p.shirt, p.shirt, _, p.skin, GN, _],
    [_, _, _, _, _, _, GN, _],
  ],
  makeLegsStand(p),
);

// ─ RUNNING (script execution) ────────────────────────────────
// Spinning gear beside character (PICO-8 gray tones)
const runningSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, GR],   // gear top
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, GR, LG],      // gear body
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, GR],
    [_, _, p.shirt, p.shirt, p.shirt, p.skin, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  makeLegsStand(p),
);

const runningSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [GR, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],   // gear other side
    [LG, GR, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [GR, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
    [_, _, p.skin, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  makeLegsStand(p),
);

// ─ MESSAGING / PHONE CALL ────────────────────────────────────
// Phone held to ear with animated speech wave lines
const phoneSpriteA: SpriteTemplate = (p) => makeFullSprite(
  [
    [_, _, p.hairHi, p.hair, p.hair, p.hairHi, _, _],
    [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
    [_, p.hair, p.skin, W, p.skin, W, DG, _],   // phone at right ear
    [_, _, p.skin, K, p.skin, p.skin, DG, _],    // hand holding phone
  ],
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, DG, _, _],   // phone shadow on shirt
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.skin, _, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  makeLegsStand(p),
);

const phoneSpriteB: SpriteTemplate = (p) => makeFullSprite(
  [
    [_, _, p.hairHi, p.hair, p.hair, p.hairHi, _, _],
    [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
    [_, p.hair, p.skin, W, p.skin, p.skin, DG, _],   // phone up
    [_, _, p.skin, K, K, p.skin, DG, _],              // different expression
  ],
  [
    [_, _, p.shirtHi, p.shirtHi, DG, DG, _, _],      // phone moved
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.skin, _, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  makeLegsStand(p),
);

// ─ DEPLOYING ────────────────────────────────────────────────
// Rocket launching beside — PICO-8 red/orange flames, white nose
const deployingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, W],    // rocket tip
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, LG],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, LG],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, RD],  // exhaust start
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, OG], // flame
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, RD],
    [_, p.pants, p.pants, _, _, p.pants, p.pants, OG],
    [_, p.pantsSh, p.pants, _, _, p.pants, p.pantsSh, YL],
    [_, K, K, _, _, K, K, _],
  ],
);

const deployingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, W],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, LG],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, LG],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, OG],  // alternate flame
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, YL],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, OG],
    [_, p.pants, p.pants, _, _, p.pants, p.pants, RD],
    [_, p.pantsSh, p.pants, _, _, p.pants, p.pantsSh, OG],
    [_, K, K, _, _, K, K, _],
  ],
);

// ─ DEBUGGING ────────────────────────────────────────────────
// Wrench + magnifier, animated bug being squished
const debuggingSpriteA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [GR, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, CY],  // wrench + lens
    [GR, _, p.shirt, p.shirt, p.shirt, _, _, CY],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, RD, p.pants, _, _, p.pants, _, _],   // bug pixel
    [_, p.pantsSh, p.pants, _, _, p.pants, p.pantsSh, _],
    [_, K, K, _, _, K, K, _],
  ],
);

const debuggingSpriteB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_right'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, GR, CY],
    [_, _, p.shirt, p.shirt, p.shirt, _, GR, CY],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, p.pants, _, RD, p.pants, _, _],  // bug squished (moved)
    [_, p.pantsSh, p.pants, _, _, p.pants, p.pantsSh, _],
    [_, K, YL, _, _, K, K, _],              // squish spark
  ],
);

// ─ CELEBRATING ──────────────────────────────────────────────
// Star eyes, arms raised, PICO-8 confetti in all directions
const celebratingSpriteA: SpriteTemplate = (p) => [
  [YL, _, MG, _, _, PU, _, CY],   // row 0: confetti burst
  [_, MG, p.hairHi, p.hair, p.hair, p.hairHi, YL, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, YL, p.skin, YL, p.hair, _],   // star eyes!
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [p.skin, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, p.skin], // arms up
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, _, p.pants, p.pants, _, p.pants, _],  // jumping legs
  [_, K, _, _, _, _, K, _],
];

const celebratingSpriteB: SpriteTemplate = (p) => [
  [_, CY, _, YL, MG, _, PU, _],   // confetti shifted
  [CY, _, p.hairHi, p.hair, p.hair, p.hairHi, _, YL],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, YL, p.skin, YL, p.hair, _],   // still star eyes
  [_, _, p.skin, p.skin, p.skin, p.skin, _, _],
  [_, p.skin, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, p.skin, _], // wider arms
  [p.skin, _, p.shirt, p.shirt, p.shirt, p.shirt, _, p.skin],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ─ ERROR ────────────────────────────────────────────────────
// X eyes, PICO-8 red error symbols, gray smoke
const errorSpriteA: SpriteTemplate = (p) => [
  [_, _, RD, _, _, RD, _, _],   // large X above head
  [_, _, _, RD, RD, _, _, _],
  [_, _, p.hairHi, p.hair, p.hair, p.hairHi, _, GR],  // smoke puff
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.skin, RD, p.skin, RD, p.hair, GR],    // X eyes
  [_, _, RD, p.skin, p.skin, RD, _, _],                // X continues
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

const errorSpriteB: SpriteTemplate = (p) => [
  [_, RD, _, _, _, _, RD, _],   // X shifted
  [_, _, RD, _, _, RD, _, _],
  [_, _, p.hairHi, p.hair, p.hair, p.hairHi, GR, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, GR],
  [_, p.hair, p.skin, RD, p.skin, RD, p.hair, _],
  [_, _, RD, p.skin, p.skin, RD, _, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, K, _, _, K, _, _],
];

// ──────────────────────────────────────────────────────────────
// WALK CYCLES — Professional 4-keyframe technique:
//   Frame A: Contact (leading foot strikes ground, opposite arm forward)
//   Frame B: Down    (weight on front foot, other leg lifts)
//   Frame C: Passing (legs cross, arms at sides)
//   Frame D: Up      (trailing foot lifts, momentum forward)
// ──────────────────────────────────────────────────────────────

// ─ WALK RIGHT ───────────────────────────────────────────────

// Frame A: Right foot contact — left arm forward
const walkRightA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],  // right arm back
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],  // left arm forward
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, p.pantsSh, p.pants, p.pants, _, _, _, _],   // right leg forward
    [_, p.pantsSh, p.pants, _, _, _, p.pants, _],
    [_, K, K, _, _, _, K, _],
  ],
);

// Frame B: Down position — body at lowest point
const walkRightB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'closed'),  // eyes closed from impact
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, _, p.pants, p.pants, _, _, _],   // legs together
    [_, _, _, p.pants, _, _, p.pants, _],
    [_, _, _, K, _, _, K, _],
  ],
);

// Frame C: Passing — legs cross, arms swing back to center
const walkRightC: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],  // arms centered
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, p.pants, p.pants, _, _, _, _],   // left leg now forward
    [_, p.pantsSh, p.pants, _, _, _, p.pants, _],
    [_, K, K, _, _, _, K, _],
  ],
);

// Frame D: Up — opposite foot contact
const walkRightD: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],  // left arm forward
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, _, _, p.pants, p.pants, _, _],   // left foot leads
    [_, p.pants, _, _, _, p.pants, _, _],
    [_, K, _, _, _, K, _, _],
  ],
);

// ─ WALK LEFT ────────────────────────────────────────────────
// Mirror of walk right (eyes look left)
const walkLeftA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_left'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],  // left arm back
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],  // right arm forward
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, _, _, p.pants, p.pants, p.pantsSh, _],   // left foot forward
    [_, p.pants, _, _, _, p.pants, p.pantsSh, _],
    [_, K, _, _, _, K, K, _],
  ],
);

const walkLeftB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'closed'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, _, p.pants, p.pants, _, _, _],
    [_, p.pants, _, p.pants, _, _, p.pants, _],
    [_, K, _, K, _, _, K, _],
  ],
);

const walkLeftC: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_left'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, _, _, _, p.pants, p.pants, _],  // right leg now forward
    [_, p.pants, _, _, _, p.pants, p.pantsSh, _],
    [_, K, _, _, _, K, K, _],
  ],
);

const walkLeftD: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'looking_left'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, p.pants, p.pants, _, _, _, _, _],   // right foot leads
    [_, p.pantsSh, _, _, _, _, p.pants, _],
    [_, K, _, _, _, _, K, _],
  ],
);

// ─ WALK UP (back of head — walking away) ────────────────────
const walkUpA: SpriteTemplate = (p) => [
  [_, _, p.hairHi, p.hair,  p.hair,  p.hairHi,_, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],  // full back of head
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, _, _],  // arm swing
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, p.pants, p.pants, _, _, _, p.pants, _],   // stride
  [_, K, K, _, _, _, K, _],
];

const walkUpB: SpriteTemplate = (p) => [
  [_, _, p.hairHi, p.hair,  p.hair,  p.hairHi,_, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, p.hair, p.hair, p.hair, p.hair, p.hair, p.hair, _],
  [_, _, p.hair, p.hair, p.hair, p.hair, _, _],
  [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
  [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],  // opposite arm
  [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
  [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
  [_, _, p.pants, _, _, p.pants, p.pants, _],   // opposite stride
  [_, _, K, _, _, K, K, _],
];

// ─ WALK DOWN (facing viewer) ─────────────────────────────────
const walkDownA: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'open'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [p.skin, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, p.skin],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, p.pants, p.pants, _, _, _, p.pants, _],
    [_, p.pantsSh, p.pants, _, _, _, p.pants, _],
    [K, _, K, _, _, _, K, _],
  ],
);

const walkDownB: SpriteTemplate = (p) => makeFullSprite(
  makeHead(p, 'closed'),
  [
    [_, _, p.shirtHi, p.shirtHi, p.shirtHi, p.shirtHi, _, _],
    [_, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, p.shirt, _],
    [_, p.skin, p.shirt, p.shirt, p.shirt, p.shirt, p.skin, _],
    [_, _, p.shirt, p.shirt, p.shirt, p.shirt, _, _],
    [_, _, p.shirtSh, p.shirt, p.shirt, p.shirtSh, _, _],
  ],
  [
    [_, _, p.pants, p.pants, p.pants, p.pants, _, _],
    [_, _, p.pants, _, _, p.pants, _, _],
    [_, p.pants, _, _, _, _, p.pants, _],
    [_, K, _, _, _, _, K, _],
  ],
);

// ──────────────────────────────────────────────────────────────
// Sprite registry
// ──────────────────────────────────────────────────────────────

export type SpriteState =
  | ActivityState
  | 'walk_left' | 'walk_right' | 'walk_up' | 'walk_down'
  | 'sitting' | 'phone';

const SPRITE_TEMPLATES: Record<string, SpriteTemplate[]> = {
  // Activity states
  idle:        [sittingSpriteA, sittingSpriteB],        // idle = sitting at desk
  thinking:    [thinkingSpriteA, thinkingSpriteB],
  reading:     [readingSpriteA, readingSpriteB],
  writing:     [writingSpriteA, writingSpriteB],
  searching:   [searchingSpriteA, searchingSpriteB],
  testing:     [testingSpriteA, testingSpriteB],
  running:     [runningSpriteA, runningSpriteB],
  messaging:   [phoneSpriteA, phoneSpriteB],            // messaging = phone call
  deploying:   [deployingSpriteA, deployingSpriteB],
  debugging:   [debuggingSpriteA, debuggingSpriteB],
  celebrating: [celebratingSpriteA, celebratingSpriteB],
  error:       [errorSpriteA, errorSpriteB],
  // Special poses
  sitting:     [sittingSpriteA, sittingSpriteB],
  phone:       [phoneSpriteA, phoneSpriteB],
  // Walk cycles (4 keyframes each, professional contact→down→passing→up)
  walk_right:  [walkRightA, walkRightB, walkRightC, walkRightD],
  walk_left:   [walkLeftA,  walkLeftB,  walkLeftC,  walkLeftD ],
  walk_up:     [walkUpA,    walkUpB,    walkUpA,    walkUpB   ],
  walk_down:   [walkDownA,  walkDownB,  walkDownA,  walkDownB ],
};

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

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
