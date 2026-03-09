import Foundation

// MARK: - CTO Summary Service

/// Generates a CTO-level summary of team messages using the `claude` CLI
@MainActor
@Observable
final class CTOSummaryService {
    var summary: String = ""
    var isGenerating = false
    var error: String?

    private let claudePath: String

    init() {
        let candidates = [
            "/opt/homebrew/bin/claude",
            "/Users/matheus.venancio/.local/bin/claude",
            "/usr/local/bin/claude"
        ]
        self.claudePath = candidates.first { FileManager.default.fileExists(atPath: $0) } ?? "claude"
    }

    /// Build a context prompt from the team's messages
    private func buildPrompt(teamName: String, messages: [InboxMessage], tasks: [AgentTask], telemetry: TeamTelemetry) -> String {
        var parts: [String] = []

        parts.append("You are generating a CTO-level executive summary for an AI agent team.")
        parts.append("Team: \(teamName)")
        parts.append("Duration: \(telemetry.formattedDuration)")
        parts.append("Cost: \(telemetry.formattedCost)")
        parts.append("Total tokens: \(telemetry.formattedTokens)")
        parts.append("")

        // Task summary
        let completed = tasks.filter { $0.status == .completed }
        let inProgress = tasks.filter { $0.status == .inProgress }
        let pending = tasks.filter { $0.status == .pending }

        parts.append("## Tasks Overview")
        parts.append("- Completed: \(completed.count)")
        parts.append("- In Progress: \(inProgress.count)")
        parts.append("- Pending: \(pending.count)")
        parts.append("")

        for task in tasks {
            let status = switch task.status {
            case .completed: "✅"
            case .inProgress: "🔄"
            case .pending: "⏳"
            }
            parts.append("\(status) [\(task.owner ?? "unassigned")] \(task.subject)")
        }
        parts.append("")

        // Messages (last 100 non-protocol messages for context)
        let visibleMsgs = messages
            .filter { !$0.isProtocolMessage }
            .suffix(100)

        parts.append("## Agent Messages (chronological)")
        for msg in visibleMsgs {
            let time = Self.timeFormatter.string(from: msg.timestamp)
            let to = msg.to.map { " → \($0)" } ?? ""
            parts.append("[\(time)] \(msg.from)\(to): \(msg.displayBody)")
        }
        parts.append("")

        parts.append("""
        ---
        Based on the above data, write a detailed CTO executive summary in Portuguese (BR) with:
        1. **Visão Geral**: O que o time fez, resultado geral
        2. **Progresso das Tasks**: Status de cada task principal, quem executou
        3. **Comunicação do Time**: Como os agentes colaboraram, padrões observados
        4. **Riscos e Problemas**: Erros identificados, blockers, pontos de atenção
        5. **Métricas**: Duração, custo, tokens, eficiência
        6. **Próximos Passos**: Recomendações baseadas no estado atual

        Be concise but thorough. Use markdown formatting.
        """)

        return parts.joined(separator: "\n")
    }

    /// Generate CTO summary using claude CLI in print mode
    func generate(teamName: String, messages: [InboxMessage], tasks: [AgentTask], telemetry: TeamTelemetry) async {
        guard !isGenerating else { return }
        isGenerating = true
        summary = ""
        error = nil

        guard FileManager.default.fileExists(atPath: claudePath) else {
            error = "Claude CLI não encontrado em \(claudePath)"
            isGenerating = false
            return
        }

        let prompt = buildPrompt(teamName: teamName, messages: messages, tasks: tasks, telemetry: telemetry)

        let result = await runClaude(prompt: prompt)

        if let result {
            summary = result
        } else if summary.isEmpty {
            error = "Falha ao gerar resumo. Verifique se o Claude CLI está autenticado."
        }

        isGenerating = false
    }

    /// Run claude via /bin/sh with temp file for reliable stdin handling
    private func runClaude(prompt: String) async -> String? {
        // Write prompt to temp file (avoids stdin pipe issues with Node.js)
        let tmpFile = NSTemporaryDirectory() + "cto-prompt-\(UUID().uuidString).txt"
        guard FileManager.default.createFile(atPath: tmpFile, contents: prompt.data(using: .utf8)) else {
            return nil
        }
        defer { try? FileManager.default.removeItem(atPath: tmpFile) }

        return await withCheckedContinuation { continuation in
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/bin/sh")
            // Use shell redirection: cat file | claude -p
            let escapedClaude = claudePath.replacingOccurrences(of: "'", with: "'\\''")
            let escapedTmp = tmpFile.replacingOccurrences(of: "'", with: "'\\''")
            process.arguments = [
                "-c",
                "unset CLAUDECODE CLAUDE_CODE; cat '\(escapedTmp)' | '\(escapedClaude)' -p --model sonnet"
            ]

            // Minimal clean environment with PATH
            var env = ProcessInfo.processInfo.environment
            env.removeValue(forKey: "CLAUDECODE")
            env.removeValue(forKey: "CLAUDE_CODE")
            process.environment = env

            let outPipe = Pipe()
            process.standardOutput = outPipe
            process.standardError = Pipe()

            do {
                try process.run()
            } catch {
                continuation.resume(returning: nil)
                return
            }

            // Timeout: 90 seconds
            let timeoutWork = DispatchWorkItem {
                if process.isRunning { process.terminate() }
            }
            DispatchQueue.global().asyncAfter(deadline: .now() + 90, execute: timeoutWork)

            let data = outPipe.fileHandleForReading.readDataToEndOfFile()
            process.waitUntilExit()
            timeoutWork.cancel()

            guard process.terminationStatus == 0,
                  let output = String(data: data, encoding: .utf8),
                  !output.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                continuation.resume(returning: nil)
                return
            }

            continuation.resume(returning: output.trimmingCharacters(in: .whitespacesAndNewlines))
        }
    }

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()
}
