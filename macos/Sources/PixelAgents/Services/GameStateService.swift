import Foundation

// MARK: - Game State Service

@MainActor
@Observable
final class GameStateService {
    var gameState: GameState = .empty
    private var isDirty = false
    private let fileManager = FileManager.default

    // MARK: - Persistence Path

    private var basePath: String {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return "\(home)/.claude/pixel-agents"
    }

    private func statePath(teamName: String) -> String {
        "\(basePath)/\(teamName).json"
    }

    // MARK: - Load / Save

    func loadState(teamName: String) async {
        let path = statePath(teamName: teamName)

        // Ensure directory exists
        try? fileManager.createDirectory(atPath: basePath, withIntermediateDirectories: true)

        if let data = fileManager.contents(atPath: path) {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            if let state = try? decoder.decode(GameState.self, from: data) {
                gameState = state
                return
            }
        }

        // Start fresh
        gameState = GameState(teamName: teamName)
    }

    func saveState() async {
        guard isDirty else { return }

        let path = statePath(teamName: gameState.teamName)
        try? fileManager.createDirectory(atPath: basePath, withIntermediateDirectories: true)

        gameState.lastUpdated = Date()
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        if let data = try? encoder.encode(gameState) {
            fileManager.createFile(atPath: path, contents: data)
        }
        isDirty = false
    }

    // MARK: - Grant XP

    func grantXp(agent: String, action: XpAction) {
        var data = gameState.agents[agent] ?? AgentGameData(agentName: agent)

        data.xp += action.xpValue

        // Update counters
        switch action {
        case .taskStarted: break
        case .taskCompleted: data.tasksDone += 1
        case .messageSent: data.messagesSent += 1
        case .fileWritten: data.filesWritten += 1
        case .fileRead: data.filesRead += 1
        case .testExecuted: data.tasksDone += 1 // counts as task work
        case .deployCompleted: data.tasksDone += 1
        }

        // Recalculate level
        let levelDef = LevelDefinition.forXp(data.xp)
        data.level = levelDef.level
        data.title = levelDef.title

        gameState.agents[agent] = data
        isDirty = true
    }

    // MARK: - Check Achievements

    func checkAchievements(agent: String) -> [String] {
        guard var data = gameState.agents[agent] else { return [] }

        var newAchievements: [String] = []
        for achievement in GameAchievement.allAchievements {
            if !data.achievements.contains(achievement.id) && achievement.condition(data) {
                data.achievements.append(achievement.id)
                newAchievements.append(achievement.id)
            }
        }

        if !newAchievements.isEmpty {
            gameState.agents[agent] = data
            isDirty = true
        }

        return newAchievements
    }

    // MARK: - Update Zone

    func updateZone(agent: String, activity: ActivityType) {
        guard var data = gameState.agents[agent] else { return }

        let newZone: ZoneId
        switch activity {
        case .thinking: newZone = .planning
        case .writing: newZone = .coding
        case .reading: newZone = .library
        case .testing: newZone = .testing
        case .deploying: newZone = .deploying
        case .messaging: newZone = .comms
        case .searching: newZone = .library
        case .debugging: newZone = .workshop
        case .running: newZone = .coding
        case .idle: newZone = .lounge
        case .done: newZone = .lounge
        case .error: newZone = .workshop
        }

        if data.currentZone != newZone {
            data.currentZone = newZone
            gameState.agents[agent] = data
            isDirty = true
        }
    }

    // MARK: - Sync from Activities

    /// Sync game state from current team activities and tasks
    func syncFromActivities(activities: [AgentActivity], tasks: [AgentTask], messages: [InboxMessage]) {
        for activity in activities {
            let name = activity.agentName

            // Ensure agent exists in game state
            if gameState.agents[name] == nil {
                gameState.agents[name] = AgentGameData(agentName: name)
            }

            // Update zone based on current activity
            updateZone(agent: name, activity: activity.currentAction)

            // Sync task counts
            if let data = gameState.agents[name] {
                let agentTasks = tasks.filter { $0.owner == name }
                let completedCount = agentTasks.filter { $0.status == .completed }.count
                let agentMessages = messages.filter { $0.from == name && !$0.isProtocolMessage }.count

                // Only grant XP for new completions
                let prevCompleted = data.tasksDone
                if completedCount > prevCompleted {
                    let newCompletions = completedCount - prevCompleted
                    for _ in 0..<newCompletions {
                        grantXp(agent: name, action: .taskCompleted)
                    }
                }

                // Sync message count
                if agentMessages > data.messagesSent {
                    let newMessages = agentMessages - data.messagesSent
                    for _ in 0..<newMessages {
                        grantXp(agent: name, action: .messageSent)
                    }
                }

                // Sync file reads/writes from activity
                if activity.totalLinesAdded > 0 {
                    let approxFiles = max(1, activity.totalLinesAdded / 50)
                    if approxFiles > data.filesWritten {
                        let newWrites = approxFiles - data.filesWritten
                        for _ in 0..<newWrites {
                            grantXp(agent: name, action: .fileWritten)
                        }
                    }
                }

                // Check achievements
                _ = checkAchievements(agent: name)
            }
        }
    }

    // MARK: - Helpers

    func agentData(for name: String) -> AgentGameData {
        gameState.agents[name] ?? AgentGameData(agentName: name)
    }

    var totalXp: Int {
        gameState.agents.values.reduce(0) { $0 + $1.xp }
    }

    var totalAchievements: Int {
        gameState.agents.values.reduce(0) { $0 + $1.achievements.count }
    }

    var highestLevel: Int {
        gameState.agents.values.map(\.level).max() ?? 1
    }
}
