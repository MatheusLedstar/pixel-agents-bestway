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
final class TokenTracker: Sendable {
    private let npxPath: String

    init() {
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

    /// Thread-safe buffer (Swift 6 Sendable)
    private final class OutputBuffer: @unchecked Sendable {
        private let lock = NSLock()
        private var data = Data()
        func append(_ chunk: Data) { lock.withLock { data.append(chunk) } }
        func flush(_ chunk: Data) { lock.withLock { data.append(chunk) } }
        var result: Data { lock.withLock { data } }
    }

    /// Run ccusage without blocking — terminationHandler + readabilityHandler
    private func runCcusage(args: [String]) async -> TokenUsage {
        return await withCheckedContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: npxPath)
            process.arguments = ["ccusage@latest"] + args
            process.environment = ProcessInfo.processInfo.environment

            let outPipe = Pipe()
            let errPipe = Pipe()
            let buffer = OutputBuffer()

            // Drain pipes continuously — prevents buffer fill-up blocking the process
            outPipe.fileHandleForReading.readabilityHandler = { handle in
                let chunk = handle.availableData
                if !chunk.isEmpty { buffer.append(chunk) }
            }
            errPipe.fileHandleForReading.readabilityHandler = { handle in
                _ = handle.availableData
            }

            process.standardOutput = outPipe
            process.standardError = errPipe

            do {
                try process.run()
            } catch {
                continuation.resume(returning: .empty)
                return
            }

            final class WorkItemBox: @unchecked Sendable {
                let item: DispatchWorkItem
                init(_ i: DispatchWorkItem) { item = i }
            }
            let timeoutItem = DispatchWorkItem { if process.isRunning { process.terminate() } }
            let timeoutBox = WorkItemBox(timeoutItem)
            DispatchQueue.global().asyncAfter(deadline: .now() + 15, execute: timeoutItem)

            process.terminationHandler = { _ in
                timeoutBox.item.cancel()
                outPipe.fileHandleForReading.readabilityHandler = nil
                errPipe.fileHandleForReading.readabilityHandler = nil
                let tail = outPipe.fileHandleForReading.readDataToEndOfFile()
                if !tail.isEmpty { buffer.flush(tail) }

                let data = buffer.result
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
    }

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyyMMdd"
        return f
    }()
}
