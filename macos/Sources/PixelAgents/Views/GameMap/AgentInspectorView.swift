import SwiftUI

// MARK: - Agent Inspector View

/// Floating overlay panel that shows detailed info about a selected agent.
struct AgentInspectorView: View {
    let agentName: String
    let activity: AgentActivity?
    let tasks: [AgentTask]
    let gameData: AgentGameData?
    let member: TeamMember?
    let onClose: () -> Void
    var onSendCommand: ((String, String) -> Void)?

    @State private var commandText = ""
    @State private var showSentConfirmation = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            Divider().overlay(PixelTheme.border)

            if let activity {
                activitySection(activity)
            }

            if !agentTasks.isEmpty {
                taskSection
            }

            if let gameData {
                progressSection(gameData)
                xpBar(gameData)
            }

            commandInputSection

            closeButton
        }
        .frame(width: 300)
        .padding(16)
        .background(Color(hex: 0x111116))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(PixelTheme.border, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.6), radius: 20, x: 0, y: 8)
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 10) {
            // Agent avatar circle
            Circle()
                .fill(
                    AgentColorPalette.colorForAgent(name: agentName)
                        .radialGradient(endRadius: 16)
                )
                .frame(width: 36, height: 36)
                .overlay(
                    Text(String(agentName.prefix(1)).uppercased())
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundStyle(.white)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(agentName)
                    .font(.inter(14, weight: .bold))
                    .foregroundStyle(PixelTheme.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    if let type = member?.agentType {
                        Text(type)
                            .font(.jetBrainsMono(10, weight: .medium))
                            .foregroundStyle(PixelTheme.textMuted)
                    }
                    if let gameData {
                        Text("Lv.\(gameData.level)")
                            .font(.jetBrainsMono(10, weight: .bold))
                            .foregroundStyle(PixelTheme.yellow)
                        Text(gameData.title)
                            .font(.jetBrainsMono(10, weight: .medium))
                            .foregroundStyle(PixelTheme.textSecondary)
                    }
                }
            }

            Spacer()
        }
    }

    // MARK: - Activity

    private func activitySection(_ activity: AgentActivity) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            sectionLabel("Current Activity")

            HStack(spacing: 6) {
                Image(systemName: activityIcon(activity.currentAction))
                    .font(.system(size: 11))
                    .foregroundStyle(activityColor(activity.currentAction))

                Text(activityDisplayText(activity.currentAction))
                    .font(.inter(12, weight: .medium))
                    .foregroundStyle(PixelTheme.textPrimary)

                if activity.currentAction != .idle && activity.currentAction != .done {
                    pulseDot(color: activityColor(activity.currentAction))
                }
            }

            if let file = activity.currentFile {
                HStack(spacing: 4) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 9))
                        .foregroundStyle(PixelTheme.textMuted)
                    Text(shortenPath(file))
                        .font(.jetBrainsMono(9, weight: .regular))
                        .foregroundStyle(PixelTheme.textMuted)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }
        }
    }

    // MARK: - Tasks

    private var agentTasks: [AgentTask] {
        tasks.filter { $0.owner == agentName }
    }

    private var taskSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            sectionLabel("Tasks (\(agentTasks.filter { $0.status == .completed }.count)/\(agentTasks.count))")

            ForEach(agentTasks.prefix(3)) { task in
                HStack(spacing: 6) {
                    Image(systemName: taskIcon(task.status))
                        .font(.system(size: 9))
                        .foregroundStyle(taskColor(task.status))
                    Text(task.subject)
                        .font(.inter(11, weight: .medium))
                        .foregroundStyle(PixelTheme.textSecondary)
                        .lineLimit(1)
                }
            }

            if agentTasks.count > 3 {
                Text("+\(agentTasks.count - 3) more")
                    .font(.inter(10, weight: .medium))
                    .foregroundStyle(PixelTheme.textMuted)
            }
        }
    }

    // MARK: - Progress

    private func progressSection(_ data: AgentGameData) -> some View {
        HStack(spacing: 16) {
            miniStat(icon: "checkmark.circle", label: "Tasks", value: "\(data.tasksDone)", color: PixelTheme.green)
            miniStat(icon: "bubble.left", label: "Msgs", value: "\(data.messagesSent)", color: PixelTheme.blue)
            miniStat(icon: "doc", label: "Files", value: "\(data.filesRead + data.filesWritten)", color: PixelTheme.purple)
        }
    }

    private func xpBar(_ data: AgentGameData) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("XP")
                    .font(.jetBrainsMono(9, weight: .bold))
                    .foregroundStyle(PixelTheme.accentOrange)
                Spacer()
                Text("\(data.xp)")
                    .font(.jetBrainsMono(9, weight: .bold))
                    .foregroundStyle(PixelTheme.textSecondary)
                if let nextXp = LevelDefinition.xpForNextLevel(data.xp) {
                    Text("/ \(nextXp)")
                        .font(.jetBrainsMono(9, weight: .regular))
                        .foregroundStyle(PixelTheme.textMuted)
                }
            }

            ProgressBar(
                value: xpProgress(data),
                gradient: LinearGradient(
                    colors: [PixelTheme.accentOrange, PixelTheme.yellow],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(height: 6)
        }
    }

    // MARK: - Close

    private var closeButton: some View {
        Button(action: onClose) {
            HStack {
                Spacer()
                Text("Close")
                    .font(.inter(11, weight: .medium))
                    .foregroundStyle(PixelTheme.textMuted)
                Text("(Esc)")
                    .font(.jetBrainsMono(9, weight: .regular))
                    .foregroundStyle(PixelTheme.textMuted.opacity(0.6))
                Spacer()
            }
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.04))
            .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Command Input

    private var commandInputSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Image(systemName: "terminal")
                    .font(.system(size: 9))
                    .foregroundStyle(PixelTheme.accentOrange)
                Text("SEND COMMAND")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(1)
                    .foregroundStyle(PixelTheme.textMuted)

                if showSentConfirmation {
                    Text("Command sent!")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(PixelTheme.green)
                        .transition(.opacity)
                }
            }

            HStack(spacing: 6) {
                TextField("Type instruction...", text: $commandText)
                    .textFieldStyle(.plain)
                    .font(.jetBrainsMono(11, weight: .regular))
                    .foregroundStyle(PixelTheme.textPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color(hex: 0x0D0D14))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(PixelTheme.border, lineWidth: 0.5)
                    )
                    .onSubmit { sendCommand() }

                Button(action: sendCommand) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(.white)
                        .frame(width: 30, height: 30)
                        .background(PixelTheme.accentOrange)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)
                .disabled(commandText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }

    private func sendCommand() {
        let trimmed = commandText.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        onSendCommand?(agentName, trimmed)
        commandText = ""
        withAnimation(.easeInOut(duration: 0.3)) {
            showSentConfirmation = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation(.easeInOut(duration: 0.3)) {
                showSentConfirmation = false
            }
        }
    }

    // MARK: - Helpers

    private func sectionLabel(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.system(size: 9, weight: .semibold))
            .foregroundStyle(PixelTheme.textMuted)
            .tracking(0.5)
    }

    private func miniStat(icon: String, label: String, value: String, color: Color) -> some View {
        VStack(spacing: 3) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(color)
            Text(value)
                .font(.jetBrainsMono(11, weight: .bold))
                .foregroundStyle(PixelTheme.textPrimary)
            Text(label)
                .font(.system(size: 8, weight: .medium))
                .foregroundStyle(PixelTheme.textMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private func pulseDot(color: Color) -> some View {
        Circle()
            .fill(color)
            .frame(width: 6, height: 6)
            .opacity(0.8)
    }

    private func activityIcon(_ type: ActivityType) -> String {
        switch type {
        case .reading:   return "book"
        case .writing:   return "chevron.left.forwardslash.chevron.right"
        case .thinking:  return "brain"
        case .messaging: return "bubble.left.and.bubble.right"
        case .searching: return "magnifyingglass"
        case .testing:   return "checkmark.shield"
        case .running:   return "play.fill"
        case .deploying: return "arrow.up.circle"
        case .debugging: return "ant"
        case .idle:      return "moon.zzz"
        case .done:      return "checkmark.circle.fill"
        case .error:     return "exclamationmark.triangle"
        }
    }

    private func activityColor(_ type: ActivityType) -> Color {
        switch type {
        case .reading:   return PixelTheme.blue
        case .writing:   return PixelTheme.green
        case .thinking:  return PixelTheme.purple
        case .messaging: return PixelTheme.blue
        case .searching: return Color(hex: 0x06B6D4)
        case .testing:   return PixelTheme.yellow
        case .running:   return PixelTheme.green
        case .deploying: return PixelTheme.accentOrange
        case .debugging: return Color(hex: 0xEC4899)
        case .idle:      return PixelTheme.textMuted
        case .done:      return PixelTheme.green
        case .error:     return PixelTheme.red
        }
    }

    private func activityDisplayText(_ type: ActivityType) -> String {
        switch type {
        case .reading:   return "Reading files"
        case .writing:   return "Writing code"
        case .thinking:  return "Thinking..."
        case .messaging: return "Messaging"
        case .searching: return "Searching"
        case .testing:   return "Running tests"
        case .running:   return "Running command"
        case .deploying: return "Deploying"
        case .debugging: return "Debugging"
        case .idle:      return "Idle"
        case .done:      return "Done!"
        case .error:     return "Error"
        }
    }

    private func taskIcon(_ status: TaskStatus) -> String {
        switch status {
        case .pending:    return "circle"
        case .inProgress: return "arrow.triangle.2.circlepath"
        case .completed:  return "checkmark.circle.fill"
        }
    }

    private func taskColor(_ status: TaskStatus) -> Color {
        switch status {
        case .pending:    return PixelTheme.textMuted
        case .inProgress: return PixelTheme.blue
        case .completed:  return PixelTheme.green
        }
    }

    private func shortenPath(_ path: String) -> String {
        let components = path.split(separator: "/")
        if components.count <= 2 { return path }
        return ".../" + components.suffix(2).joined(separator: "/")
    }

    private func xpProgress(_ data: AgentGameData) -> Double {
        if let nextLevel = LevelDefinition.xpForNextLevel(data.xp) {
            let currentLevelXp = LevelDefinition.forXp(data.xp).xpRequired
            let range = nextLevel - currentLevelXp
            guard range > 0 else { return 1.0 }
            return Double(data.xp - currentLevelXp) / Double(range)
        }
        return 1.0
    }
}
