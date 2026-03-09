import Foundation

// MARK: - Diff Line Type

enum DiffLineType: Equatable, Hashable, Sendable {
    case added
    case removed
    case context
    case hunkHeader
}

// MARK: - Diff Line

struct DiffLine: Identifiable, Equatable, Hashable, Sendable {
    let id: Int
    let lineNumber: Int?
    let type: DiffLineType
    let content: String
}

// MARK: - File Change

struct FileChange: Identifiable, Equatable, Sendable {
    var id: String { filePath }
    let filePath: String
    let agentName: String
    let lines: [DiffLine]

    var linesAdded: Int { lines.filter { $0.type == .added }.count }
    var linesRemoved: Int { lines.filter { $0.type == .removed }.count }

    var fileName: String {
        (filePath as NSString).lastPathComponent
    }

    var fileDirectory: String {
        let dir = (filePath as NSString).deletingLastPathComponent
        return dir.isEmpty ? "/" : dir
    }

    var fileExtension: String {
        (filePath as NSString).pathExtension
    }
}

// MARK: - Diff Parser

enum DiffParser {
    /// Parse session entries to extract file changes with synthetic diff lines
    static func extractChanges(from entries: [SessionEntry]) -> [FileChange] {
        var changesByFile: [String: (agent: String, added: Int, deleted: Int, content: String?)] = [:]

        for entry in entries where entry.type == .toolUse {
            guard let filePath = entry.filePath else { continue }
            let agent = entry.agentName ?? "unknown"
            let existing = changesByFile[filePath]
            changesByFile[filePath] = (
                agent: agent,
                added: (existing?.added ?? 0) + entry.linesAdded,
                deleted: (existing?.deleted ?? 0) + entry.linesDeleted,
                content: entry.content ?? existing?.content
            )
        }

        return changesByFile.map { (path, info) in
            let lines = buildDiffLines(
                content: info.content,
                added: info.added,
                deleted: info.deleted
            )
            return FileChange(
                filePath: path,
                agentName: info.agent,
                lines: lines
            )
        }.sorted { $0.filePath < $1.filePath }
    }

    private static func buildDiffLines(content: String?, added: Int, deleted: Int) -> [DiffLine] {
        // If we have actual content that looks like a diff, parse it
        if let content, content.contains("\n") {
            let rawLines = content.components(separatedBy: "\n")
            var result: [DiffLine] = []
            var lineNum = 1

            for (idx, line) in rawLines.enumerated() {
                if line.hasPrefix("@@") {
                    result.append(DiffLine(id: idx, lineNumber: nil, type: .hunkHeader, content: line))
                } else if line.hasPrefix("+") {
                    result.append(DiffLine(id: idx, lineNumber: lineNum, type: .added, content: String(line.dropFirst())))
                    lineNum += 1
                } else if line.hasPrefix("-") {
                    result.append(DiffLine(id: idx, lineNumber: nil, type: .removed, content: String(line.dropFirst())))
                } else {
                    result.append(DiffLine(id: idx, lineNumber: lineNum, type: .context, content: line))
                    lineNum += 1
                }
            }

            if !result.isEmpty { return result }
        }

        // Fallback: generate synthetic summary lines
        var result: [DiffLine] = []
        var idx = 0

        if added > 0 || deleted > 0 {
            result.append(DiffLine(id: idx, lineNumber: nil, type: .hunkHeader, content: "@@ changes @@"))
            idx += 1
        }

        for i in 0..<deleted {
            result.append(DiffLine(id: idx, lineNumber: nil, type: .removed, content: "line \(i + 1)"))
            idx += 1
        }

        for i in 0..<added {
            result.append(DiffLine(id: idx, lineNumber: i + 1, type: .added, content: "line \(i + 1)"))
            idx += 1
        }

        return result
    }
}
