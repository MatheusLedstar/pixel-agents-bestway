import Testing
import Foundation
@testable import PixelAgents

@Suite("SessionParser")
struct SessionParserTests {
    @Test func parseValidJSONL() {
        let jsonl = """
        {"timestamp": "2026-03-09T12:00:00Z", "type": "text", "agentName": "agent-1", "content": "Thinking...", "tokensUsed": 100}
        {"timestamp": "2026-03-09T12:00:01Z", "type": "tool_use", "agentName": "agent-1", "toolName": "Read", "filePath": "/test.swift", "tokensUsed": 50}
        {"timestamp": "2026-03-09T12:00:02Z", "type": "tool_result", "agentName": "agent-1", "content": "File contents...", "tokensUsed": 200}
        """
        let data = jsonl.data(using: .utf8)!
        let entries = SessionParser.parseJSONL(data: data)

        #expect(entries.count == 3)
        #expect(entries[0].type == .text)
        #expect(entries[0].agentName == "agent-1")
        #expect(entries[0].tokensUsed == 100)
        #expect(entries[1].type == .toolUse)
        #expect(entries[1].toolName == "Read")
        #expect(entries[1].filePath == "/test.swift")
        #expect(entries[2].type == .toolResult)
    }

    @Test func parseToolUseEntries() {
        let jsonl = """
        {"timestamp": "2026-03-09T12:00:00Z", "type": "tool_use", "agentName": "dev", "toolName": "Write", "filePath": "/src/main.swift", "linesAdded": 50, "linesDeleted": 0, "tokensUsed": 300}
        {"timestamp": "2026-03-09T12:00:01Z", "type": "tool_use", "agentName": "dev", "toolName": "Edit", "filePath": "/src/main.swift", "linesAdded": 5, "linesDeleted": 10, "tokensUsed": 150}
        {"timestamp": "2026-03-09T12:00:02Z", "type": "tool_use", "agentName": "dev", "toolName": "Read", "filePath": "/src/other.swift", "tokensUsed": 50}
        """
        let data = jsonl.data(using: .utf8)!
        let entries = SessionParser.parseJSONL(data: data)

        #expect(entries.count == 3)

        let writeEntry = entries[0]
        #expect(writeEntry.toolName == "Write")
        #expect(writeEntry.linesAdded == 50)
        #expect(writeEntry.linesDeleted == 0)

        let editEntry = entries[1]
        #expect(editEntry.toolName == "Edit")
        #expect(editEntry.linesAdded == 5)
        #expect(editEntry.linesDeleted == 10)

        let readEntry = entries[2]
        #expect(readEntry.toolName == "Read")
        #expect(readEntry.linesAdded == 0)
        #expect(readEntry.linesDeleted == 0)
    }

    @Test func calculateLinesAddedDeleted() {
        let jsonl = """
        {"timestamp": "2026-03-09T12:00:00Z", "type": "tool_use", "agentName": "dev", "toolName": "Write", "filePath": "/a.swift", "linesAdded": 100, "linesDeleted": 0}
        {"timestamp": "2026-03-09T12:00:01Z", "type": "tool_use", "agentName": "dev", "toolName": "Edit", "filePath": "/a.swift", "linesAdded": 10, "linesDeleted": 20}
        {"timestamp": "2026-03-09T12:00:02Z", "type": "tool_use", "agentName": "dev", "toolName": "Write", "filePath": "/b.swift", "linesAdded": 50, "linesDeleted": 5}
        """
        let data = jsonl.data(using: .utf8)!
        let entries = SessionParser.parseJSONL(data: data)
        let diffs = SessionParser.aggregateDiffs(from: entries)

        #expect(diffs.count == 2)

        // Sorted by filePath
        let diffA = diffs.first { $0.filePath == "/a.swift" }
        let diffB = diffs.first { $0.filePath == "/b.swift" }

        #expect(diffA?.linesAdded == 110)
        #expect(diffA?.linesDeleted == 20)
        #expect(diffB?.linesAdded == 50)
        #expect(diffB?.linesDeleted == 5)
    }

    @Test func handleMalformedLines() {
        let jsonl = """
        {"timestamp": "2026-03-09T12:00:00Z", "type": "text", "agentName": "agent-1"}
        THIS IS NOT JSON
        {"broken json
        {"timestamp": "2026-03-09T12:00:02Z", "type": "error", "agentName": "agent-1"}
        """
        let data = jsonl.data(using: .utf8)!
        let entries = SessionParser.parseJSONL(data: data)

        // Only 2 valid lines should be parsed, malformed lines skipped
        #expect(entries.count == 2)
        #expect(entries[0].type == .text)
        #expect(entries[1].type == .error)
    }

    @Test func handleEmptyFile() {
        let emptyData = Data()
        let entries = SessionParser.parseJSONL(data: emptyData)
        #expect(entries.isEmpty)

        let whitespaceData = "   \n\n  \n".data(using: .utf8)!
        let entries2 = SessionParser.parseJSONL(data: whitespaceData)
        #expect(entries2.isEmpty)
    }

    @Test func tokenCounting() {
        let jsonl = """
        {"timestamp": "2026-03-09T12:00:00Z", "type": "text", "agentName": "agent-1", "tokensUsed": 1000}
        {"timestamp": "2026-03-09T12:00:01Z", "type": "tool_use", "agentName": "agent-1", "tokensUsed": 500}
        {"timestamp": "2026-03-09T12:00:02Z", "type": "text", "agentName": "agent-2", "tokensUsed": 2000}
        {"timestamp": "2026-03-09T12:00:03Z", "type": "error", "agentName": "agent-1"}
        """
        let data = jsonl.data(using: .utf8)!
        let entries = SessionParser.parseJSONL(data: data)

        let totalTokens = entries.reduce(0) { $0 + $1.tokensUsed }
        #expect(totalTokens == 3500)

        let agent1Tokens = entries.filter { $0.agentName == "agent-1" }.reduce(0) { $0 + $1.tokensUsed }
        #expect(agent1Tokens == 1500)
    }

    @Test func extractDiffFromEntry() {
        let entryWithDiff = SessionEntry(
            type: .toolUse,
            agentName: "dev",
            toolName: "Write",
            filePath: "/test.swift",
            linesAdded: 10,
            linesDeleted: 3
        )

        let diff = SessionParser.extractDiff(from: entryWithDiff)
        #expect(diff != nil)
        #expect(diff?.filePath == "/test.swift")
        #expect(diff?.linesAdded == 10)
        #expect(diff?.linesDeleted == 3)
    }

    @Test func extractDiffReturnsNilForNoChanges() {
        // No filePath
        let noFile = SessionEntry(type: .toolUse, agentName: "dev", toolName: "Bash")
        #expect(SessionParser.extractDiff(from: noFile) == nil)

        // No lines changed
        let noLines = SessionEntry(type: .toolUse, agentName: "dev", filePath: "/test.swift")
        #expect(SessionParser.extractDiff(from: noLines) == nil)

        // Text type (not tool_use)
        let textEntry = SessionEntry(type: .text, agentName: "dev", filePath: "/test.swift", linesAdded: 5)
        #expect(SessionParser.extractDiff(from: textEntry) == nil)
    }

    @Test func aggregateDiffsSorted() {
        let entries = [
            SessionEntry(type: .toolUse, filePath: "/z.swift", linesAdded: 1, linesDeleted: 0),
            SessionEntry(type: .toolUse, filePath: "/a.swift", linesAdded: 2, linesDeleted: 1),
            SessionEntry(type: .toolUse, filePath: "/m.swift", linesAdded: 3, linesDeleted: 0),
        ]

        let diffs = SessionParser.aggregateDiffs(from: entries)
        #expect(diffs.count == 3)
        #expect(diffs[0].filePath == "/a.swift")
        #expect(diffs[1].filePath == "/m.swift")
        #expect(diffs[2].filePath == "/z.swift")
    }

    @Test func aggregateDiffsEmpty() {
        let diffs = SessionParser.aggregateDiffs(from: [])
        #expect(diffs.isEmpty)
    }

    @Test func parseJSONLPerformance10000Entries() throws {
        // Generate 10000 JSONL lines
        var lines: [String] = []
        for i in 0..<10000 {
            let line = """
            {"timestamp": "2026-03-09T12:00:00Z", "type": "tool_use", "agentName": "agent-\(i % 5)", "toolName": "Read", "filePath": "/src/file\(i).swift", "tokensUsed": \(i * 10), "linesAdded": \(i % 20), "linesDeleted": \(i % 10)}
            """
            lines.append(line)
        }
        let data = lines.joined(separator: "\n").data(using: .utf8)!

        let start = Date()
        let entries = SessionParser.parseJSONL(data: data)
        let elapsed = Date().timeIntervalSince(start)

        #expect(entries.count == 10000)
        #expect(elapsed < 5.0) // Should be well under 5 seconds
    }

    @Test func extractDiffFromToolResult() {
        // tool_result type should also produce a diff
        let entry = SessionEntry(
            type: .toolResult,
            agentName: "dev",
            filePath: "/test.swift",
            linesAdded: 5,
            linesDeleted: 2
        )
        let diff = SessionParser.extractDiff(from: entry)
        #expect(diff != nil)
        #expect(diff?.linesAdded == 5)
    }
}
