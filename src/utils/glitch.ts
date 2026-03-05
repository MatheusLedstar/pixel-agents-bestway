// Deterministic glitch effects for cyberpunk aesthetic
// Uses seeded randomness so animations are consistent per-element

const GLITCH_CHARS = '░▒▓█╠╣◈◆▣⟐◉✦⬡▰▱';

/** Simple hash for deterministic pseudo-random */
function hash(seed: number, idx: number): number {
  let h = (seed * 2654435761 + idx * 340573321) >>> 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) >>> 0;
}

/**
 * Apply glitch effect to text — deterministically replaces chars
 * @param text - Source text
 * @param frame - Animation frame counter
 * @param intensity - 0..1, higher = more glitch chars
 * @param seed - Unique seed per component instance
 */
export function glitchText(text: string, frame: number, intensity = 0.1, seed = 42): string {
  if (intensity <= 0) return text;

  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === ' ') continue;
    const roll = (hash(seed + frame, i) % 1000) / 1000;
    if (roll < intensity) {
      const glyphIdx = hash(seed + frame * 7, i * 3) % GLITCH_CHARS.length;
      chars[i] = GLITCH_CHARS[glyphIdx]!;
    }
  }
  return chars.join('');
}

/**
 * Determine if element should flicker (dim) this frame
 * ~5% chance per frame, deterministic per seed
 */
export function shouldFlicker(frame: number, seed = 0): boolean {
  return (hash(seed, frame) % 100) < 5;
}

/**
 * Shift a border pattern by frame offset for animated edges
 * @param pattern - Base pattern chars (e.g., '░▒▓█')
 * @param width - Desired output width
 * @param frame - Animation frame
 */
export function shiftPattern(pattern: string, width: number, frame: number): string {
  const chars = [...pattern];
  const len = chars.length;
  if (len === 0) return '─'.repeat(width);

  let result = '';
  for (let i = 0; i < width; i++) {
    result += chars[(i + frame) % len];
  }
  return result;
}
