import SwiftUI

// MARK: - Agent Cards Section

struct AgentCardsSection: View {
    let team: TeamConfig
    let allMembers: [TeamMember]
    let activities: [AgentActivity]
    let tasks: [AgentTask]
    let entries: [SessionEntry]
    @Binding var selectedFileChange: FileChange?

    private var activeCount: Int {
        activities.filter { $0.currentAction != .idle && $0.currentAction != .done }.count
    }

    /// Members to display: use discovered allMembers, fallback to config members
    private var displayMembers: [TeamMember] {
        allMembers.isEmpty ? team.members : allMembers
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(spacing: 8) {
                Text("Active Agents")
                    .font(.inter(14, weight: .semibold))
                    .foregroundStyle(PixelTheme.textPrimary)

                Text("\(activeCount) active")
                    .font(.inter(10, weight: .semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(PixelTheme.accentOrange)
                    .clipShape(Capsule())

                Spacer()

                if displayMembers.count > 4 {
                    Text("\(displayMembers.count) agents →")
                        .font(.inter(10, weight: .medium))
                        .foregroundStyle(PixelTheme.textMuted)
                }
            }

            // Cards grid
            ScrollView(.horizontal, showsIndicators: true) {
                HStack(spacing: 12) {
                    ForEach(displayMembers) { member in
                        let activity = activities.first { $0.agentName == member.name }
                            ?? AgentActivity(
                                agentName: member.name,
                                currentAction: .idle,
                                currentFile: nil,
                                totalLinesAdded: 0,
                                totalLinesDeleted: 0,
                                tokensUsed: 0,
                                tasksCompleted: 0,
                                tasksTotal: 0,
                                lastActivity: nil
                            )
                        let agentTasks = tasks.filter { $0.owner == member.name }
                        let agentEntries = entries.filter { $0.agentName == member.name }
                        let fileChanges = DiffParser.extractChanges(from: agentEntries)

                        AgentCard(
                            member: member,
                            activity: activity,
                            agentTasks: agentTasks,
                            fileChanges: fileChanges,
                            selectedFileChange: $selectedFileChange
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Agent Card

struct AgentCard: View {
    let member: TeamMember
    let activity: AgentActivity
    let agentTasks: [AgentTask]
    let fileChanges: [FileChange]
    @Binding var selectedFileChange: FileChange?

    private var statusColor: Color {
        switch activity.currentAction {
        case .writing: PixelTheme.green
        case .thinking: PixelTheme.yellow
        case .reading: PixelTheme.blue
        case .messaging: PixelTheme.purple
        case .idle: Color.white.opacity(0.38)
        case .done: PixelTheme.green
        case .error: PixelTheme.red
        }
    }

    private var statusText: String {
        switch activity.currentAction {
        case .writing: "Writing"
        case .thinking: "Thinking"
        case .reading: "Reading"
        case .messaging: "Messaging"
        case .idle: "Idle"
        case .done: "Done"
        case .error: "Error"
        }
    }

    private var currentTask: AgentTask? {
        agentTasks.first { $0.status == .inProgress }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Top row: avatar + info + status
            topRow

            // Current task box
            activityBox

            // Files changed (clicavel - abre DiffViewer)
            if !fileChanges.isEmpty {
                filesChangedSection
            }

            // Bottom stats + progress
            bottomStats
        }
        .padding(16)
        .frame(width: 280)
        .background(PixelTheme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(PixelTheme.border, lineWidth: 0.5)
        )
    }

    // MARK: - Top Row

    private var topRow: some View {
        HStack(spacing: 10) {
            PixelAvatar(
                agentName: member.name,
                size: 36,
                isActive: activity.currentAction != .idle && activity.currentAction != .done
            )

            VStack(alignment: .leading, spacing: 2) {
                Text(member.name)
                    .font(.jetBrainsMono(13, weight: .bold))
                    .foregroundStyle(PixelTheme.textPrimary)
                    .lineLimit(1)
                Text(member.agentType ?? "agent")
                    .font(.inter(10, weight: .regular))
                    .foregroundStyle(PixelTheme.textMuted)
            }

            Spacer()

            StatusBadge(text: statusText, color: statusColor)
        }
    }

    // MARK: - Activity Box

    private var activityBox: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Current Task")
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(PixelTheme.textMuted)

            if let task = currentTask {
                Text(task.subject)
                    .font(.jetBrainsMono(11, weight: .medium))
                    .foregroundStyle(PixelTheme.textSecondary)
                    .lineLimit(2)
            } else {
                Text("No active task")
                    .font(.jetBrainsMono(11, weight: .medium))
                    .foregroundStyle(PixelTheme.textMuted)
            }

            if let file = activity.currentFile {
                HStack(spacing: 4) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 8))
                        .foregroundStyle(PixelTheme.textMuted)
                    Text((file as NSString).lastPathComponent)
                        .font(.jetBrainsMono(9, weight: .regular))
                        .foregroundStyle(PixelTheme.textMuted)
                        .lineLimit(1)
                }
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.white.opacity(0.016))
        )
    }

    // MARK: - Files Changed

    private var filesChangedSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Files Changed")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(PixelTheme.textMuted)
                Spacer()
                Text("\(fileChanges.count) files")
                    .font(.jetBrainsMono(9, weight: .regular))
                    .foregroundStyle(PixelTheme.textMuted)
            }

            VStack(spacing: 2) {
                ForEach(fileChanges.prefix(5)) { change in
                    Button {
                        selectedFileChange = change
                    } label: {
                        HStack(spacing: 6) {
                            Text(change.fileName)
                                .font(.jetBrainsMono(9, weight: .regular))
                                .foregroundStyle(PixelTheme.textSecondary)
                                .lineLimit(1)

                            Spacer()

                            if change.linesAdded > 0 {
                                Text("+\(change.linesAdded)")
                                    .font(.jetBrainsMono(9, weight: .bold))
                                    .foregroundStyle(PixelTheme.green)
                            }
                            if change.linesRemoved > 0 {
                                Text("-\(change.linesRemoved)")
                                    .font(.jetBrainsMono(9, weight: .bold))
                                    .foregroundStyle(PixelTheme.red)
                            }
                        }
                        .padding(.vertical, 2)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }

                if fileChanges.count > 5 {
                    Text("+ \(fileChanges.count - 5) more")
                        .font(.jetBrainsMono(9, weight: .regular))
                        .foregroundStyle(PixelTheme.textMuted)
                        .padding(.top, 2)
                }
            }
        }
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(Color.white.opacity(0.012))
        )
    }

    // MARK: - Bottom Stats

    private var bottomStats: some View {
        VStack(spacing: 6) {
            HStack {
                Text("\(activity.tasksCompleted)/\(activity.tasksTotal) tasks")
                    .font(.jetBrainsMono(10, weight: .medium))
                    .foregroundStyle(PixelTheme.textSecondary)

                Text("·")
                    .foregroundStyle(PixelTheme.textMuted)

                if activity.hasLineData {
                    HStack(spacing: 2) {
                        Text("+\(activity.totalLinesAdded)")
                            .font(.jetBrainsMono(10, weight: .medium))
                            .foregroundStyle(PixelTheme.green)
                        Text("/")
                            .foregroundStyle(PixelTheme.textMuted)
                        Text("-\(activity.totalLinesDeleted)")
                            .font(.jetBrainsMono(10, weight: .medium))
                            .foregroundStyle(PixelTheme.red)
                    }
                }

                Spacer()

                if activity.tokensUsed > 0 {
                    Text(formatTokens(activity.tokensUsed) + " tokens")
                        .font(.jetBrainsMono(10, weight: .bold))
                        .foregroundStyle(PixelTheme.accentOrange)
                }
            }

            ProgressBar(
                value: activity.taskProgress,
                gradient: LinearGradient(
                    colors: Array(AgentColorPalette.colorForAgent(name: member.name).colors.prefix(2)),
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
        }
    }

    private func formatTokens(_ count: Int) -> String {
        if count >= 1_000_000 {
            return String(format: "%.1fM", Double(count) / 1_000_000)
        } else if count >= 1_000 {
            return String(format: "%.1fK", Double(count) / 1_000)
        }
        return "\(count)"
    }
}
