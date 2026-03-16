export interface Agent {
  agentId: string;
  name: string;
  agentType: string;
  model?: string;
  color?: string;
  isActive?: boolean;
}

export type TeamStatus = 'active' | 'idle' | 'completed' | 'stale';

export interface TeamFreshness {
  latestActivityMs: number;
  hasActiveTasks: boolean;
  allTasksCompleted: boolean;
  totalTasks: number;
}

export interface Team {
  name: string;
  description?: string;
  createdAt?: number;
  leadAgentId?: string;
  members: Agent[];
  status?: TeamStatus;
  lastActivity?: number;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  subject: string;
  description?: string;
  status: TaskStatus;
  owner?: string;
  activeForm?: string;
  blocks?: string[];
  blockedBy?: string[];
}

export interface Message {
  from: string;
  to?: string;
  text: string;
  timestamp: string;
  color?: string;
  read?: boolean;
  summary?: string;
}

export type ViewType = 'dashboard' | 'team-detail' | 'task-board' | 'messages' | 'agent-detail' | 'usage' | 'cross-team' | 'game-map';

// === Cross-Team Types (A2A-inspired) ===

export interface TeamCard {
  teamName: string;
  description?: string;
  leadAgent: string;
  memberCount: number;
  tasksSummary: { pending: number; in_progress: number; completed: number };
  status: 'active' | 'idle' | 'completed';
  registeredAt: number;
  lastHeartbeat: number;
}

export interface CrossTeamMessage {
  id: string;
  fromTeam: string;
  fromAgent: string;
  toTeam?: string;
  toAgent?: string;
  content: string;
  timestamp: string;
  type: 'message' | 'call_invite' | 'call_join' | 'call_leave' | 'status_update';
}

export interface CallParticipant {
  teamName: string;
  agentName: string;
  joinedAt: string;
}

export interface CrossTeamCall {
  id: string;
  startedAt: string;
  participants: CallParticipant[];
  topic?: string;
}

export interface CrossTeamData {
  registry: TeamCard[];
  messages: CrossTeamMessage[];
  activeCall: CrossTeamCall | null;
  loading: boolean;
}

export interface ModelUsage {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface UsageData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelBreakdowns: ModelUsage[];
  lastUpdated: Date;
  loading: boolean;
  error?: string;
}

export interface TeamTokens {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  totalTokens: number;       // input + output
  isReal: boolean;           // true if from JSONL, false if estimated
}

export { type AgentActivity, type TeamSessionData } from './sessionParser.js';

export interface AppState {
  currentView: ViewType;
  selectedTeam: string | null;
  selectedAgent: string | null;
  selectedIndex: number;
}
