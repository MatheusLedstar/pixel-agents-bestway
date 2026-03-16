import SwiftUI

// MARK: - Stats Bar View

struct StatsBarView: View {
    let gameService: GameStateService
    let teamName: String

    private var agentCount: Int {
        gameService.gameState.agents.count
    }

    private var xpProgress: Double {
        let totalXp = gameService.totalXp
        guard agentCount > 0 else { return 0 }
        let avgXp = totalXp / agentCount
        if let nextLevel = LevelDefinition.xpForNextLevel(avgXp) {
            let currentLevelXp = LevelDefinition.forXp(avgXp).xpRequired
            let range = nextLevel - currentLevelXp
            guard range > 0 else { return 1.0 }
            return Double(avgXp - currentLevelXp) / Double(range)
        }
        return 1.0 // Max level
    }

    var body: some View {
        HStack(spacing: 16) {
            // Team XP
            statItem(
                icon: "bolt.fill",
                label: "TOTAL XP",
                value: "\(gameService.totalXp)",
                color: PixelTheme.accentOrange
            )

            // XP progress bar
            VStack(alignment: .leading, spacing: 2) {
                Text("TEAM PROGRESS")
                    .font(.system(size: 7, weight: .semibold))
                    .foregroundStyle(PixelTheme.textMuted)
                ProgressBar(
                    value: xpProgress,
                    gradient: LinearGradient(
                        colors: [PixelTheme.accentOrange, PixelTheme.yellow],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 4)
            }
            .frame(maxWidth: 120)

            // Highest Level
            statItem(
                icon: "star.fill",
                label: "TOP LEVEL",
                value: "\(gameService.highestLevel)",
                color: PixelTheme.yellow
            )

            // Achievements
            statItem(
                icon: "trophy.fill",
                label: "TROPHIES",
                value: "\(gameService.totalAchievements)",
                color: PixelTheme.green
            )

            // Agents
            statItem(
                icon: "person.2.fill",
                label: "AGENTS",
                value: "\(agentCount)",
                color: PixelTheme.blue
            )

            Spacer()
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 4)
        .background(Color.white.opacity(0.02))
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    // MARK: - Stat Item

    private func statItem(icon: String, label: String, value: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(color)

            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.system(size: 7, weight: .semibold))
                    .foregroundStyle(PixelTheme.textMuted)
                Text(value)
                    .font(.jetBrainsMono(11, weight: .bold))
                    .foregroundStyle(color)
            }
        }
    }
}
