import Foundation

// MARK: - Team Lifecycle Status

enum TeamLifecycleStatus: String, Codable, Sendable {
    case active
    case idle
    case completed
    case stale
}

// MARK: - Team Freshness

struct TeamFreshness: Sendable {
    let latestActivity: Date
    let hasActiveTasks: Bool
    let allTasksCompleted: Bool
    let totalTasks: Int
}

// MARK: - Team Status Thresholds

enum TeamStatusThresholds {
    /// A team is active if its latest activity is within this window
    static let activeWindow: TimeInterval = 5 * 60 // 5 minutes

    /// Completed teams are removed from the active list after this grace period
    static let completedGrace: TimeInterval = 5 * 60 // 5 minutes

    /// Teams with no activity for this long are considered stale
    static let staleAge: TimeInterval = 15 * 60 // 15 minutes
}
