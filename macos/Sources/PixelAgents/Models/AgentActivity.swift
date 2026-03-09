import Foundation

// MARK: - Agent Activity

struct AgentActivity: Identifiable, Equatable, Sendable {
    var id: String { agentName }
    let agentName: String
    let currentAction: ActivityType
    let currentFile: String?
    let totalLinesAdded: Int
    let totalLinesDeleted: Int
    let tokensUsed: Int
    let tasksCompleted: Int
    let tasksTotal: Int
    let lastActivity: Date?

    var taskProgress: Double {
        guard tasksTotal > 0 else { return 0 }
        return Double(tasksCompleted) / Double(tasksTotal)
    }

    var netLinesChanged: Int {
        totalLinesAdded - totalLinesDeleted
    }

    var hasLineData: Bool {
        totalLinesAdded > 0 || totalLinesDeleted > 0
    }

    /// Build AgentActivity from session entries, tasks, and messages
    static func from(agentName: String, entries: [SessionEntry], tasks: [AgentTask],
                     messages: [InboxMessage] = []) -> AgentActivity {
        let agentEntries = entries.filter { $0.agentName == agentName }

        let totalAdded = agentEntries.reduce(0) { $0 + $1.linesAdded }
        let totalDeleted = agentEntries.reduce(0) { $0 + $1.linesDeleted }
        let tokens = agentEntries.reduce(0) { $0 + $1.tokensUsed }

        let agentTasks = tasks.filter { $0.owner == agentName }
        let completed = agentTasks.filter { $0.status == .completed }.count
        let hasInProgress = agentTasks.contains { $0.status == .inProgress }

        // Agent's messages (sent by this agent), excluding protocol messages
        let agentMessages = messages.filter { $0.from == agentName && !$0.isProtocolMessage }
        let lastMessage = agentMessages.max(by: { $0.timestamp < $1.timestamp })

        // Determine current action from session entries first, then fall back to tasks+messages
        let currentAction: ActivityType
        let currentFile: String?
        let lastActivity: Date?

        if let lastEntry = agentEntries.last {
            // Session entries available: use them (original logic)
            currentFile = lastEntry.filePath
            lastActivity = lastEntry.timestamp
            switch lastEntry.type {
            case .toolUse:
                if let tool = lastEntry.toolName {
                    switch tool.lowercased() {
                    case "read", "glob", "grep": currentAction = .reading
                    case "write", "edit": currentAction = .writing
                    default: currentAction = .thinking
                    }
                } else {
                    currentAction = .thinking
                }
            case .text: currentAction = .thinking
            case .error: currentAction = .error
            case .toolResult, .unknown: currentAction = .idle
            }
        } else {
            // No session entries: derive from tasks and messages
            currentFile = nil
            lastActivity = lastMessage?.timestamp

            if completed == agentTasks.count && agentTasks.count > 0 {
                // All tasks completed
                currentAction = .done
            } else if hasInProgress {
                // Has in-progress tasks = actively working
                // Check if recently messaged (last 5 min) to determine sub-action
                let fiveMinAgo = Date().addingTimeInterval(-300)
                if let msg = lastMessage, msg.timestamp > fiveMinAgo {
                    currentAction = inferActionFromMessage(msg)
                } else {
                    currentAction = .writing
                }
            } else if let msg = lastMessage {
                // No own tasks but sent messages (e.g. team-lead assigning tasks)
                let fiveMinAgo = Date().addingTimeInterval(-300)
                if msg.timestamp > fiveMinAgo {
                    currentAction = inferActionFromMessage(msg)
                } else {
                    // Last message is old
                    if completed > 0 && agentTasks.allSatisfy({ $0.status == .completed || $0.status == .pending }) {
                        currentAction = .done
                    } else {
                        currentAction = .idle
                    }
                }
            } else {
                currentAction = .idle
            }
        }

        return AgentActivity(
            agentName: agentName,
            currentAction: currentAction,
            currentFile: currentFile,
            totalLinesAdded: totalAdded,
            totalLinesDeleted: totalDeleted,
            tokensUsed: tokens,
            tasksCompleted: completed,
            tasksTotal: agentTasks.count,
            lastActivity: lastActivity
        )
    }

    /// Infer action type from a message's content/type
    private static func inferActionFromMessage(_ msg: InboxMessage) -> ActivityType {
        guard let type = msg.parsedType else { return .messaging }
        switch type {
        case "task_assignment": return .messaging
        case "status_update": return .thinking
        case "completion_report": return .done
        default: return .messaging
        }
    }
}
