// Zone tile patterns — each tile is a 4x4 pixel pattern that repeats across the zone floor

import type { PixelGrid } from './PixelCanvas.js';

/**
 * Tile patterns for each zone type.
 * Each tile is a 4x4 grid of hex colors forming a repeating floor texture.
 */
export const ZONE_TILES: Record<string, PixelGrid> = {
  // Planning zone: blue grid lines on light blue
  planning: [
    ['#2A4A6B', '#3B5E80', '#3B5E80', '#2A4A6B'],
    ['#3B5E80', '#4A7A9B', '#4A7A9B', '#3B5E80'],
    ['#3B5E80', '#4A7A9B', '#4A7A9B', '#3B5E80'],
    ['#2A4A6B', '#3B5E80', '#3B5E80', '#2A4A6B'],
  ],

  // Coding zone: dark green with matrix-rain style vertical streaks
  coding: [
    ['#0A1A0A', '#0D2B0D', '#0A1A0A', '#0D2B0D'],
    ['#0D2B0D', '#0A1A0A', '#1A3A1A', '#0A1A0A'],
    ['#0A1A0A', '#1A3A1A', '#0A1A0A', '#0D2B0D'],
    ['#0D2B0D', '#0A1A0A', '#0D2B0D', '#0A1A0A'],
  ],

  // Testing zone: yellow-amber lab floor with checker pattern
  testing: [
    ['#3D3520', '#4A4028', '#3D3520', '#4A4028'],
    ['#4A4028', '#3D3520', '#4A4028', '#3D3520'],
    ['#3D3520', '#4A4028', '#3D3520', '#4A4028'],
    ['#4A4028', '#3D3520', '#4A4028', '#3D3520'],
  ],

  // Deploying zone: metallic orange/gray platform with rivets
  deploying: [
    ['#5A4030', '#6B5040', '#6B5040', '#5A4030'],
    ['#6B5040', '#7D6050', '#6B5040', '#6B5040'],
    ['#6B5040', '#6B5040', '#7D6050', '#6B5040'],
    ['#5A4030', '#6B5040', '#6B5040', '#5A4030'],
  ],

  // Comms zone: cyan waves pattern
  comms: [
    ['#0A2A3A', '#0D3A4A', '#1A4A5A', '#0D3A4A'],
    ['#0D3A4A', '#1A4A5A', '#0D3A4A', '#0A2A3A'],
    ['#1A4A5A', '#0D3A4A', '#0A2A3A', '#0D3A4A'],
    ['#0D3A4A', '#0A2A3A', '#0D3A4A', '#1A4A5A'],
  ],

  // Lounge zone: warm wood floor
  lounge: [
    ['#5A3A20', '#6B4A30', '#6B4A30', '#5A3A20'],
    ['#6B4A30', '#7D5A40', '#7D5A40', '#6B4A30'],
    ['#5A3A20', '#6B4A30', '#6B4A30', '#5A3A20'],
    ['#6B4A30', '#7D5A40', '#7D5A40', '#6B4A30'],
  ],

  // Library zone: dark blue bookshelf rows
  library: [
    ['#1A1A3A', '#2A2A4A', '#2A2A4A', '#1A1A3A'],
    ['#2A2A4A', '#1A1A3A', '#1A1A3A', '#2A2A4A'],
    ['#1A1A3A', '#2A2A4A', '#2A2A4A', '#1A1A3A'],
    ['#2A2A4A', '#3A3A5A', '#3A3A5A', '#2A2A4A'],
  ],

  // Workshop zone: gray metal floor with bolts
  workshop: [
    ['#3A3A3A', '#4A4A4A', '#4A4A4A', '#3A3A3A'],
    ['#4A4A4A', '#5A5A5A', '#4A4A4A', '#4A4A4A'],
    ['#4A4A4A', '#4A4A4A', '#5A5A5A', '#4A4A4A'],
    ['#3A3A3A', '#4A4A4A', '#4A4A4A', '#3A3A3A'],
  ],
};

/**
 * Generate a full zone background by tiling the zone's pattern across the given dimensions.
 *
 * @param zoneId - the zone identifier matching a key in ZONE_TILES
 * @param width - total width in pixels
 * @param height - total height in pixels
 * @returns a PixelGrid of the specified dimensions
 */
export function generateZoneBackground(
  zoneId: string,
  width: number,
  height: number,
): PixelGrid {
  const tile = ZONE_TILES[zoneId] ?? ZONE_TILES['coding']!;
  const tileH = tile.length;
  const tileW = tileH > 0 ? (tile[0]?.length ?? 0) : 0;

  if (tileW === 0 || tileH === 0) {
    // Fallback: solid dark background
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
