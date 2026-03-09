import Foundation

// MARK: - Token Usage Data

struct TokenUsage: Equatable, Sendable {
    let totalTokens: Int
    let totalCost: Double
    let inputTokens: Int
    let outputTokens: Int
    let cacheReadTokens: Int
    let cacheCreationTokens: Int

    static var empty: TokenUsage {
        TokenUsage(totalTokens: 0, totalCost: 0, inputTokens: 0,
                   outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0)
    }
}

// MARK: - Token Tracker

/// Fetches token usage data from `npx ccusage@latest` CLI tool
@MainActor
final class TokenTracker: Sendable {
    private let npxPath: String

    init() {
        // Find npx in common locations
        let candidates = [
            "/opt/homebrew/bin/npx",
            "/usr/local/bin/npx",
            "/usr/bin/npx"
        ]
        self.npxPath = candidates.first { FileManager.default.fileExists(atPath: $0) } ?? "npx"
    }

    /// Fetch today's token usage via ccusage
    func fetchDailyUsage() async -> TokenUsage {
        let today = Self.dateFormatter.string(from: Date())
        return await runCcusage(args: ["daily", "--since", today, "--json"])
    }

    /// Parse ccusage JSON output into TokenUsage
    private func runCcusage(args: [String]) async -> TokenUsage {
        return await withCheckedContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: npxPath)
            process.arguments = ["ccusage@latest"] + args
            process.environment = ProcessInfo.processInfo.environment

            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = Pipe() // suppress stderr

            do {
                try process.run()
            } catch {
                continuation.resume(returning: .empty)
                return
            }

            // Timeout: kill process after 15 seconds
            let timeoutWork = DispatchWorkItem {
                if process.isRunning { process.terminate() }
            }
            DispatchQueue.global().asyncAfter(deadline: .now() + 15, execute: timeoutWork)

            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            timeoutWork.cancel()

            guard process.terminationStatus == 0,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let totals = json["totals"] as? [String: Any] else {
                continuation.resume(returning: .empty)
                return
            }

            let usage = TokenUsage(
                totalTokens: totals["totalTokens"] as? Int ?? 0,
                totalCost: totals["totalCost"] as? Double ?? 0,
                inputTokens: totals["inputTokens"] as? Int ?? 0,
                outputTokens: totals["outputTokens"] as? Int ?? 0,
                cacheReadTokens: totals["cacheReadTokens"] as? Int ?? 0,
                cacheCreationTokens: totals["cacheCreationTokens"] as? Int ?? 0
            )
            continuation.resume(returning: usage)
        }
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyyMMdd"
        return f
    }()
}
