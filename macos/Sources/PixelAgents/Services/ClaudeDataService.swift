import Foundation

// MARK: - Claude Data Service

@MainActor
@Observable
final class ClaudeDataService {
    // MARK: - Published State

    var teams: [TeamConfig] = []
    var selectedTeam: TeamConfig?
    var tasks: [AgentTask] = []
    var messages: [InboxMessage] = []
    var activities: [AgentActivity] = []
    var telemetry: TeamTelemetry = .empty
    var sessionEntries: [SessionEntry] = []
    var isLoading = false
    var lastError: String?
    private var isRefreshing = false
    /// Quick task count per team name (populated during loadTeams)
    var teamTaskCounts: [String: (pending: Int, inProgress: Int, completed: Int)] = [:]
    /// All discovered members (config + messages + tasks)
    var allMembers: [TeamMember] = []
    /// Global token usage from ccusage (today)
    var tokenUsage: TokenUsage = .empty

    // MARK: - Private

    private let claudeBasePath: String
    private let fileManager = FileManager.default
    private let decoder = JSONDecoder()
    private var watcher: FileWatcher?
    private var pollTask: Task<Void, Never>?
    private var tokenPollTask: Task<Void, Never>?
    private let tokenTracker = TokenTracker()

    // MARK: - Init

    init(basePath: String? = nil) {
        if let basePath {
            self.claudeBasePath = basePath
        } else {
            let homeURL = FileManager.default.homeDirectoryForCurrentUser
            self.claudeBasePath = homeURL.appendingPathComponent(".claude").path
        }
    }

    // MARK: - Paths

    private var teamsPath: String { "\(claudeBasePath)/teams" }
    private var tasksPath: String { "\(claudeBasePath)/tasks" }

    /// Sanitize a component name to prevent path traversal attacks.
    /// Rejects names containing path separators or parent directory references.
    static func sanitizeName(_ name: String) -> String? {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              !trimmed.contains("/"),
              !trimmed.contains("\\"),
              !trimmed.contains("\0"),
              trimmed != ".",
              trimmed != ".." else {
            return nil
        }
        return trimmed
    }

    private func teamConfigPath(_ teamName: String) -> String? {
        guard let safe = Self.sanitizeName(teamName) else { return nil }
        return "\(teamsPath)/\(safe)/config.json"
    }

    private func teamTasksPath(_ teamName: String) -> String? {
        guard let safe = Self.sanitizeName(teamName) else { return nil }
        return "\(tasksPath)/\(safe)"
    }

    private func teamInboxesPath(_ teamName: String) -> String? {
        guard let safe = Self.sanitizeName(teamName) else { return nil }
        return "\(teamsPath)/\(safe)/inboxes"
    }

    // MARK: - Load Teams

    func loadTeams() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let entries = try fileManager.contentsOfDirectory(atPath: teamsPath)
            var loadedTeams: [TeamConfig] = []

            for entry in entries {
                guard let configPath = teamConfigPath(entry) else { continue }
                guard fileManager.fileExists(atPath: configPath),
                      let data = fileManager.contents(atPath: configPath) else {
                    continue
                }
                do {
                    let team = try decoder.decode(TeamConfig.self, from: data)
                    loadedTeams.append(team)
                } catch {
                    // Skip malformed config files
                    continue
                }
            }

            teams = loadedTeams.sorted { ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast) }
            lastError = nil

            // Quick-scan task directories for all teams
            teamTaskCounts = [:]
            for team in teams {
                guard let taskDir = teamTasksPath(team.name),
                      fileManager.fileExists(atPath: taskDir) else { continue }
                guard let files = try? fileManager.contentsOfDirectory(atPath: taskDir) else { continue }
                var pending = 0, inProgress = 0, completed = 0
                for file in files where file.hasSuffix(".json") {
                    guard Self.sanitizeName(file) != nil else { continue }
                    let path = "\(taskDir)/\(file)"
                    guard let data = fileManager.contents(atPath: path) else { continue }
                    // Quick status extraction without full decode
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let status = json["status"] as? String {
                        switch status {
                        case "pending": pending += 1
                        case "in_progress": inProgress += 1
                        case "completed": completed += 1
                        default: break
                        }
                    }
                }
                teamTaskCounts[team.name] = (pending, inProgress, completed)
            }
        } catch {
            lastError = "Failed to load teams: \(error.localizedDescription)"
        }
    }

    // MARK: - Load Tasks

    func loadTasks(teamName: String) async {
        guard let taskDir = teamTasksPath(teamName) else {
            tasks = []
            return
        }

        guard fileManager.fileExists(atPath: taskDir) else {
            tasks = []
            return
        }

        do {
            let entries = try fileManager.contentsOfDirectory(atPath: taskDir)
            var loadedTasks: [AgentTask] = []

            for entry in entries where entry.hasSuffix(".json") {
                guard Self.sanitizeName(entry) != nil else { continue }
                let path = "\(taskDir)/\(entry)"
                guard let data = fileManager.contents(atPath: path) else { continue }
                do {
                    let task = try decoder.decode(AgentTask.self, from: data)
                    loadedTasks.append(task)
                } catch {
                    continue
                }
            }

            tasks = loadedTasks.sorted { lhs, rhs in
                (Int(lhs.id) ?? 0) < (Int(rhs.id) ?? 0)
            }
        } catch {
            tasks = []
        }
    }

    // MARK: - Load Messages

    func loadMessages(teamName: String) async {
        guard let inboxDir = teamInboxesPath(teamName) else {
            messages = []
            return
        }

        guard fileManager.fileExists(atPath: inboxDir) else {
            messages = []
            return
        }

        do {
            let entries = try fileManager.contentsOfDirectory(atPath: inboxDir)
            var allMessages: [InboxMessage] = []

            for entry in entries where entry.hasSuffix(".json") {
                guard Self.sanitizeName(entry) != nil else { continue }
                let agentName = String(entry.dropLast(5)) // remove .json
                let path = "\(inboxDir)/\(entry)"
                guard let data = fileManager.contents(atPath: path) else { continue }
                do {
                    var agentMessages = try decoder.decode([InboxMessage].self, from: data)
                    // Set the "to" field based on filename if not present
                    agentMessages = agentMessages.map { msg in
                        if msg.to == nil {
                            return InboxMessage(
                                from: msg.from, to: agentName, text: msg.text,
                                summary: msg.summary, timestamp: msg.timestamp,
                                color: msg.color, read: msg.read
                            )
                        }
                        return msg
                    }
                    allMessages.append(contentsOf: agentMessages)
                } catch {
                    continue
                }
            }

            let sorted = allMessages.sorted { $0.timestamp < $1.timestamp }
            // Limit to most recent 10,000 messages to prevent excessive memory usage
            messages = Array(sorted.suffix(10_000))
        } catch {
            messages = []
        }
    }

    // MARK: - Discover Members

    /// Discover all team members from config + messages + tasks
    func discoverMembers(for team: TeamConfig) {
        var membersByName: [String: TeamMember] = [:]

        // Start with config members
        for member in team.members {
            membersByName[member.name] = member
        }

        // Discover from messages (from and to fields)
        for msg in messages {
            if membersByName[msg.from] == nil {
                membersByName[msg.from] = TeamMember(
                    name: msg.from, agentId: msg.from, agentType: nil
                )
            }
            if let to = msg.to, membersByName[to] == nil {
                membersByName[to] = TeamMember(
                    name: to, agentId: to, agentType: nil
                )
            }
        }

        // Discover from tasks (owner field)
        for task in tasks {
            if let owner = task.owner, membersByName[owner] == nil {
                membersByName[owner] = TeamMember(
                    name: owner, agentId: owner, agentType: nil
                )
            }
        }

        allMembers = membersByName.values.sorted { $0.name < $1.name }
    }

    // MARK: - Compute Activities

    func computeActivities(for team: TeamConfig) {
        // Pre-group entries by agent name to avoid O(members * entries) filtering
        var entriesByAgent: [String: [SessionEntry]] = [:]
        for entry in sessionEntries {
            if let name = entry.agentName {
                entriesByAgent[name, default: []].append(entry)
            }
        }

        // Pre-group messages by sender
        var messagesByAgent: [String: [InboxMessage]] = [:]
        for msg in messages {
            messagesByAgent[msg.from, default: []].append(msg)
        }

        activities = allMembers.map { member in
            AgentActivity.from(
                agentName: member.name,
                entries: entriesByAgent[member.name] ?? [],
                tasks: tasks,
                messages: messagesByAgent[member.name] ?? []
            )
        }
    }

    // MARK: - Compute Telemetry

    func computeTelemetry(for team: TeamConfig) {
        let baseTelemetry = TeamTelemetry.from(
            tasks: tasks,
            entries: sessionEntries,
            teamCreatedAt: team.createdAt
        )

        // If sessionEntries have no token data, use ccusage data
        if baseTelemetry.totalTokens == 0 && tokenUsage.totalTokens > 0 {
            telemetry = TeamTelemetry(
                duration: baseTelemetry.duration,
                estimatedCost: tokenUsage.totalCost,
                errorCount: baseTelemetry.errorCount,
                totalTokens: tokenUsage.totalTokens,
                filesChanged: baseTelemetry.filesChanged
            )
        } else {
            telemetry = baseTelemetry
        }
    }

    // MARK: - Select Team

    func selectTeam(_ team: TeamConfig) async {
        selectedTeam = team
        await loadTasks(teamName: team.name)
        await loadMessages(teamName: team.name)
        discoverMembers(for: team)
        computeActivities(for: team)
        computeTelemetry(for: team)
    }

    // MARK: - Refresh Current Team

    func refresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        // Light refresh: only reload selected team's tasks and messages
        if let team = selectedTeam {
            await loadTasks(teamName: team.name)
            await loadMessages(teamName: team.name)
            discoverMembers(for: team)
            computeActivities(for: team)
            computeTelemetry(for: team)

            // Update task counts for selected team in sidebar
            let stats = taskStats
            teamTaskCounts[team.name] = (stats.pending, stats.inProgress, stats.completed)
        }
    }

    /// Full refresh: reload teams list + selected team data (heavier, called less often)
    func fullRefresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        await loadTeams()
        if let team = selectedTeam,
           let updated = teams.first(where: { $0.name == team.name }) {
            await selectTeam(updated)
        }
    }

    // MARK: - File Watching

    func startWatching() async {
        let watcher = FileWatcher { [weak self] in
            await self?.refresh()
        }

        self.watcher = watcher

        // Watch teams directory
        await watcher.watch(path: teamsPath)

        // Watch tasks directory
        await watcher.watch(path: tasksPath)

        // Watch individual team directories for inbox changes
        if let entries = try? fileManager.contentsOfDirectory(atPath: teamsPath) {
            for entry in entries {
                guard Self.sanitizeName(entry) != nil else { continue }
                if let inboxPath = teamInboxesPath(entry), fileManager.fileExists(atPath: inboxPath) {
                    await watcher.watch(path: inboxPath)
                }
                let teamDir = "\(teamsPath)/\(entry)"
                await watcher.watch(path: teamDir)
            }
        }

        // Watch task subdirectories
        if let entries = try? fileManager.contentsOfDirectory(atPath: tasksPath) {
            for entry in entries {
                guard Self.sanitizeName(entry) != nil else { continue }
                let taskDir = "\(tasksPath)/\(entry)"
                var isDir: ObjCBool = false
                if fileManager.fileExists(atPath: taskDir, isDirectory: &isDir), isDir.boolValue {
                    await watcher.watch(path: taskDir)
                }
            }
        }

        // Start periodic polling to catch file content changes
        // (DispatchSource only detects directory-level changes, not file modifications)
        startPolling()

        // Start token tracking via ccusage (every 60s - it's a heavier operation)
        startTokenPolling()
    }

    func stopWatching() async {
        pollTask?.cancel()
        pollTask = nil
        tokenPollTask?.cancel()
        tokenPollTask = nil
        await watcher?.stopAll()
        watcher = nil
    }

    // MARK: - Polling

    private func startPolling() {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            var tickCount = 0
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(5))
                guard !Task.isCancelled else { break }
                tickCount += 1

                if tickCount % 6 == 0 {
                    // Full refresh every 30s (reload team list + task counts)
                    await self?.fullRefresh()
                } else {
                    // Light refresh every 5s (only selected team data)
                    await self?.refresh()
                }
            }
        }
    }

    private func startTokenPolling() {
        tokenPollTask?.cancel()
        tokenPollTask = Task { [weak self] in
            // Fetch immediately on start
            if let self { self.tokenUsage = await self.tokenTracker.fetchDailyUsage() }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(60))
                guard !Task.isCancelled else { break }
                guard let self else { break }
                let usage = await self.tokenTracker.fetchDailyUsage()
                self.tokenUsage = usage
                if let team = self.selectedTeam {
                    self.computeTelemetry(for: team)
                }
            }
        }
    }

    // MARK: - Task Stats

    var taskStats: (pending: Int, inProgress: Int, completed: Int) {
        var pending = 0, inProgress = 0, completed = 0
        for task in tasks {
            switch task.status {
            case .pending: pending += 1
            case .inProgress: inProgress += 1
            case .completed: completed += 1
            }
        }
        return (pending, inProgress, completed)
    }

    var activeAgentCount: Int {
        activities.filter { $0.currentAction != .idle && $0.currentAction != .done }.count
    }

    // MARK: - Clear Inactive Teams

    /// Remove inactive team directories from disk (old teams with no pending/in-progress tasks)
    func clearCompletedTeams() {
        let sixHoursAgo = Date().addingTimeInterval(-6 * 3600)
        let inactiveNames = teams.filter { team in
            // Recently created with active tasks = keep
            if let created = team.createdAt, created > sixHoursAgo {
                if let counts = teamTaskCounts[team.name] {
                    return counts.pending == 0 && counts.inProgress == 0 && counts.completed > 0
                }
                return false
            }
            // Old team: inactive if no pending/in-progress
            if let counts = teamTaskCounts[team.name] {
                return counts.pending == 0 && counts.inProgress == 0
            }
            return true // old with no task data = inactive
        }.map(\.name)

        for name in inactiveNames {
            guard let safeName = Self.sanitizeName(name) else { continue }

            // Remove team config directory
            let teamDir = "\(teamsPath)/\(safeName)"
            try? fileManager.removeItem(atPath: teamDir)

            // Remove team tasks directory
            let taskDir = "\(tasksPath)/\(safeName)"
            try? fileManager.removeItem(atPath: taskDir)

            // Clean up state
            teamTaskCounts.removeValue(forKey: name)
        }

        // Remove from teams list
        teams.removeAll { team in inactiveNames.contains(team.name) }

        // If selected team was cleared, deselect
        if let selected = selectedTeam, inactiveNames.contains(selected.name) {
            selectedTeam = nil
            tasks = []
            messages = []
            activities = []
            allMembers = []
            telemetry = .empty
        }
    }
}
