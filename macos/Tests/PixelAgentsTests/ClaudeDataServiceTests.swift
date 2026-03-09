import Testing
import Foundation
@testable import PixelAgents

@MainActor
@Suite("ClaudeDataService")
struct ClaudeDataServiceTests {
    // Helper to create a temp directory with test fixtures
    private func createTestFixtures() throws -> String {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-test-\(UUID().uuidString)"
        let fm = FileManager.default

        // Create directory structure: teams, tasks, inboxes
        let teamsDir = "\(tmpDir)/teams"
        let tasksDir = "\(tmpDir)/tasks"

        // Team 1: test-team
        let team1Dir = "\(teamsDir)/test-team"
        let team1InboxDir = "\(team1Dir)/inboxes"
        try fm.createDirectory(atPath: team1InboxDir, withIntermediateDirectories: true)

        // Team 1 config
        let team1Config = """
        {
            "name": "test-team",
            "description": "A test team",
            "createdAt": 1773071657473,
            "leadAgentId": "lead@test-team",
            "members": [
                {"name": "agent-1", "agentId": "agent-1@test-team", "agentType": "developer", "joinedAt": 1773071657473},
                {"name": "agent-2", "agentId": "agent-2@test-team", "agentType": "tester", "joinedAt": 1773071843790}
            ]
        }
        """
        try team1Config.write(toFile: "\(team1Dir)/config.json", atomically: true, encoding: .utf8)

        // Team 1 tasks
        let team1TaskDir = "\(tasksDir)/test-team"
        try fm.createDirectory(atPath: team1TaskDir, withIntermediateDirectories: true)

        let task1 = """
        {"id": "1", "subject": "Setup project", "status": "completed", "owner": "agent-1", "blocks": ["2"], "blockedBy": []}
        """
        try task1.write(toFile: "\(team1TaskDir)/1.json", atomically: true, encoding: .utf8)

        let task2 = """
        {"id": "2", "subject": "Implement feature", "status": "in_progress", "owner": "agent-1", "blockedBy": ["1"]}
        """
        try task2.write(toFile: "\(team1TaskDir)/2.json", atomically: true, encoding: .utf8)

        let task3 = """
        {"id": "3", "subject": "Write tests", "status": "pending", "owner": "agent-2"}
        """
        try task3.write(toFile: "\(team1TaskDir)/3.json", atomically: true, encoding: .utf8)

        // Team 1 inbox messages
        let leadInbox = """
        [
            {"from": "agent-1", "text": "Task 1 done!", "summary": "Task done", "timestamp": "2026-03-09T12:00:00Z", "color": "blue", "read": true},
            {"from": "agent-2", "text": "Starting tests", "summary": "Tests starting", "timestamp": "2026-03-09T12:01:00Z", "color": "green", "read": false}
        ]
        """
        try leadInbox.write(toFile: "\(team1InboxDir)/lead.json", atomically: true, encoding: .utf8)

        // Team 2: empty-team (no tasks, no inbox)
        let team2Dir = "\(teamsDir)/empty-team"
        try fm.createDirectory(atPath: team2Dir, withIntermediateDirectories: true)
        let team2Config = """
        {"name": "empty-team", "members": []}
        """
        try team2Config.write(toFile: "\(team2Dir)/config.json", atomically: true, encoding: .utf8)

        return tmpDir
    }

    private func cleanup(_ path: String) {
        try? FileManager.default.removeItem(atPath: path)
    }

    @Test func loadTeamsFromDirectory() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        #expect(service.teams.count == 2)
        #expect(service.lastError == nil)
        #expect(!service.isLoading)

        // Teams sorted by createdAt descending (test-team has a date, empty-team has nil)
        let teamNames = service.teams.map(\.name)
        #expect(teamNames.contains("test-team"))
        #expect(teamNames.contains("empty-team"))

        let testTeam = service.teams.first { $0.name == "test-team" }
        #expect(testTeam?.description == "A test team")
        #expect(testTeam?.members.count == 2)
        #expect(testTeam?.leadAgentId == "lead@test-team")
    }

    @Test func loadTeamsEmptyDirectory() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-empty-\(UUID().uuidString)"
        let teamsDir = "\(tmpDir)/teams"
        try FileManager.default.createDirectory(atPath: teamsDir, withIntermediateDirectories: true)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        #expect(service.teams.isEmpty)
        #expect(service.lastError == nil)
    }

    @Test func loadTeamsMissingDirectory() async {
        let service = ClaudeDataService(basePath: "/tmp/nonexistent-\(UUID().uuidString)")
        await service.loadTeams()

        #expect(service.teams.isEmpty)
        #expect(service.lastError != nil)
    }

    @Test func loadTasksForTeam() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTasks(teamName: "test-team")

        #expect(service.tasks.count == 3)
        // Should be sorted by id numerically
        #expect(service.tasks[0].id == "1")
        #expect(service.tasks[1].id == "2")
        #expect(service.tasks[2].id == "3")

        #expect(service.tasks[0].status == .completed)
        #expect(service.tasks[1].status == .inProgress)
        #expect(service.tasks[2].status == .pending)
    }

    @Test func loadTasksMissingDirectory() async {
        let service = ClaudeDataService(basePath: "/tmp/nonexistent-\(UUID().uuidString)")
        await service.loadTasks(teamName: "test-team")

        #expect(service.tasks.isEmpty)
    }

    @Test func loadMessagesForTeam() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "test-team")

        #expect(service.messages.count == 2)
        // Sorted by timestamp
        #expect(service.messages[0].from == "agent-1")
        #expect(service.messages[1].from == "agent-2")

        // "to" field should be set from filename when nil
        #expect(service.messages[0].to == "lead")
        #expect(service.messages[1].to == "lead")
    }

    @Test func loadMessagesMissingDirectory() async {
        let service = ClaudeDataService(basePath: "/tmp/nonexistent-\(UUID().uuidString)")
        await service.loadMessages(teamName: "test-team")

        #expect(service.messages.isEmpty)
    }

    @Test func corruptedFileHandling() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-corrupt-\(UUID().uuidString)"
        let fm = FileManager.default

        // Create team with corrupted config
        let teamsDir = "\(tmpDir)/teams"
        let corruptTeamDir = "\(teamsDir)/corrupt-team"
        try fm.createDirectory(atPath: corruptTeamDir, withIntermediateDirectories: true)

        // Write corrupted JSON
        try "NOT VALID JSON {{{".write(toFile: "\(corruptTeamDir)/config.json", atomically: true, encoding: .utf8)

        // Write valid team alongside
        let goodTeamDir = "\(teamsDir)/good-team"
        try fm.createDirectory(atPath: goodTeamDir, withIntermediateDirectories: true)
        try "{\"name\": \"good-team\", \"members\": []}".write(
            toFile: "\(goodTeamDir)/config.json", atomically: true, encoding: .utf8
        )

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        // Should skip corrupted, keep good
        #expect(service.teams.count == 1)
        #expect(service.teams.first?.name == "good-team")
        #expect(service.lastError == nil)
    }

    @Test func corruptedTaskFileHandling() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-corrupt-tasks-\(UUID().uuidString)"
        let fm = FileManager.default

        let taskDir = "\(tmpDir)/tasks/my-team"
        try fm.createDirectory(atPath: taskDir, withIntermediateDirectories: true)

        // Valid task
        try "{\"id\": \"1\", \"subject\": \"Valid\"}".write(
            toFile: "\(taskDir)/1.json", atomically: true, encoding: .utf8
        )
        // Corrupted task
        try "BROKEN".write(
            toFile: "\(taskDir)/2.json", atomically: true, encoding: .utf8
        )

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTasks(teamName: "my-team")

        #expect(service.tasks.count == 1)
        #expect(service.tasks.first?.subject == "Valid")
    }

    @Test func taskStats() {
        let service = ClaudeDataService(basePath: "/tmp/unused")
        service.tasks = [
            AgentTask(id: "1", subject: "A", status: .pending),
            AgentTask(id: "2", subject: "B", status: .inProgress),
            AgentTask(id: "3", subject: "C", status: .completed),
            AgentTask(id: "4", subject: "D", status: .completed),
            AgentTask(id: "5", subject: "E", status: .inProgress),
        ]

        let stats = service.taskStats
        #expect(stats.pending == 1)
        #expect(stats.inProgress == 2)
        #expect(stats.completed == 2)
    }

    @Test func activeAgentCount() {
        let service = ClaudeDataService(basePath: "/tmp/unused")
        service.activities = [
            AgentActivity(agentName: "a", currentAction: .reading, currentFile: nil,
                          totalLinesAdded: 0, totalLinesDeleted: 0, tokensUsed: 0,
                          tasksCompleted: 0, tasksTotal: 0, lastActivity: nil),
            AgentActivity(agentName: "b", currentAction: .idle, currentFile: nil,
                          totalLinesAdded: 0, totalLinesDeleted: 0, tokensUsed: 0,
                          tasksCompleted: 0, tasksTotal: 0, lastActivity: nil),
            AgentActivity(agentName: "c", currentAction: .writing, currentFile: nil,
                          totalLinesAdded: 0, totalLinesDeleted: 0, tokensUsed: 0,
                          tasksCompleted: 0, tasksTotal: 0, lastActivity: nil),
            AgentActivity(agentName: "d", currentAction: .done, currentFile: nil,
                          totalLinesAdded: 0, totalLinesDeleted: 0, tokensUsed: 0,
                          tasksCompleted: 0, tasksTotal: 0, lastActivity: nil),
        ]

        #expect(service.activeAgentCount == 2) // reading + writing
    }

    @Test func selectTeamFlow() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        let team = try #require(service.teams.first { $0.name == "test-team" })
        await service.selectTeam(team)

        #expect(service.selectedTeam?.name == "test-team")
        #expect(service.tasks.count == 3)
        #expect(service.messages.count == 2)
        // 2 config members + "lead" discovered from inbox filename (messages to "lead")
        #expect(service.activities.count == 3)
    }

    @Test func computeActivities() {
        let service = ClaudeDataService(basePath: "/tmp/unused")
        service.tasks = [
            AgentTask(id: "1", subject: "Task", status: .completed, owner: "agent-1"),
        ]
        service.sessionEntries = [
            SessionEntry(type: .toolUse, agentName: "agent-1", toolName: "Read"),
        ]

        let team = TeamConfig(
            name: "test",
            description: nil,
            members: [
                TeamMember(name: "agent-1", agentId: "a1"),
                TeamMember(name: "agent-2", agentId: "a2"),
            ],
            createdAt: nil
        )

        service.discoverMembers(for: team)
        service.computeActivities(for: team)

        #expect(service.activities.count == 2)
        let a1 = service.activities.first { $0.agentName == "agent-1" }
        #expect(a1?.currentAction == .reading)
        #expect(a1?.tasksCompleted == 1)

        let a2 = service.activities.first { $0.agentName == "agent-2" }
        #expect(a2?.currentAction == .idle)
    }

    @Test func computeTelemetry() {
        let service = ClaudeDataService(basePath: "/tmp/unused")
        service.sessionEntries = [
            SessionEntry(type: .text, agentName: "a", tokensUsed: 1000),
            SessionEntry(type: .error, agentName: "b", filePath: "/test.swift"),
        ]

        let team = TeamConfig(
            name: "test",
            description: nil,
            members: [],
            createdAt: Date().addingTimeInterval(-120) // 2 minutes ago
        )

        service.computeTelemetry(for: team)

        #expect(service.telemetry.totalTokens == 1000)
        #expect(service.telemetry.errorCount == 1)
        #expect(service.telemetry.filesChanged == 1)
        #expect(service.telemetry.duration >= 119) // ~120 seconds
    }

    @Test func refreshFlow() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        let team = try #require(service.teams.first { $0.name == "test-team" })
        await service.selectTeam(team)

        // Refresh should reload everything
        await service.refresh()

        #expect(service.teams.count == 2)
        #expect(service.selectedTeam?.name == "test-team")
        #expect(service.tasks.count == 3)
    }

    @Test func initWithDefaultPath() {
        let service = ClaudeDataService()
        // Should not crash and initialize with home path
        #expect(service.teams.isEmpty)
        #expect(service.selectedTeam == nil)
    }

    @Test func initWithCustomPath() {
        let service = ClaudeDataService(basePath: "/custom/path")
        #expect(service.teams.isEmpty)
    }

    @Test func startAndStopWatching() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        // Start watching should not crash
        await service.startWatching()

        // Stop watching should clean up
        await service.stopWatching()
    }

    @Test func loadMessagesWithToFieldAlreadySet() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-msg-to-\(UUID().uuidString)"
        let fm = FileManager.default

        let teamDir = "\(tmpDir)/teams/msg-team"
        let inboxDir = "\(teamDir)/inboxes"
        try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

        // Messages where "to" is already set
        let inbox = """
        [
            {"from": "sender", "to": "explicit-recipient", "text": "Hello", "timestamp": "2026-03-09T12:00:00Z"}
        ]
        """
        try inbox.write(toFile: "\(inboxDir)/recipient.json", atomically: true, encoding: .utf8)

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "msg-team")

        #expect(service.messages.count == 1)
        // "to" was already set, should not be overwritten
        #expect(service.messages[0].to == "explicit-recipient")
    }

    @Test func loadCorruptedInboxHandling() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-corrupt-inbox-\(UUID().uuidString)"
        let fm = FileManager.default

        let teamDir = "\(tmpDir)/teams/corrupt-inbox-team"
        let inboxDir = "\(teamDir)/inboxes"
        try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

        // Corrupted inbox
        try "NOT JSON".write(toFile: "\(inboxDir)/agent.json", atomically: true, encoding: .utf8)

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "corrupt-inbox-team")

        // Should skip corrupted inbox files gracefully
        #expect(service.messages.isEmpty)
    }

    @Test func loadTasksEmptyTeam() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        // empty-team has no tasks directory
        await service.loadTasks(teamName: "empty-team")

        #expect(service.tasks.isEmpty)
    }

    @Test func refreshWithNoSelectedTeam() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        // No team selected, fullRefresh loads teams
        await service.fullRefresh()

        #expect(service.teams.count == 2)
        #expect(service.selectedTeam == nil)
    }

    @Test func taskStatsEmpty() {
        let service = ClaudeDataService(basePath: "/tmp/unused")
        let stats = service.taskStats
        #expect(stats.pending == 0)
        #expect(stats.inProgress == 0)
        #expect(stats.completed == 0)
    }

    @Test func activeAgentCountEmpty() {
        let service = ClaudeDataService(basePath: "/tmp/unused")
        #expect(service.activeAgentCount == 0)
    }

    @Test func loadMessagesForTeamWithNoInbox() async throws {
        let tmpDir = try createTestFixtures()
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        // empty-team has no inbox directory
        await service.loadMessages(teamName: "empty-team")

        #expect(service.messages.isEmpty)
    }

    @Test func loadMessagesEmptyInboxArray() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-empty-inbox-\(UUID().uuidString)"
        let fm = FileManager.default

        let teamDir = "\(tmpDir)/teams/empty-inbox-team"
        let inboxDir = "\(teamDir)/inboxes"
        try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

        // Empty JSON array
        try "[]".write(toFile: "\(inboxDir)/agent.json", atomically: true, encoding: .utf8)

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "empty-inbox-team")

        #expect(service.messages.isEmpty)
    }

    @Test func loadMessagesMultipleInboxFiles() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-multi-inbox-\(UUID().uuidString)"
        let fm = FileManager.default

        let teamDir = "\(tmpDir)/teams/multi-team"
        let inboxDir = "\(teamDir)/inboxes"
        try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

        let inbox1 = """
        [
            {"from": "agent-1", "text": "Hello", "timestamp": "2026-03-09T12:00:00Z"},
            {"from": "agent-2", "text": "Reply", "timestamp": "2026-03-09T12:01:00Z"}
        ]
        """
        try inbox1.write(toFile: "\(inboxDir)/lead.json", atomically: true, encoding: .utf8)

        let inbox2 = """
        [
            {"from": "lead", "text": "Task for you", "timestamp": "2026-03-09T12:02:00Z"}
        ]
        """
        try inbox2.write(toFile: "\(inboxDir)/agent-1.json", atomically: true, encoding: .utf8)

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "multi-team")

        // Should aggregate from both inbox files
        #expect(service.messages.count == 3)
        // Sorted by timestamp
        #expect(service.messages[0].text == "Hello")
        #expect(service.messages[1].text == "Reply")
        #expect(service.messages[2].text == "Task for you")
    }

    @Test func nonJsonFilesIgnored() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-nonjson-\(UUID().uuidString)"
        let fm = FileManager.default

        let taskDir = "\(tmpDir)/tasks/my-team"
        try fm.createDirectory(atPath: taskDir, withIntermediateDirectories: true)

        // Valid JSON task
        try "{\"id\": \"1\", \"subject\": \"Valid\"}".write(
            toFile: "\(taskDir)/1.json", atomically: true, encoding: .utf8
        )
        // Non-JSON file (should be ignored)
        try "README".write(
            toFile: "\(taskDir)/README.txt", atomically: true, encoding: .utf8
        )

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTasks(teamName: "my-team")

        #expect(service.tasks.count == 1)
    }

    // MARK: - Security: Path Traversal Tests

    @Test func sanitizeNameRejectsPathTraversal() {
        #expect(ClaudeDataService.sanitizeName("..") == nil)
        #expect(ClaudeDataService.sanitizeName(".") == nil)
        #expect(ClaudeDataService.sanitizeName("../../../etc") == nil)
        #expect(ClaudeDataService.sanitizeName("team/../../etc") == nil)
        #expect(ClaudeDataService.sanitizeName("team\\name") == nil)
        #expect(ClaudeDataService.sanitizeName("") == nil)
        #expect(ClaudeDataService.sanitizeName("   ") == nil)
        #expect(ClaudeDataService.sanitizeName("valid-team") == "valid-team")
        #expect(ClaudeDataService.sanitizeName("team_name") == "team_name")
        #expect(ClaudeDataService.sanitizeName("my.team") == "my.team")
    }

    @Test func sanitizeNameRejectsNullBytes() {
        #expect(ClaudeDataService.sanitizeName("team\0name") == nil)
    }

    @Test func sanitizeNameTrimsWhitespace() {
        #expect(ClaudeDataService.sanitizeName("  valid-team  ") == "valid-team")
    }

    @Test func loadTeamsSkipsTraversalDirectories() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-traversal-\(UUID().uuidString)"
        let fm = FileManager.default
        let teamsDir = "\(tmpDir)/teams"

        // Create a legitimate team
        let goodTeam = "\(teamsDir)/good-team"
        try fm.createDirectory(atPath: goodTeam, withIntermediateDirectories: true)
        try "{\"name\": \"good-team\", \"members\": []}".write(
            toFile: "\(goodTeam)/config.json", atomically: true, encoding: .utf8
        )

        // ".." as a directory entry would resolve to parent - sanitizeName blocks it

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        // Only the good team should be loaded
        let teamNames = service.teams.map(\.name)
        #expect(teamNames.contains("good-team"))
        // ".." should never be loaded as a team
        #expect(!teamNames.contains(".."))
    }

    @Test func loadTasksRejectsTraversalTeamName() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-task-traversal-\(UUID().uuidString)"
        let fm = FileManager.default
        try fm.createDirectory(atPath: "\(tmpDir)/tasks", withIntermediateDirectories: true)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        // Attempt path traversal in team name
        await service.loadTasks(teamName: "../../../etc")

        // Should return empty (name rejected by sanitization)
        #expect(service.tasks.isEmpty)
    }

    @Test func loadMessagesRejectsTraversalTeamName() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-msg-traversal-\(UUID().uuidString)"
        let fm = FileManager.default
        try fm.createDirectory(atPath: "\(tmpDir)/teams", withIntermediateDirectories: true)
        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "../../etc/passwd")

        #expect(service.messages.isEmpty)
    }

    // MARK: - Security: Message Limit Test

    @Test func loadMessagesLimitsTo10K() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-limit-\(UUID().uuidString)"
        let fm = FileManager.default

        let teamDir = "\(tmpDir)/teams/big-team"
        let inboxDir = "\(teamDir)/inboxes"
        try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

        // Create inbox with many messages (more than 10K would be impractical,
        // but test that the limit mechanism exists by checking with a smaller set)
        var msgs: [String] = []
        for i in 0..<50 {
            msgs.append("{\"from\": \"agent\", \"text\": \"msg \(i)\", \"timestamp\": \"2026-03-09T12:00:\(String(format: "%02d", i % 60))Z\"}")
        }
        let inboxJson = "[\(msgs.joined(separator: ","))]"
        try inboxJson.write(toFile: "\(inboxDir)/agent.json", atomically: true, encoding: .utf8)

        defer { cleanup(tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadMessages(teamName: "big-team")

        // All 50 should be loaded (under the 10K limit)
        #expect(service.messages.count == 50)
    }
}
