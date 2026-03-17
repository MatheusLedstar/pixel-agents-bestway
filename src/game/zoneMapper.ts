// Maps ActivityState to ZoneId for positioning agents on the game map

import type { ActivityState } from '../map/activityMapper.js';
import type { ZoneId } from './types.js';

/**
 * Determine which zone an agent should be in based on their current activity state.
 * Zone assignments reflect the nature of the activity:
 * - planning: thinking, strategizing
 * - coding: reading code, writing code
 * - testing: running tests, executing scripts
 * - deploying: shipping, publishing
 * - comms: messaging, delegating
 * - lounge: idle, relaxing, celebrating
 * - library: searching, researching
 * - workshop: debugging, fixing bugs, running tools
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

    case 'error':
      return 'workshop';

    case 'idle':
      return 'lounge';

    case 'celebrating':
      return 'lounge';

    default:
      return 'coding';
  }
}

/**
 * Returns the "home zone" for an agent type when they have no known activity.
 * Different agent types tend to gravitate to different areas.
 */
export function getDefaultZoneForAgentType(agentType: string): ZoneId {
  switch (agentType.toLowerCase()) {
    case 'meta-orchestrator':
    case 'tech-lead-gestor':
    case 'architect':
      return 'planning';

    case 'js-developer':
    case 'ts-developer':
    case 'python-developer':
    case 'go-developer':
    case 'rust-developer':
    case 'java-developer':
    case 'kotlin-developer':
    case 'csharp-developer':
    case 'swift-developer':
    case 'winforms-developer':
    case 'blazor-architect':
      return 'coding';

    case 'tester-qa':
    case 'qa-reviewer':
      return 'testing';

    case 'devops':
      return 'deploying';

    case 'security-expert':
      return 'workshop';

    case 'ux-designer':
    case 'api-designer':
      return 'library';

    case 'data-scientist':
    case 'ml-engineer':
      return 'library';

    case 'performance-optimizer':
      return 'workshop';

    default:
      return 'lounge';
  }
}
