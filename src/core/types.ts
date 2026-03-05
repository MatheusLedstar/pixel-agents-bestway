export interface Agent {
  agentId: string;
  name: string;
  agentType: string;
  model?: string;
  color?: string;
  isActive?: boolean;
}

export interface Team {
  name: string;
  description?: string;
  createdAt?: number;
  leadAgentId?: string;
  members: Agent[];
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

export type ViewType = 'dashboard' | 'team-detail' | 'task-board' | 'messages' | 'agent-detail';

export interface AppState {
  currentView: ViewType;
  selectedTeam: string | null;
  selectedAgent: string | null;
  selectedIndex: number;
}
