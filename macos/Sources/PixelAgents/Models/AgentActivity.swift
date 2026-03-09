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

    var taskProgress: Double {
        guard tasksTotal > 0 else { return 0 }
        return Double(tasksCompleted) / Double(tasksTotal)
    }

    var netLinesChanged: Int {
        totalLinesAdded - totalLinesDeleted
    }

    /// Build AgentActivity from session entries and tasks for a given agent
    static func from(agentName: String, entries: [SessionEntry], tasks: [AgentTask]) -> AgentActivity {
        let agentEntries = entries.filter { $0.agentName == agentName }

        let totalAdded = agentEntries.reduce(0) { $0 + $1.linesAdded }
        let totalDeleted = agentEntries.reduce(0) { $0 + $1.linesDeleted }
        let tokens = agentEntries.reduce(0) { $0 + $1.tokensUsed }

        let agentTasks = tasks.filter { $0.owner == agentName }
        let completed = agentTasks.filter { $0.status == .completed }.count

        // Determine current action from most recent entry
        let currentAction: ActivityType
        let currentFile: String?
        if let lastEntry = agentEntries.last {
            currentFile = lastEntry.filePath
            switch lastEntry.type {
            case .toolUse:
                if let tool = lastEntry.toolName {
                    switch tool.lowercased() {
                    case "read", "glob", "grep":
                        currentAction = .reading
                    case "write", "edit":
                        currentAction = .writing
                    default:
                        currentAction = .thinking
                    }
                } else {
                    currentAction = .thinking
                }
            case .text:
                currentAction = .thinking
            case .error:
                currentAction = .error
            case .toolResult, .unknown:
                currentAction = .idle
            }
        } else {
            currentAction = .idle
            currentFile = nil
        }

        return AgentActivity(
            agentName: agentName,
            currentAction: currentAction,
            currentFile: currentFile,
            totalLinesAdded: totalAdded,
            totalLinesDeleted: totalDeleted,
            tokensUsed: tokens,
            tasksCompleted: completed,
            tasksTotal: agentTasks.count
        )
    }
}
