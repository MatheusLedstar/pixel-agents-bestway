// Maps ActivityState to ZoneId for positioning agents on the game map

import type { ActivityState } from '../map/activityMapper.js';
import type { ZoneId } from './types.js';

/**
 * Determine which zone an agent should be in based on their current activity state.
 */
export function mapActivityToZone(state: ActivityState): ZoneId {
  switch (state) {
    case 'thinking':
      return 'planning';
    case 'reading':
      return 'coding';
    case 'writing':
      return 'coding';
    case 'searching':
      return 'library';
    case 'running':
      return 'testing';
    case 'testing':
      return 'testing';
    case 'messaging':
      return 'comms';
    case 'deploying':
      return 'deploying';
    case 'debugging':
      return 'workshop';
    case 'idle':
      return 'lounge';
    case 'celebrating':
      return 'lounge';
    case 'error':
      return 'workshop';
    default:
      return 'coding';
  }
}
