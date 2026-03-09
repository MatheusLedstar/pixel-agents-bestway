import Foundation

// MARK: - Team Telemetry

struct TeamTelemetry: Equatable, Sendable {
    let duration: TimeInterval
    let estimatedCost: Double
    let errorCount: Int
    let totalTokens: Int
    let filesChanged: Int

    // Cost estimate: ~$15 per 1M input tokens + ~$75 per 1M output tokens (Opus)
    // Simplified: ~$0.00005 per token average
    private static let costPerToken: Double = 0.00005

    var formattedDuration: String {
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        let seconds = Int(duration) % 60
        if hours > 0 {
            return String(format: "%dh %dm %ds", hours, minutes, seconds)
        } else if minutes > 0 {
            return String(format: "%dm %ds", minutes, seconds)
        } else {
            return String(format: "%ds", seconds)
        }
    }

    var formattedCost: String {
        String(format: "$%.2f", estimatedCost)
    }

    var formattedTokens: String {
        if totalTokens >= 1_000_000 {
            return String(format: "%.1fM", Double(totalTokens) / 1_000_000)
        } else if totalTokens >= 1_000 {
            return String(format: "%.1fK", Double(totalTokens) / 1_000)
        } else {
            return "\(totalTokens)"
        }
    }

    /// Build telemetry from team data
    static func from(tasks: [AgentTask], entries: [SessionEntry], teamCreatedAt: Date?) -> TeamTelemetry {
        let totalTokens = entries.reduce(0) { $0 + $1.tokensUsed }
        let errorCount = entries.filter { $0.type == .error }.count

        let uniqueFiles = Set(entries.compactMap(\.filePath))

        let duration: TimeInterval
        if let start = teamCreatedAt {
            duration = Date().timeIntervalSince(start)
        } else if let first = entries.first?.timestamp {
            duration = Date().timeIntervalSince(first)
        } else {
            duration = 0
        }

        let cost = Double(totalTokens) * costPerToken

        return TeamTelemetry(
            duration: duration,
            estimatedCost: cost,
            errorCount: errorCount,
            totalTokens: totalTokens,
            filesChanged: uniqueFiles.count
        )
    }

    static var empty: TeamTelemetry {
        TeamTelemetry(duration: 0, estimatedCost: 0, errorCount: 0, totalTokens: 0, filesChanged: 0)
    }
}
