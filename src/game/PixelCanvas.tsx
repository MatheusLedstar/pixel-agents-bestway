// Pixel art renderer using ANSI half-block characters (U+2580 Upper Half Block)
// Each terminal cell displays 2 pixel rows: top pixel as foreground, bottom pixel as background

import React from 'react';
import { Text } from 'ink';

// Grid where grid[y][x] = hex color string ('#FF0000') or null (transparent)
export type PixelGrid = (string | null)[][];

interface PixelCanvasProps {
  pixels: PixelGrid;
  bgColor?: string; // default background hex color
}

/**
 * Convert hex color string to RGB tuple.
 * Supports both '#RGB' and '#RRGGBB' formats.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    return [r, g, b];
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Generate ANSI escape sequence for a half-block character pair.
 * Upper half block (U+2580) uses foreground for top pixel, background for bottom pixel.
 *
 * @param topColor - hex color for upper pixel, or null for transparent
 * @param bottomColor - hex color for lower pixel, or null for transparent
 * @param bg - fallback background hex color
 * @returns ANSI-escaped string representing one character cell
 */
export function renderHalfBlock(
  topColor: string | null,
  bottomColor: string | null,
  bg?: string,
): string {
  const top = topColor ?? bg;
  const bottom = bottomColor ?? bg;

  // Both transparent — render a space
  if (!top && !bottom) {
    return ' ';
  }

  // Both have colors — full half-block with fg (top) and bg (bottom)
  if (top && bottom) {
    const [tr, tg, tb] = hexToRgb(top);
    const [br, bg2, bb] = hexToRgb(bottom);
    return `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg2};${bb}m\u2580\x1b[0m`;
  }

  // Only top has color — use foreground only, reset background
  if (top && !bottom) {
    const [tr, tg, tb] = hexToRgb(top);
    return `\x1b[38;2;${tr};${tg};${tb}m\u2580\x1b[0m`;
  }

  // Only bottom has color — use lower half block with foreground
  if (!top && bottom) {
    const [br, bg2, bb] = hexToRgb(bottom);
    return `\x1b[38;2;${br};${bg2};${bb}m\u2584\x1b[0m`;
  }

  return ' ';
}

/**
 * Render a full pixel grid into an array of ANSI strings (one per terminal row).
 * Each terminal row represents 2 pixel rows via half-block encoding.
 */
export function renderPixelGrid(pixels: PixelGrid, bgColor?: string): string[] {
  const height = pixels.length;
  const width = height > 0 ? (pixels[0]?.length ?? 0) : 0;
  const lines: string[] = [];

  // Process 2 pixel rows at a time
  for (let y = 0; y < height; y += 2) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const topPixel = pixels[y]?.[x] ?? null;
      const bottomPixel = (y + 1 < height ? pixels[y + 1]?.[x] : null) ?? null;
      line += renderHalfBlock(topPixel, bottomPixel, bgColor);
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Scale a PixelGrid by a given integer factor.
 * scale=2 → each pixel becomes 2×2 pixels (2 wide terminal chars, 1 terminal row).
 * scale=3 → each pixel becomes 3 wide terminal chars.
 */
export function scalePixelGrid(grid: PixelGrid, scaleX: number, scaleY: number = 1): PixelGrid {
  const result: PixelGrid = [];
  for (const row of grid) {
    for (let ry = 0; ry < scaleY; ry++) {
      const scaled: (string | null)[] = [];
      for (const pixel of row) {
        for (let rx = 0; rx < scaleX; rx++) {
          scaled.push(pixel);
        }
      }
      result.push(scaled);
    }
  }
  return result;
}

/**
 * React/Ink component that renders a PixelGrid using half-block ANSI characters.
 */
export default function PixelCanvas({ pixels, bgColor }: PixelCanvasProps) {
  const lines = renderPixelGrid(pixels, bgColor);

  return (
    <>
      {lines.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
    </>
  );
}
