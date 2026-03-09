import Testing
import Foundation
@testable import PixelAgents

@Suite("DiffData")
struct DiffDataTests {
    @Test func fileChangeProperties() {
        let lines = [
            DiffLine(id: 0, lineNumber: nil, type: .hunkHeader, content: "@@ -1,5 +1,8 @@"),
            DiffLine(id: 1, lineNumber: nil, type: .removed, content: "old line 1"),
            DiffLine(id: 2, lineNumber: nil, type: .removed, content: "old line 2"),
            DiffLine(id: 3, lineNumber: 1, type: .added, content: "new line 1"),
            DiffLine(id: 4, lineNumber: 2, type: .added, content: "new line 2"),
            DiffLine(id: 5, lineNumber: 3, type: .added, content: "new line 3"),
            DiffLine(id: 6, lineNumber: 4, type: .context, content: "unchanged"),
        ]

        let change = FileChange(
            filePath: "/Users/test/project/Sources/main.swift",
            agentName: "swift-dev",
            lines: lines
        )

        #expect(change.linesAdded == 3)
        #expect(change.linesRemoved == 2)
        #expect(change.fileName == "main.swift")
        #expect(change.fileDirectory == "/Users/test/project/Sources")
        #expect(change.fileExtension == "swift")
        #expect(change.id == "/Users/test/project/Sources/main.swift")
    }

    @Test func fileChangeEmptyLines() {
        let change = FileChange(filePath: "/test.swift", agentName: "dev", lines: [])

        #expect(change.linesAdded == 0)
        #expect(change.linesRemoved == 0)
    }

    @Test func fileChangeRootPath() {
        let change = FileChange(filePath: "file.txt", agentName: "dev", lines: [])
        #expect(change.fileName == "file.txt")
        #expect(change.fileExtension == "txt")
    }

    @Test func diffLineTypes() {
        #expect(DiffLineType.added == .added)
        #expect(DiffLineType.removed != .added)

        let lineTypes: [DiffLineType] = [.added, .removed, .context, .hunkHeader]
        let uniqueTypes = Set(lineTypes)
        #expect(uniqueTypes.count == 4)
    }

    @Test func diffParserExtractChanges() {
        let entries = [
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                toolName: "Write",
                filePath: "/src/a.swift",
                linesAdded: 10,
                linesDeleted: 0
            ),
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                toolName: "Edit",
                filePath: "/src/b.swift",
                linesAdded: 5,
                linesDeleted: 3
            ),
            SessionEntry(
                type: .text, // not tool_use, should be ignored
                agentName: "dev",
                filePath: "/src/c.swift",
                linesAdded: 100
            ),
        ]

        let changes = DiffParser.extractChanges(from: entries)

        #expect(changes.count == 2) // only tool_use entries with filePath
        let fileA = changes.first { $0.filePath == "/src/a.swift" }
        let fileB = changes.first { $0.filePath == "/src/b.swift" }

        #expect(fileA != nil)
        #expect(fileA?.agentName == "dev")
        #expect(fileB != nil)
    }

    @Test func diffParserAggregatesSameFile() {
        let entries = [
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                filePath: "/src/main.swift",
                linesAdded: 10,
                linesDeleted: 2
            ),
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                filePath: "/src/main.swift",
                linesAdded: 5,
                linesDeleted: 1
            ),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes.count == 1)

        let change = changes[0]
        #expect(change.filePath == "/src/main.swift")
        // Lines in the diff are synthetic, based on aggregated counts
        // added lines should be 15 total, deleted 3 total
    }

    @Test func diffParserEmptyEntries() {
        let changes = DiffParser.extractChanges(from: [])
        #expect(changes.isEmpty)
    }

    @Test func diffParserIgnoresEntriesWithoutFilePath() {
        let entries = [
            SessionEntry(type: .toolUse, agentName: "dev", toolName: "Bash"),
            SessionEntry(type: .toolUse, agentName: "dev", toolName: "Read"),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes.isEmpty)
    }

    @Test func diffParserWithDiffContent() {
        let diffContent = """
        @@ -1,3 +1,5 @@
        +import SwiftUI
        +
         struct App {
        -    var old: Int
        +    var new: String
         }
        """

        let entries = [
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                content: diffContent,
                filePath: "/test.swift",
                linesAdded: 3,
                linesDeleted: 1
            ),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes.count == 1)

        let lines = changes[0].lines
        // Should parse actual diff content
        #expect(lines.contains { $0.type == .hunkHeader })
        #expect(lines.contains { $0.type == .added })
        #expect(lines.contains { $0.type == .removed })
        #expect(lines.contains { $0.type == .context })
    }

    @Test func diffParserSorted() {
        let entries = [
            SessionEntry(type: .toolUse, agentName: "dev", filePath: "/z.swift", linesAdded: 1),
            SessionEntry(type: .toolUse, agentName: "dev", filePath: "/a.swift", linesAdded: 1),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes[0].filePath == "/a.swift")
        #expect(changes[1].filePath == "/z.swift")
    }

    // MARK: - buildDiffLines edge cases

    @Test func diffParserSyntheticFallbackNoContent() {
        // When content is nil, should generate synthetic diff lines
        let entries = [
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                filePath: "/src/file.swift",
                linesAdded: 3,
                linesDeleted: 2
            ),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes.count == 1)

        let lines = changes[0].lines
        // Should have: 1 hunkHeader + 2 removed + 3 added = 6 lines
        #expect(lines.count == 6)
        #expect(lines[0].type == .hunkHeader)
        #expect(lines[0].content == "@@ changes @@")
        #expect(lines.filter { $0.type == .removed }.count == 2)
        #expect(lines.filter { $0.type == .added }.count == 3)
    }

    @Test func diffParserSyntheticFallbackSingleLineContent() {
        // Single-line content (no newline) should fall through to synthetic
        let entries = [
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                content: "just one line no newline",
                filePath: "/src/file.swift",
                linesAdded: 1,
                linesDeleted: 0
            ),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes.count == 1)
        // Single line without newline => content.contains("\n") is false => synthetic fallback
        let lines = changes[0].lines
        #expect(lines.count == 2) // 1 hunkHeader + 1 added
    }

    @Test func diffParserZeroAddedZeroDeleted() {
        // No lines added or deleted, no content => empty diff
        let entries = [
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                filePath: "/src/empty.swift",
                linesAdded: 0,
                linesDeleted: 0
            ),
        ]

        let changes = DiffParser.extractChanges(from: entries)
        #expect(changes.count == 1)
        #expect(changes[0].lines.isEmpty)
    }

    @Test func fileChangeDirectoryForRootFile() {
        // File at root "/" path
        let change = FileChange(filePath: "/file.swift", agentName: "dev", lines: [])
        #expect(change.fileDirectory == "/")
        #expect(change.fileName == "file.swift")
    }
}
