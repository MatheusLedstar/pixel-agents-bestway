import SwiftUI

// MARK: - Game Map View (WebView-based)

struct GameMapView: View {
    let team: TeamConfig
    let activities: [AgentActivity]
    let tasks: [AgentTask]
    let messages: [InboxMessage]
    let allMembers: [TeamMember]

    @State private var gameService = GameStateService()
    @State private var selectedAgentName: String?
    @State private var hasLoaded = false

    var body: some View {
        VStack(spacing: 0) {
            headerBar
            ZStack(alignment: .topLeading) {
                WebGameMapView(
                    team: team,
                    activities: activities,
                    tasks: tasks,
                    messages: messages,
                    allMembers: allMembers,
                    gameService: gameService,
                    selectedAgentName: $selectedAgentName
                )
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Inspector overlay
                if let name = selectedAgentName {
                    inspectorOverlay(agentName: name)
                        .padding(12)
                        .transition(.opacity.combined(with: .scale(scale: 0.95)))
                }
            }
            statsBar
        }
        .background(PixelTheme.bgSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(PixelTheme.border, lineWidth: 0.5)
        )
        .onKeyPress(.escape) {
            if selectedAgentName != nil {
                selectedAgentName = nil
                return .handled
            }
            return .ignored
        }
        .task {
            await gameService.loadState(teamName: team.name)
            hasLoaded = true
        }
        .onChange(of: activities) { _, newActivities in
            guard hasLoaded else { return }
            gameService.syncFromActivities(
                activities: newActivities, tasks: tasks, messages: messages)
            Task { await gameService.saveState() }
        }
    }

    // MARK: - Header

    private var headerBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "map")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(PixelTheme.accentOrange)
            Text("Agent World")
                .font(.inter(16, weight: .bold))
                .foregroundStyle(PixelTheme.textPrimary)

            Spacer()

            levelBadge
            agentCountBadge
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private var levelBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: 10))
                .foregroundStyle(PixelTheme.yellow)
            Text("Lv.\(gameService.highestLevel)")
                .font(.jetBrainsMono(11, weight: .bold))
                .foregroundStyle(PixelTheme.yellow)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(PixelTheme.yellow.opacity(0.12))
        .clipShape(Capsule())
    }

    private var agentCountBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 10))
                .foregroundStyle(PixelTheme.green)
            Text("\(effectiveMembers.count)")
                .font(.jetBrainsMono(11, weight: .bold))
                .foregroundStyle(PixelTheme.green)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(PixelTheme.green.opacity(0.12))
        .clipShape(Capsule())
    }

    // MARK: - Inspector Overlay

    private func inspectorOverlay(agentName: String) -> some View {
        let activity = activities.first { $0.agentName == agentName }
        let member = effectiveMembers.first { $0.name == agentName }
        let gameData = gameService.agentData(for: agentName)

        return AgentInspectorView(
            agentName: agentName,
            activity: activity,
            tasks: tasks,
            gameData: gameData,
            member: member,
            onClose: { selectedAgentName = nil },
            onSendCommand: { agentName, command in
                sendCommandToAgent(agentName: agentName, command: command)
            }
        )
    }

    // MARK: - Stats Bar

    private var statsBar: some View {
        StatsBarView(gameService: gameService, teamName: team.name)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
    }

    // MARK: - Helpers

    private var effectiveMembers: [TeamMember] {
        allMembers.isEmpty ? team.members : allMembers
    }

    private func sendCommandToAgent(agentName: String, command: String) {
        let teamName = team.name
        guard let safeName = ClaudeDataService.sanitizeName(teamName),
              let safeAgent = ClaudeDataService.sanitizeName(agentName) else { return }

        let homeDir = FileManager.default.homeDirectoryForCurrentUser
        let inboxPath = homeDir.appendingPathComponent(".claude/teams/\(safeName)/inboxes/\(safeAgent).json").path

        let message: [String: Any] = [
            "from": "user",
            "to": agentName,
            "text": command,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "read": false
        ]

        var messages: [[String: Any]] = []
        if let data = FileManager.default.contents(atPath: inboxPath),
           let existing = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            messages = existing
        }
        messages.append(message)

        if let jsonData = try? JSONSerialization.data(withJSONObject: messages, options: .prettyPrinted) {
            try? jsonData.write(to: URL(fileURLWithPath: inboxPath))
        }
    }
}
