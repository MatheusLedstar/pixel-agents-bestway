import SwiftUI

// MARK: - XP Action

enum XpAction: String, Codable, Sendable {
    case taskStarted = "task_started"
    case taskCompleted = "task_completed"
    case messageSent = "message_sent"
    case fileWritten = "file_written"
    case fileRead = "file_read"
    case testExecuted = "test_executed"
    case deployCompleted = "deploy_completed"

    var xpValue: Int {
        switch self {
        case .taskStarted: return 10
        case .taskCompleted: return 50
        case .messageSent: return 5
        case .fileWritten: return 3
        case .fileRead: return 2
        case .testExecuted: return 20
        case .deployCompleted: return 30
        }
    }
}

// MARK: - Agent Game Data

struct AgentGameData: Codable, Sendable, Equatable {
    var agentName: String
    var xp: Int
    var level: Int
    var title: String
    var currentZone: ZoneId
    var achievements: [String]
    var tasksDone: Int
    var messagesSent: Int
    var filesRead: Int
    var filesWritten: Int

    init(agentName: String, xp: Int = 0, level: Int = 1, title: String = "Recruit",
         currentZone: ZoneId = .lounge, achievements: [String] = [],
         tasksDone: Int = 0, messagesSent: Int = 0, filesRead: Int = 0, filesWritten: Int = 0) {
        self.agentName = agentName
        self.xp = xp
        self.level = level
        self.title = title
        self.currentZone = currentZone
        self.achievements = achievements
        self.tasksDone = tasksDone
        self.messagesSent = messagesSent
        self.filesRead = filesRead
        self.filesWritten = filesWritten
    }
}

// MARK: - Zone ID

enum ZoneId: String, Codable, CaseIterable, Sendable {
    case planning
    case coding
    case testing
    case deploying
    case comms
    case lounge
    case library
    case workshop

    var displayName: String {
        switch self {
        case .planning: return "Planning"
        case .coding: return "Coding"
        case .testing: return "Testing"
        case .deploying: return "Deploy"
        case .comms: return "Comms"
        case .lounge: return "Lounge"
        case .library: return "Library"
        case .workshop: return "Workshop"
        }
    }

    var themeColor: Color {
        switch self {
        case .planning: return PixelTheme.purple
        case .coding: return PixelTheme.green
        case .testing: return PixelTheme.yellow
        case .deploying: return PixelTheme.accentOrange
        case .comms: return PixelTheme.blue
        case .lounge: return Color(hex: 0x6B7280)
        case .library: return Color(hex: 0x06B6D4)
        case .workshop: return Color(hex: 0xEC4899)
        }
    }

    var icon: String {
        switch self {
        case .planning: return "map"
        case .coding: return "chevron.left.forwardslash.chevron.right"
        case .testing: return "checkmark.shield"
        case .deploying: return "arrow.up.circle"
        case .comms: return "bubble.left.and.bubble.right"
        case .lounge: return "cup.and.saucer"
        case .library: return "books.vertical"
        case .workshop: return "wrench.and.screwdriver"
        }
    }
}

// MARK: - Level Definition

struct LevelDefinition: Sendable {
    let level: Int
    let xpRequired: Int
    let title: String

    static let levels: [LevelDefinition] = [
        LevelDefinition(level: 1, xpRequired: 0, title: "Recruit"),
        LevelDefinition(level: 2, xpRequired: 100, title: "Developer"),
        LevelDefinition(level: 3, xpRequired: 300, title: "Senior Dev"),
        LevelDefinition(level: 4, xpRequired: 600, title: "Tech Lead"),
        LevelDefinition(level: 5, xpRequired: 1000, title: "Architect"),
        LevelDefinition(level: 6, xpRequired: 1500, title: "CTO"),
        LevelDefinition(level: 7, xpRequired: 2500, title: "Legend"),
    ]

    static func forXp(_ xp: Int) -> LevelDefinition {
        var result = levels[0]
        for def in levels {
            if xp >= def.xpRequired {
                result = def
            } else {
                break
            }
        }
        return result
    }

    static func xpForNextLevel(_ currentXp: Int) -> Int? {
        for def in levels where def.xpRequired > currentXp {
            return def.xpRequired
        }
        return nil // Max level
    }
}

// MARK: - Game Achievement

struct GameAchievement: Identifiable, Sendable {
    let id: String
    let name: String
    let description: String
    let badgeColor: Color
    let condition: @Sendable (AgentGameData) -> Bool

    static let allAchievements: [GameAchievement] = [
        GameAchievement(
            id: "first_task",
            name: "First Task",
            description: "Complete your first task",
            badgeColor: PixelTheme.green,
            condition: { $0.tasksDone >= 1 }
        ),
        GameAchievement(
            id: "task_master",
            name: "Task Master",
            description: "Complete 10 tasks",
            badgeColor: PixelTheme.accentOrange,
            condition: { $0.tasksDone >= 10 }
        ),
        GameAchievement(
            id: "chatterbox",
            name: "Chatterbox",
            description: "Send 50 messages",
            badgeColor: PixelTheme.purple,
            condition: { $0.messagesSent >= 50 }
        ),
        GameAchievement(
            id: "bookworm",
            name: "Bookworm",
            description: "Read 100 files",
            badgeColor: PixelTheme.blue,
            condition: { $0.filesRead >= 100 }
        ),
        GameAchievement(
            id: "prolific_writer",
            name: "Prolific Writer",
            description: "Write 50 files",
            badgeColor: PixelTheme.green,
            condition: { $0.filesWritten >= 50 }
        ),
        GameAchievement(
            id: "level_5",
            name: "Architect",
            description: "Reach level 5",
            badgeColor: PixelTheme.yellow,
            condition: { $0.level >= 5 }
        ),
        GameAchievement(
            id: "legend",
            name: "Legend",
            description: "Reach level 7",
            badgeColor: Color(hex: 0xFFD700),
            condition: { $0.level >= 7 }
        ),
    ]
}

// MARK: - Game State

struct GameState: Codable, Sendable, Equatable {
    var agents: [String: AgentGameData]
    var teamName: String
    var lastUpdated: Date

    init(teamName: String = "", agents: [String: AgentGameData] = [:]) {
        self.teamName = teamName
        self.agents = agents
        self.lastUpdated = Date()
    }

    static var empty: GameState {
        GameState()
    }
}
