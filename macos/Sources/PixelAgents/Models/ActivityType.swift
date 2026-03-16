import Foundation

// MARK: - Agent Status

enum AgentStatus: String, Codable, Equatable, Hashable, CaseIterable, Sendable {
    case active
    case idle
    case done
    case error
}

// MARK: - Task Status

enum TaskStatus: String, Codable, Equatable, Hashable, CaseIterable, Sendable {
    case pending
    case inProgress = "in_progress"
    case completed
}

// MARK: - Activity Type

enum ActivityType: String, Codable, Equatable, Hashable, CaseIterable, Sendable {
    case reading
    case writing
    case thinking
    case messaging
    case searching
    case testing
    case running
    case deploying
    case debugging
    case idle
    case done
    case error
}
