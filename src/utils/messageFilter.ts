import type { Message } from '../core/types.js';

// System message types to hide from feed
const HIDDEN_TYPES = new Set([
  'idle_notification',
  'shutdown_approved',
  'shutdown_request',
  'teammate_terminated',
]);

interface ParsedMessage {
  from: string;
  to?: string;
  text: string;
  timestamp: string;
  type?: string;
  isSystem: boolean;
}

function tryParseJson(text: string): Record<string, unknown> | null {
  if (!text.startsWith('{')) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseMessage(msg: Message): ParsedMessage {
  const json = tryParseJson(msg.text);

  if (json) {
    const type = String(json.type ?? '');

    if (HIDDEN_TYPES.has(type)) {
      return { ...msg, type, isSystem: true, text: '' };
    }

    // task_assignment → readable text
    if (type === 'task_assignment') {
      const subject = String(json.subject ?? json.taskId ?? '');
      return {
        ...msg,
        type,
        isSystem: false,
        text: `📋 Task assigned: ${subject}`,
      };
    }

    // task_completed
    if (type === 'task_completed') {
      const subject = String(json.subject ?? json.taskId ?? '');
      return {
        ...msg,
        type,
        isSystem: false,
        text: `✓ Task done: ${subject}`,
      };
    }

    // message type with content
    if (type === 'message' && json.content) {
      return {
        ...msg,
        type,
        isSystem: false,
        text: String(json.content),
        to: json.recipient ? String(json.recipient) : msg.to,
      };
    }

    // plan_approval_request
    if (type === 'plan_approval_request') {
      return { ...msg, type, isSystem: false, text: '📐 Plan submitted for approval' };
    }

    // Fallback: if has summary, use it
    if (json.summary) {
      return { ...msg, type, isSystem: false, text: String(json.summary) };
    }

    // Unknown JSON type - show type
    if (type) {
      return { ...msg, type, isSystem: true, text: '' };
    }
  }

  // Plain text message - use summary if available, else text
  return {
    ...msg,
    isSystem: false,
    text: msg.summary ?? msg.text,
  };
}

export function filterMessages(messages: Message[]): ParsedMessage[] {
  return messages
    .map(parseMessage)
    .filter((m) => !m.isSystem && m.text.length > 0);
}
