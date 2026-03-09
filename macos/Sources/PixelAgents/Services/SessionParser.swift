import Foundation

// MARK: - Session Parser

enum SessionParser {
    private static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        return decoder
    }()

    /// Parse JSONL data into SessionEntry array, skipping malformed lines
    static func parseJSONL(data: Data) -> [SessionEntry] {
        guard let text = String(data: data, encoding: .utf8) else { return [] }

        return text
            .components(separatedBy: .newlines)
            .compactMap { line -> SessionEntry? in
                let trimmed = line.trimmingCharacters(in: .whitespaces)
                guard !trimmed.isEmpty else { return nil }
                guard let lineData = trimmed.data(using: .utf8) else { return nil }
                return try? decoder.decode(SessionEntry.self, from: lineData)
            }
    }

    /// Extract file diff info from a session entry (tool_use with write/edit)
    static func extractDiff(from entry: SessionEntry) -> FileDiff? {
        guard let filePath = entry.filePath,
              entry.type == .toolUse || entry.type == .toolResult,
              entry.linesAdded > 0 || entry.linesDeleted > 0 else {
            return nil
        }
        return FileDiff(
            filePath: filePath,
            linesAdded: entry.linesAdded,
            linesDeleted: entry.linesDeleted
        )
    }

    /// Aggregate file diffs from multiple entries
    static func aggregateDiffs(from entries: [SessionEntry]) -> [FileDiff] {
        var diffsByPath: [String: (added: Int, deleted: Int)] = [:]

        for entry in entries {
            guard let diff = extractDiff(from: entry) else { continue }
            let existing = diffsByPath[diff.filePath, default: (0, 0)]
            diffsByPath[diff.filePath] = (
                added: existing.added + diff.linesAdded,
                deleted: existing.deleted + diff.linesDeleted
            )
        }

        return diffsByPath.map { path, counts in
            FileDiff(filePath: path, linesAdded: counts.added, linesDeleted: counts.deleted)
        }.sorted { $0.filePath < $1.filePath }
    }
}
