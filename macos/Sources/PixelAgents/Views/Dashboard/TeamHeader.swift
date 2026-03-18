import SwiftUI

struct TeamHeader: View {
    let team: TeamConfig
    let telemetry: TeamTelemetry

    private var subtitle: String {
        let agentCount = team.members.count
        let template = team.description ?? "Team"
        return "\(template) — \(agentCount) agents"
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                // Left: Team name + subtitle
                VStack(alignment: .leading, spacing: 2) {
                    Text(team.name)
                        .font(.inter(23, weight: .bold))
                        .foregroundStyle(PixelTheme.textPrimary)
                    Text(subtitle)
                        .font(.inter(14, weight: .regular))
                        .foregroundStyle(PixelTheme.textSecondary)
                }

                Spacer()

                // Right: 3 metric cards
                HStack(spacing: 16) {
                    MetricCard(
                        value: telemetry.formattedTokens,
                        label: "TOKENS",
                        color: PixelTheme.accentOrange
                    )
                    MetricCard(
                        value: telemetry.formattedCost,
                        label: "EST. COST",
                        color: PixelTheme.green
                    )
                    MetricCard(
                        value: telemetry.formattedDuration,
                        label: "ELAPSED",
                        color: PixelTheme.blue
                    )
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 16)

            // Divider below header
            Rectangle()
                .fill(Color.white.opacity(0.063))
                .frame(height: 1)
        }
    }
}
