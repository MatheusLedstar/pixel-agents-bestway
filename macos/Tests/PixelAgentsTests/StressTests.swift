import Testing
import Foundation
@testable import PixelAgents

// MARK: - Performance & Stress Tests

@Suite("StressTests")
@MainActor
struct StressTests {

    // MARK: - Helpers

    private func createLargeTestFixture(teamCount: Int, tasksPerTeam: Int, messagesPerTeam: Int) throws -> String {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-stress-\(UUID().uuidString)"
        let fm = FileManager.default
        let teamsDir = "\(tmpDir)/teams"
        let tasksDir = "\(tmpDir)/tasks"

        for t in 0..<teamCount {
            let teamName = "stress-team-\(t)"
            let teamDir = "\(teamsDir)/\(teamName)"
            let inboxDir = "\(teamDir)/inboxes"
            try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

            // Team config with members
            let members = (0..<5).map { i in
                """
                {"name": "agent-\(i)", "agentId": "agent-\(i)@\(teamName)", "agentType": "developer", "joinedAt": \(1773071657473 + i * 1000)}
                """
            }.joined(separator: ",")

            let config = """
            {
                "name": "\(teamName)",
                "description": "Stress test team \(t)",
                "createdAt": \(1773071657473 + t * 100000),
                "members": [\(members)]
            }
            """
            try config.write(toFile: "\(teamDir)/config.json", atomically: true, encoding: .utf8)

            // Tasks
            let teamTaskDir = "\(tasksDir)/\(teamName)"
            try fm.createDirectory(atPath: teamTaskDir, withIntermediateDirectories: true)

            for i in 0..<tasksPerTeam {
                let status = ["pending", "in_progress", "completed"][i % 3]
                let owner = "agent-\(i % 5)"
                let task = """
                {"id": "\(i + 1)", "subject": "Task \(i + 1) for team \(t)", "status": "\(status)", "owner": "\(owner)", "blocks": [], "blockedBy": []}
                """
                try task.write(toFile: "\(teamTaskDir)/\(i + 1).json", atomically: true, encoding: .utf8)
            }

            // Messages
            var msgs: [String] = []
            for i in 0..<messagesPerTeam {
                let from = "agent-\(i % 5)"
                let ts = "2026-03-09T12:\(String(format: "%02d", (i / 60) % 60)):\(String(format: "%02d", i % 60))Z"
                msgs.append("""
                {"from": "\(from)", "text": "Message \(i) from \(from)", "summary": "msg-\(i)", "timestamp": "\(ts)", "read": false}
                """)
            }
            let inboxJSON = "[\(msgs.joined(separator: ","))]"
            try inboxJSON.write(toFile: "\(inboxDir)/team-lead.json", atomically: true, encoding: .utf8)
        }

        return tmpDir
    }

    private func cleanup(_ path: String) {
        try? FileManager.default.removeItem(atPath: path)
    }

    // MARK: - Team Loading Stress

    @Test func stressLoad50Teams() async throws {
        let tmpDir = try createLargeTestFixture(teamCount: 50, tasksPerTeam: 10, messagesPerTeam: 20)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)

        let start = Date()
        await service.loadTeams()
        let elapsed = Date().timeIntervalSince(start)

        #expect(service.teams.count == 50)
        #expect(service.lastError == nil)
        #expect(elapsed < 5.0, "Loading 50 teams took \(elapsed)s, expected < 5s")
    }

    // MARK: - Task Loading Stress

    @Test func stressLoad500Tasks() async throws {
        let tmpDir = try createLargeTestFixture(teamCount: 1, tasksPerTeam: 500, messagesPerTeam: 10)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)

        let start = Date()
        await service.loadTasks(teamName: "stress-team-0")
        let elapsed = Date().timeIntervalSince(start)

        #expect(service.tasks.count == 500)
        #expect(elapsed < 5.0, "Loading 500 tasks took \(elapsed)s, expected < 5s")

        // Verify sorted order
        for i in 0..<(service.tasks.count - 1) {
            let current = Int(service.tasks[i].id) ?? 0
            let next = Int(service.tasks[i + 1].id) ?? 0
            #expect(current < next, "Tasks not sorted: \(current) >= \(next)")
        }
    }

    // MARK: - Message Loading Stress

    @Test func stressLoad10000Messages() async throws {
        let tmpDir = try createLargeTestFixture(teamCount: 1, tasksPerTeam: 5, messagesPerTeam: 10000)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)

        let start = Date()
        await service.loadMessages(teamName: "stress-team-0")
        let elapsed = Date().timeIntervalSince(start)

        #expect(service.messages.count == 10000)
        #expect(elapsed < 10.0, "Loading 10000 messages took \(elapsed)s, expected < 10s")

        // Verify sorted by timestamp
        for i in 0..<(service.messages.count - 1) {
            #expect(service.messages[i].timestamp <= service.messages[i + 1].timestamp,
                    "Messages not sorted at index \(i)")
        }
    }

    // MARK: - Full Select Team Stress

    @Test func stressSelectTeamWith500TasksAnd1000Messages() async throws {
        let tmpDir = try createLargeTestFixture(teamCount: 5, tasksPerTeam: 500, messagesPerTeam: 1000)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        let team = try #require(service.teams.first { $0.name == "stress-team-0" })

        let start = Date()
        await service.selectTeam(team)
        let elapsed = Date().timeIntervalSince(start)

        #expect(service.tasks.count == 500)
        #expect(service.messages.count == 1000)
        // 5 config members + "team-lead" discovered from inbox filename
        #expect(service.activities.count == 6)
        #expect(elapsed < 10.0, "selectTeam took \(elapsed)s, expected < 10s")
    }

    // MARK: - ComputeActivities Stress

    @Test func stressComputeActivitiesWithManyEntries() {
        let service = ClaudeDataService(basePath: "/tmp/unused")

        // Generate 10000 session entries across 20 agents
        var entries: [SessionEntry] = []
        for i in 0..<10000 {
            entries.append(SessionEntry(
                type: .toolUse,
                agentName: "agent-\(i % 20)",
                toolName: ["Read", "Write", "Edit", "Glob", "Grep"][i % 5],
                filePath: "/src/file\(i).swift",
                linesAdded: i % 50,
                linesDeleted: i % 20,
                tokensUsed: i * 10
            ))
        }
        service.sessionEntries = entries

        let members = (0..<20).map { i in
            TeamMember(name: "agent-\(i)", agentId: "agent-\(i)@team")
        }
        let team = TeamConfig(name: "test", description: nil, members: members, createdAt: nil)

        service.discoverMembers(for: team)

        let start = Date()
        service.computeActivities(for: team)
        let elapsed = Date().timeIntervalSince(start)

        #expect(service.activities.count == 20)
        #expect(elapsed < 2.0, "computeActivities took \(elapsed)s, expected < 2s")

        // Verify each agent got entries
        for activity in service.activities {
            #expect(activity.tasksCompleted == 0) // no tasks assigned
            #expect(activity.tokensUsed > 0)
        }
    }

    // MARK: - ComputeTelemetry Stress

    @Test func stressComputeTelemetryWithManyEntries() {
        let service = ClaudeDataService(basePath: "/tmp/unused")

        var entries: [SessionEntry] = []
        for i in 0..<5000 {
            let type: SessionEntryType = i % 50 == 0 ? .error : .toolUse
            entries.append(SessionEntry(
                type: type,
                agentName: "agent-\(i % 10)",
                filePath: "/src/file\(i % 200).swift",
                tokensUsed: 100
            ))
        }
        service.sessionEntries = entries

        let team = TeamConfig(
            name: "test", description: nil, members: [],
            createdAt: Date().addingTimeInterval(-3600)
        )

        let start = Date()
        service.computeTelemetry(for: team)
        let elapsed = Date().timeIntervalSince(start)

        #expect(service.telemetry.totalTokens == 500000) // 5000 * 100
        #expect(service.telemetry.errorCount == 100) // 5000 / 50
        #expect(service.telemetry.filesChanged == 200)
        #expect(elapsed < 1.0, "computeTelemetry took \(elapsed)s, expected < 1s")
    }

    // MARK: - SessionParser JSONL Stress

    @Test func stressParseJSONL50000Lines() {
        var lines: [String] = []
        for i in 0..<50000 {
            lines.append("""
            {"timestamp": "2026-03-09T12:00:00Z", "type": "tool_use", "agentName": "agent-\(i % 10)", "toolName": "Read", "filePath": "/src/file\(i).swift", "tokensUsed": \(i % 1000), "linesAdded": \(i % 30), "linesDeleted": \(i % 15)}
            """)
        }
        let data = lines.joined(separator: "\n").data(using: .utf8)!

        let start = Date()
        let entries = SessionParser.parseJSONL(data: data)
        let elapsed = Date().timeIntervalSince(start)

        #expect(entries.count == 50000)
        #expect(elapsed < 15.0, "Parsing 50000 JSONL lines took \(elapsed)s, expected < 15s")
    }

    @Test func stressAggregateDiffs1000Files() {
        var entries: [SessionEntry] = []
        for i in 0..<5000 {
            entries.append(SessionEntry(
                type: .toolUse,
                agentName: "agent-\(i % 5)",
                filePath: "/src/file\(i % 1000).swift",
                linesAdded: i % 20 + 1,
                linesDeleted: i % 10
            ))
        }

        let start = Date()
        let diffs = SessionParser.aggregateDiffs(from: entries)
        let elapsed = Date().timeIntervalSince(start)

        #expect(diffs.count == 1000)
        #expect(elapsed < 2.0, "Aggregating 5000 entries into 1000 diffs took \(elapsed)s, expected < 2s")

        // Verify sorted
        for i in 0..<(diffs.count - 1) {
            #expect(diffs[i].filePath < diffs[i + 1].filePath)
        }
    }

    // MARK: - DiffParser Stress

    @Test func stressDiffParserExtractChanges2000Entries() {
        var entries: [SessionEntry] = []
        for i in 0..<2000 {
            entries.append(SessionEntry(
                type: .toolUse,
                agentName: "agent-\(i % 8)",
                toolName: "Write",
                filePath: "/src/module\(i % 50)/file\(i % 200).swift",
                linesAdded: (i % 30) + 1,
                linesDeleted: i % 15
            ))
        }

        let start = Date()
        let changes = DiffParser.extractChanges(from: entries)
        let elapsed = Date().timeIntervalSince(start)

        #expect(changes.count <= 200, "Expected at most 200 unique files")
        #expect(elapsed < 2.0, "DiffParser.extractChanges took \(elapsed)s, expected < 2s")
    }

    // MARK: - FileWatcher Stress

    @Test func stressFileWatcher100Paths() async throws {
        let fm = FileManager.default
        var dirs: [String] = []

        // Create 100 temp directories
        for i in 0..<100 {
            let dir = NSTemporaryDirectory() + "fw-stress-\(UUID().uuidString)-\(i)"
            try fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
            dirs.append(dir)
        }
        defer {
            for dir in dirs {
                try? fm.removeItem(atPath: dir)
            }
        }

        let watcher = FileWatcher { }

        let start = Date()
        for dir in dirs {
            await watcher.watch(path: dir)
        }
        let watchElapsed = Date().timeIntervalSince(start)

        let paths = await watcher.watchedPaths
        #expect(paths.count == 100)
        #expect(watchElapsed < 20.0, "Watching 100 paths took \(watchElapsed)s, expected < 20s")

        // Cleanup
        let stopStart = Date()
        await watcher.stopAll()
        let stopElapsed = Date().timeIntervalSince(stopStart)

        #expect(await watcher.watchedPaths.isEmpty)
        #expect(stopElapsed < 2.0, "stopAll for 100 paths took \(stopElapsed)s, expected < 2s")
    }

    // MARK: - ISO8601 Parsing Stress

    @Test func stressISO8601ParsingPerformance() throws {
        // Test that static formatter optimization makes date parsing fast
        let jsonLines = (0..<5000).map { i -> String in
            let second = String(format: "%02d", i % 60)
            let minute = String(format: "%02d", (i / 60) % 60)
            return """
            {"from": "agent-\(i % 5)", "text": "msg \(i)", "timestamp": "2026-03-09T12:\(minute):\(second)Z"}
            """
        }
        let jsonArray = "[\(jsonLines.joined(separator: ","))]"
        let data = jsonArray.data(using: .utf8)!

        let decoder = JSONDecoder()
        let start = Date()
        let messages = try decoder.decode([InboxMessage].self, from: data)
        let elapsed = Date().timeIntervalSince(start)

        #expect(messages.count == 5000)
        #expect(elapsed < 5.0, "Decoding 5000 InboxMessages took \(elapsed)s, expected < 5s")
    }

    @Test func stressSessionEntryISO8601Parsing() {
        let lines = (0..<5000).map { i -> String in
            let second = String(format: "%02d", i % 60)
            let minute = String(format: "%02d", (i / 60) % 60)
            return """
            {"timestamp": "2026-03-09T12:\(minute):\(second)Z", "type": "text", "agentName": "agent-\(i % 5)", "tokensUsed": \(i * 10)}
            """
        }
        let data = lines.joined(separator: "\n").data(using: .utf8)!

        let start = Date()
        let entries = SessionParser.parseJSONL(data: data)
        let elapsed = Date().timeIntervalSince(start)

        #expect(entries.count == 5000)
        #expect(elapsed < 5.0, "Parsing 5000 SessionEntries took \(elapsed)s, expected < 5s")
    }

    // MARK: - TaskStats Single-Pass Stress

    @Test func stressTaskStatsSinglePass() {
        let service = ClaudeDataService(basePath: "/tmp/unused")

        // Create 10000 tasks with various statuses
        service.tasks = (0..<10000).map { i in
            let status: TaskStatus = switch i % 3 {
            case 0: .pending
            case 1: .inProgress
            default: .completed
            }
            return AgentTask(id: "\(i)", subject: "Task \(i)", status: status)
        }

        let start = Date()
        // Call taskStats many times to stress the single-pass optimization
        for _ in 0..<1000 {
            let stats = service.taskStats
            #expect(stats.pending + stats.inProgress + stats.completed == 10000)
        }
        let elapsed = Date().timeIntervalSince(start)

        #expect(elapsed < 5.0, "1000 calls to taskStats with 10000 tasks took \(elapsed)s, expected < 5s")
    }

    // MARK: - Memory Footprint

    @Test func stressMemoryWithLargeDataset() async throws {
        let tmpDir = try createLargeTestFixture(teamCount: 10, tasksPerTeam: 100, messagesPerTeam: 500)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        #expect(service.teams.count == 10)

        // Select and load all teams sequentially to verify no memory issues
        for team in service.teams {
            await service.selectTeam(team)
            #expect(service.tasks.count == 100)
            #expect(service.messages.count == 500)
        }

        // Refresh should not accumulate data
        await service.refresh()
        #expect(service.teams.count == 10)
    }

    // MARK: - Concurrent Refresh Stress

    @Test func stressConcurrentRefresh() async throws {
        let tmpDir = try createLargeTestFixture(teamCount: 3, tasksPerTeam: 50, messagesPerTeam: 100)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        let team = try #require(service.teams.first)
        await service.selectTeam(team)

        // Multiple sequential refreshes should not crash or corrupt state
        for _ in 0..<10 {
            await service.refresh()
        }

        #expect(service.teams.count == 3)
        #expect(service.selectedTeam != nil)
    }

    // MARK: - AgentActivity.from Stress

    @Test func stressAgentActivityFromLargeEntries() {
        // 10000 entries for a single agent
        let entries = (0..<10000).map { i in
            SessionEntry(
                type: .toolUse,
                agentName: "dev",
                toolName: ["Read", "Write", "Edit", "Glob", "Grep"][i % 5],
                filePath: "/src/file\(i).swift",
                linesAdded: i % 100,
                linesDeleted: i % 50,
                tokensUsed: 100
            )
        }

        let tasks = (0..<100).map { i in
            AgentTask(
                id: "\(i)",
                subject: "Task \(i)",
                status: i < 60 ? .completed : .inProgress,
                owner: "dev"
            )
        }

        let start = Date()
        let activity = AgentActivity.from(agentName: "dev", entries: entries, tasks: tasks)
        let elapsed = Date().timeIntervalSince(start)

        #expect(activity.totalLinesAdded > 0)
        #expect(activity.totalLinesDeleted > 0)
        #expect(activity.tokensUsed == 1_000_000) // 10000 * 100
        #expect(activity.tasksCompleted == 60)
        #expect(activity.tasksTotal == 100)
        #expect(elapsed < 1.0, "AgentActivity.from with 10000 entries took \(elapsed)s, expected < 1s")
    }
}
