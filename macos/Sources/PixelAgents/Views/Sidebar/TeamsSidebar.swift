import SwiftUI

// MARK: - Teams Sidebar

struct TeamsSidebar: View {
    @Environment(ClaudeDataService.self) private var dataService
    @Binding var selectedTeamName: String?
    @State private var showCompleted = false

    /// A team is considered "active" if it was created recently (<6h) or has pending/in-progress tasks
    private var activeTeams: [TeamConfig] {
        let sixHoursAgo = Date().addingTimeInterval(-6 * 3600)
        return dataService.teams.filter { team in
            // Recently created teams are always active
            if let created = team.createdAt, created > sixHoursAgo {
                return true
            }
            // Teams with pending or in-progress tasks are active
            if let counts = dataService.teamTaskCounts[team.name] {
                return counts.pending > 0 || counts.inProgress > 0
            }
            // No task data AND old = not active
            return false
        }
    }

    /// Inactive teams: old or all tasks completed
    private var inactiveTeams: [TeamConfig] {
        let sixHoursAgo = Date().addingTimeInterval(-6 * 3600)
        return dataService.teams.filter { team in
            // Recently created = not inactive
            if let created = team.createdAt, created > sixHoursAgo {
                if let counts = dataService.teamTaskCounts[team.name] {
                    return counts.pending == 0 && counts.inProgress == 0 && counts.completed > 0
                }
                return false
            }
            // Old team with no pending/in-progress
            if let counts = dataService.teamTaskCounts[team.name] {
                return counts.pending == 0 && counts.inProgress == 0
            }
            // Old team with no task data = inactive
            return true
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            sidebarHeader

            GradientDivider()
                .padding(.horizontal, 12)

            // Active teams label + actions
            HStack(spacing: 6) {
                Text("ACTIVE TEAMS")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(1.5)
                    .foregroundStyle(PixelTheme.textMuted)
                Text("\(activeTeams.count)")
                    .font(.jetBrainsMono(9, weight: .bold))
                    .foregroundStyle(PixelTheme.accentOrange)

                Spacer()

                // Refresh button
                Button {
                    Task { await dataService.fullRefresh() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(PixelTheme.textMuted)
                }
                .buttonStyle(.plain)
                .help("Refresh teams")

                // Clear completed button
                if !inactiveTeams.isEmpty {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            dataService.clearCompletedTeams()
                        }
                    } label: {
                        HStack(spacing: 3) {
                            Image(systemName: "trash")
                                .font(.system(size: 8, weight: .medium))
                            Text("Clear \(inactiveTeams.count)")
                                .font(.system(size: 8, weight: .semibold))
                        }
                        .foregroundStyle(PixelTheme.red.opacity(0.8))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(PixelTheme.red.opacity(0.1))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .help("Remove completed teams")
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 8)

            // Team list
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(activeTeams) { team in
                        TeamCard(
                            team: team,
                            isSelected: selectedTeamName == team.name,
                            tasks: dataService.selectedTeam?.name == team.name ? dataService.tasks : [],
                            activities: dataService.selectedTeam?.name == team.name ? dataService.activities : [],
                            telemetry: dataService.selectedTeam?.name == team.name ? dataService.telemetry : .empty,
                            taskCounts: dataService.teamTaskCounts[team.name]
                        )
                        .onTapGesture {
                            selectedTeamName = team.name
                            Task {
                                await dataService.selectTeam(team)
                            }
                        }
                    }

                    // Completed teams section
                    if !inactiveTeams.isEmpty {
                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                showCompleted.toggle()
                            }
                        } label: {
                            HStack {
                                Text("INACTIVE")
                                    .font(.system(size: 9, weight: .semibold))
                                    .tracking(1.5)
                                    .foregroundStyle(PixelTheme.textMuted)
                                Text("\(inactiveTeams.count)")
                                    .font(.jetBrainsMono(9, weight: .bold))
                                    .foregroundStyle(PixelTheme.green)
                                Spacer()
                                Image(systemName: showCompleted ? "chevron.up" : "chevron.down")
                                    .font(.system(size: 8))
                                    .foregroundStyle(PixelTheme.textMuted)
                            }
                            .padding(.horizontal, 4)
                            .padding(.vertical, 8)
                        }
                        .buttonStyle(.plain)

                        if showCompleted {
                            ForEach(inactiveTeams) { team in
                                TeamCard(
                                    team: team,
                                    isSelected: selectedTeamName == team.name,
                                    tasks: dataService.selectedTeam?.name == team.name ? dataService.tasks : [],
                                    activities: dataService.selectedTeam?.name == team.name ? dataService.activities : [],
                                    telemetry: dataService.selectedTeam?.name == team.name ? dataService.telemetry : .empty,
                                    taskCounts: dataService.teamTaskCounts[team.name]
                                )
                                .opacity(0.6)
                                .onTapGesture {
                                    selectedTeamName = team.name
                                    Task {
                                        await dataService.selectTeam(team)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 12)
            }

            Spacer()

            // Bottom bar
            bottomBar
        }
        .frame(width: 260)
        .background(PixelTheme.bgSidebar)
    }

    // MARK: - Sidebar Header

    private var sidebarHeader: some View {
        HStack(spacing: 10) {
            PixelAvatar(agentName: "pixel-agents", size: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text("Pixel Agents")
                    .font(.inter(16, weight: .bold))
                    .foregroundStyle(PixelTheme.textPrimary)
                Text("Team Monitor")
                    .font(.inter(10, weight: .regular))
                    .foregroundStyle(PixelTheme.textMuted)
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 8) {
            GradientDivider()
                .padding(.horizontal, 12)

            HStack(spacing: 6) {
                Circle()
                    .fill(PixelTheme.green)
                    .frame(width: 6, height: 6)
                Text("Backend Connected")
                    .font(.inter(10, weight: .medium))
                    .foregroundStyle(PixelTheme.textSecondary)
            }
            .padding(.horizontal, 16)

            HStack {
                Text("Pixel Agents v2.0")
                    .font(.inter(9, weight: .regular))
                    .foregroundStyle(PixelTheme.textMuted)

                Text("macOS")
                    .font(.inter(8, weight: .semibold))
                    .foregroundStyle(PixelTheme.accentOrange)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(PixelTheme.accentOrange.opacity(0.12))
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
    }
}

// MARK: - Team Card

struct TeamCard: View {
    let team: TeamConfig
    let isSelected: Bool
    let tasks: [AgentTask]
    let activities: [AgentActivity]
    let telemetry: TeamTelemetry
    var taskCounts: (pending: Int, inProgress: Int, completed: Int)?

    private var activeCount: Int {
        activities.filter { $0.currentAction != .idle && $0.currentAction != .done }.count
    }

    private var completedTasks: Int {
        // Use quick-scanned counts if available, else from loaded tasks
        if let counts = taskCounts {
            return counts.completed
        }
        return tasks.filter { $0.status == .completed }.count
    }

    private var totalTasks: Int {
        if let counts = taskCounts {
            return counts.pending + counts.inProgress + counts.completed
        }
        return tasks.count
    }

    private var inProgressTasks: Int {
        if let counts = taskCounts {
            return counts.inProgress
        }
        return tasks.filter { $0.status == .inProgress }.count
    }

    private var progress: Double {
        guard totalTasks > 0 else { return 0 }
        return Double(completedTasks) / Double(totalTasks)
    }

    private var isTeamCompleted: Bool {
        totalTasks > 0 && completedTasks == totalTasks
    }

    private var statusBadgeText: String {
        if activeCount > 0 { return "\(activeCount) active" }
        if isTeamCompleted { return "completed" }
        if inProgressTasks > 0 { return "\(inProgressTasks) working" }
        return "idle"
    }

    private var statusBadgeColor: Color {
        if activeCount > 0 { return PixelTheme.green }
        if isTeamCompleted { return PixelTheme.green.opacity(0.6) }
        if inProgressTasks > 0 { return PixelTheme.yellow }
        return Color.white.opacity(0.38)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Team name + status badge
            HStack {
                Text(team.name)
                    .font(.inter(13, weight: .semibold))
                    .foregroundStyle(isSelected ? PixelTheme.accentOrange : PixelTheme.textPrimary)
                    .lineLimit(1)

                Spacer()

                StatusBadge(
                    text: statusBadgeText,
                    color: statusBadgeColor
                )
            }

            // Avatar stack
            if !team.members.isEmpty {
                PixelAvatarStack(
                    agents: team.members.map(\.name),
                    size: 20
                )
            }

            // Progress bar
            ProgressBar(value: progress)

            // Tasks counter + tokens
            HStack {
                Text("\(completedTasks)/\(totalTasks) tasks")
                    .font(.jetBrainsMono(10, weight: .medium))
                    .foregroundStyle(PixelTheme.textSecondary)

                Spacer()

                if telemetry.totalTokens > 0 {
                    Text(telemetry.formattedTokens + " tokens")
                        .font(.jetBrainsMono(10, weight: .medium))
                        .foregroundStyle(PixelTheme.accentOrange)
                }
            }

            // Telemetry grid
            if telemetry.duration > 0 {
                telemetryGrid
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isSelected ? PixelTheme.accentOrange.opacity(0.08) : Color.clear)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(
                    isSelected ? PixelTheme.accentOrange.opacity(0.19) : Color.clear,
                    lineWidth: 1
                )
        )
        .contentShape(Rectangle())
    }

    // MARK: - Telemetry Grid

    private var telemetryGrid: some View {
        HStack(spacing: 0) {
            telemetryCell(label: "Duration", value: telemetry.formattedDuration)
            telemetrySeparator
            telemetryCell(label: "Cost", value: telemetry.formattedCost)
            telemetrySeparator
            telemetryCell(label: "Errors", value: "\(telemetry.errorCount)")
        }
        .padding(.vertical, 6)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(Color.white.opacity(0.02))
        )
    }

    private func telemetryCell(label: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.system(size: 8, weight: .medium))
                .foregroundStyle(PixelTheme.textMuted)
            Text(value)
                .font(.jetBrainsMono(10, weight: .bold))
                .foregroundStyle(PixelTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }

    private var telemetrySeparator: some View {
        Rectangle()
            .fill(Color.white.opacity(0.03))
            .frame(width: 1, height: 28)
    }
}
