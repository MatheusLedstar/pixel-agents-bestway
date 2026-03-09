import Testing
import Foundation
@testable import PixelAgents

// MARK: - TeamConfig Tests

@Suite("TeamConfig")
struct TeamConfigTests {
    @Test func teamConfigDecoding() throws {
        let json = """
        {
            "name": "pixel-agents-macos",
            "description": "Dashboard macOS nativo",
            "createdAt": 1773071657473,
            "leadAgentId": "team-lead@pixel-agents-macos",
            "leadSessionId": "92612041-8c39-4ad5-8543-953008524cc2",
            "members": [
                {
                    "agentId": "team-lead@pixel-agents-macos",
                    "name": "team-lead",
                    "agentType": "team-lead",
                    "model": "claude-opus-4-6",
                    "joinedAt": 1773071657473,
                    "cwd": "/Users/test/project",
                    "color": "red"
                },
                {
                    "agentId": "swift-arch@pixel-agents-macos",
                    "name": "swift-arch",
                    "agentType": "general-purpose",
                    "model": "claude-opus-4-6",
                    "color": "blue",
                    "joinedAt": 1773071843790,
                    "cwd": "/Users/test/project"
                }
            ]
        }
        """.data(using: .utf8)!

        let config = try JSONDecoder().decode(TeamConfig.self, from: json)

        #expect(config.name == "pixel-agents-macos")
        #expect(config.description == "Dashboard macOS nativo")
        #expect(config.leadAgentId == "team-lead@pixel-agents-macos")
        #expect(config.leadSessionId == "92612041-8c39-4ad5-8543-953008524cc2")
        #expect(config.members.count == 2)
        #expect(config.id == "pixel-agents-macos")

        // Verify createdAt parsed from epoch millis
        let expectedDate = Date(timeIntervalSince1970: 1773071657473 / 1000.0)
        #expect(config.createdAt == expectedDate)

        // Verify first member
        let lead = config.members[0]
        #expect(lead.name == "team-lead")
        #expect(lead.agentId == "team-lead@pixel-agents-macos")
        #expect(lead.agentType == "team-lead")
        #expect(lead.model == "claude-opus-4-6")
        #expect(lead.color == "red")
        #expect(lead.cwd == "/Users/test/project")

        let expectedJoinedAt = Date(timeIntervalSince1970: 1773071657473 / 1000.0)
        #expect(lead.joinedAt == expectedJoinedAt)
    }

    @Test func teamConfigMissingFields() throws {
        let json = """
        {
            "name": "minimal-team",
            "members": []
        }
        """.data(using: .utf8)!

        let config = try JSONDecoder().decode(TeamConfig.self, from: json)

        #expect(config.name == "minimal-team")
        #expect(config.description == nil)
        #expect(config.createdAt == nil)
        #expect(config.leadAgentId == nil)
        #expect(config.leadSessionId == nil)
        #expect(config.members.isEmpty)
    }

    @Test func teamConfigMissingMembersDefaultsToEmpty() throws {
        let json = """
        {
            "name": "no-members-team"
        }
        """.data(using: .utf8)!

        let config = try JSONDecoder().decode(TeamConfig.self, from: json)

        #expect(config.name == "no-members-team")
        #expect(config.members.isEmpty)
    }

    @Test func teamConfigRoundtrip() throws {
        let member = TeamMember(
            name: "agent-1",
            agentId: "agent-1@team",
            agentType: "developer",
            model: "opus",
            color: "green",
            cwd: "/tmp"
        )
        let original = TeamConfig(
            name: "roundtrip-team",
            description: "Test team",
            members: [member],
            createdAt: nil,
            leadAgentId: "agent-1@team"
        )

        let encoder = JSONEncoder()
        let data = try encoder.encode(original)
        let decoded = try JSONDecoder().decode(TeamConfig.self, from: data)

        #expect(decoded.name == original.name)
        #expect(decoded.description == original.description)
        #expect(decoded.members.count == original.members.count)
        #expect(decoded.leadAgentId == original.leadAgentId)
    }

    @Test func teamConfigEquatable() {
        let config1 = TeamConfig(name: "team-a", description: nil, members: [], createdAt: nil)
        let config2 = TeamConfig(name: "team-a", description: nil, members: [], createdAt: nil)
        let config3 = TeamConfig(name: "team-b", description: nil, members: [], createdAt: nil)

        #expect(config1 == config2)
        #expect(config1 != config3)
    }

    @Test func teamMemberHashable() {
        let member1 = TeamMember(name: "agent-1", agentId: "id-1")
        let member2 = TeamMember(name: "agent-1", agentId: "id-1")
        let member3 = TeamMember(name: "agent-2", agentId: "id-2")

        var set: Set<TeamMember> = []
        set.insert(member1)
        set.insert(member2)
        set.insert(member3)

        #expect(set.count == 2)
    }

    @Test func teamMemberMinimalFields() throws {
        let json = """
        {
            "name": "basic-agent",
            "agentId": "basic@team"
        }
        """.data(using: .utf8)!

        let member = try JSONDecoder().decode(TeamMember.self, from: json)

        #expect(member.name == "basic-agent")
        #expect(member.agentId == "basic@team")
        #expect(member.agentType == nil)
        #expect(member.model == nil)
        #expect(member.color == nil)
        #expect(member.cwd == nil)
        #expect(member.joinedAt == nil)
    }
}

// MARK: - AgentTask Tests

@Suite("AgentTask")
struct AgentTaskTests {
    @Test func agentTaskDecoding() throws {
        let json = """
        {
            "id": "1",
            "subject": "Setup projeto",
            "description": "Criar estrutura inicial",
            "status": "in_progress",
            "owner": "swift-arch",
            "activeForm": "Setting up project",
            "blocks": ["2", "3"],
            "blockedBy": [],
            "metadata": {"priority": "high"}
        }
        """.data(using: .utf8)!

        let task = try JSONDecoder().decode(AgentTask.self, from: json)

        #expect(task.id == "1")
        #expect(task.subject == "Setup projeto")
        #expect(task.description == "Criar estrutura inicial")
        #expect(task.status == .inProgress)
        #expect(task.owner == "swift-arch")
        #expect(task.activeForm == "Setting up project")
        #expect(task.blocks == ["2", "3"])
        #expect(task.blockedBy.isEmpty)
        #expect(task.metadata?["priority"] == "high")
        #expect(!task.isBlocked)
    }

    @Test func agentTaskAllStatuses() throws {
        let statuses: [(String, TaskStatus)] = [
            ("pending", .pending),
            ("in_progress", .inProgress),
            ("completed", .completed),
        ]

        for (jsonValue, expectedStatus) in statuses {
            let json = """
            {
                "id": "1",
                "subject": "Test",
                "status": "\(jsonValue)"
            }
            """.data(using: .utf8)!

            let task = try JSONDecoder().decode(AgentTask.self, from: json)
            #expect(task.status == expectedStatus)
        }
    }

    @Test func agentTaskBlockedByLogic() {
        let blockedTask = AgentTask(
            id: "5",
            subject: "Blocked",
            blockedBy: ["1", "2"]
        )
        #expect(blockedTask.isBlocked)

        let unblockedTask = AgentTask(
            id: "6",
            subject: "Unblocked",
            blockedBy: []
        )
        #expect(!unblockedTask.isBlocked)
    }

    @Test func agentTaskIntegerId() throws {
        let json = """
        {
            "id": 42,
            "subject": "Task with int id"
        }
        """.data(using: .utf8)!

        let task = try JSONDecoder().decode(AgentTask.self, from: json)
        #expect(task.id == "42")
    }

    @Test func agentTaskMissingOptionalFields() throws {
        let json = """
        {
            "id": "1",
            "subject": "Minimal task"
        }
        """.data(using: .utf8)!

        let task = try JSONDecoder().decode(AgentTask.self, from: json)

        #expect(task.id == "1")
        #expect(task.subject == "Minimal task")
        #expect(task.description == nil)
        #expect(task.status == .pending)
        #expect(task.owner == nil)
        #expect(task.activeForm == nil)
        #expect(task.blocks.isEmpty)
        #expect(task.blockedBy.isEmpty)
        #expect(task.metadata == nil)
    }

    @Test func agentTaskDefaultStatusIsPending() throws {
        let json = """
        {
            "id": "1",
            "subject": "No status"
        }
        """.data(using: .utf8)!

        let task = try JSONDecoder().decode(AgentTask.self, from: json)
        #expect(task.status == .pending)
    }
}

// MARK: - InboxMessage Tests

@Suite("InboxMessage")
struct InboxMessageTests {
    @Test func inboxMessageDecoding() throws {
        let json = """
        {
            "from": "swift-arch",
            "to": "team-lead",
            "text": "Task #1 completed successfully",
            "summary": "Task #1 done",
            "timestamp": "2026-03-09T15:57:40.359Z",
            "color": "blue",
            "read": true
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)

        #expect(message.from == "swift-arch")
        #expect(message.to == "team-lead")
        #expect(message.text == "Task #1 completed successfully")
        #expect(message.summary == "Task #1 done")
        #expect(message.color == "blue")
        #expect(message.read == true)
    }

    @Test func inboxMessageMinimalFields() throws {
        let json = """
        {
            "from": "agent-1",
            "timestamp": "2026-03-09T12:00:00Z"
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)

        #expect(message.from == "agent-1")
        #expect(message.to == nil)
        #expect(message.text == "")
        #expect(message.summary == nil)
        #expect(message.color == nil)
        #expect(message.read == false)
    }

    @Test func inboxMessageParsedType() {
        let structuredMsg = InboxMessage(
            from: "agent",
            text: "{\"type\": \"task_assignment\", \"subject\": \"Do something\"}",
            timestamp: Date()
        )
        #expect(structuredMsg.parsedType == "task_assignment")

        let plainMsg = InboxMessage(
            from: "agent",
            text: "Just a plain message",
            timestamp: Date()
        )
        #expect(plainMsg.parsedType == nil)
    }

    @Test func inboxMessageDisplayContent() {
        let structuredMsg = InboxMessage(
            from: "agent",
            text: "{\"type\": \"task_assignment\", \"subject\": \"Build feature\"}",
            timestamp: Date()
        )
        #expect(structuredMsg.displayContent == "[task assignment] Build feature")

        let plainMsg = InboxMessage(
            from: "agent",
            text: "Hello team!",
            timestamp: Date()
        )
        #expect(plainMsg.displayContent == "Hello team!")
    }

    @Test func inboxMessageIdentity() {
        let date = Date(timeIntervalSince1970: 1000)
        let msg1 = InboxMessage(from: "agent-a", text: "hi", timestamp: date)
        let msg2 = InboxMessage(from: "agent-a", text: "different text", timestamp: date)

        // Same from + timestamp = same id
        #expect(msg1.id == msg2.id)

        let msg3 = InboxMessage(from: "agent-b", text: "hi", timestamp: date)
        #expect(msg1.id != msg3.id)
    }

    @Test func inboxMessageDisplayContentJsonWithTypeNoSubject() {
        // JSON with "type" but no "subject" => displayType is set, displayBody falls back to raw text
        let msg = InboxMessage(
            from: "agent",
            text: "{\"type\": \"status_update\", \"data\": 42}",
            timestamp: Date()
        )
        #expect(msg.displayType == "status update")
        #expect(msg.displayContent == "[status update] {\"type\": \"status_update\", \"data\": 42}")
    }

    @Test func inboxMessageInvalidTimestampFallsBackToNow() throws {
        let json = """
        {
            "from": "agent",
            "text": "hello",
            "timestamp": "not-a-date"
        }
        """.data(using: .utf8)!

        let msg = try JSONDecoder().decode(InboxMessage.self, from: json)
        // Should not crash; timestamp falls back to Date()
        #expect(msg.from == "agent")
        // Timestamp should be roughly now (within last 5 seconds)
        #expect(abs(msg.timestamp.timeIntervalSinceNow) < 5)
    }
}

// MARK: - SessionEntry Tests

@Suite("SessionEntry")
struct SessionEntryTests {
    @Test func sessionEntryDecoding() throws {
        let json = """
        {
            "timestamp": "2026-03-09T15:57:40.000Z",
            "type": "tool_use",
            "agentName": "swift-arch",
            "content": "Reading file",
            "toolName": "Read",
            "filePath": "/Users/test/main.swift",
            "linesAdded": 10,
            "linesDeleted": 2,
            "tokensUsed": 500
        }
        """.data(using: .utf8)!

        let entry = try JSONDecoder().decode(SessionEntry.self, from: json)

        #expect(entry.type == .toolUse)
        #expect(entry.agentName == "swift-arch")
        #expect(entry.content == "Reading file")
        #expect(entry.toolName == "Read")
        #expect(entry.filePath == "/Users/test/main.swift")
        #expect(entry.linesAdded == 10)
        #expect(entry.linesDeleted == 2)
        #expect(entry.tokensUsed == 500)
    }

    @Test func sessionEntryAllTypes() throws {
        let types: [(String, SessionEntryType)] = [
            ("tool_use", .toolUse),
            ("tool_result", .toolResult),
            ("text", .text),
            ("error", .error),
            ("something_unknown", .unknown),
        ]

        for (jsonValue, expectedType) in types {
            let json = """
            {"timestamp": "2026-03-09T12:00:00Z", "type": "\(jsonValue)"}
            """.data(using: .utf8)!

            let entry = try JSONDecoder().decode(SessionEntry.self, from: json)
            #expect(entry.type == expectedType)
        }
    }

    @Test func sessionEntryEpochTimestamp() throws {
        let json = """
        {
            "timestamp": 1773071657473,
            "type": "text"
        }
        """.data(using: .utf8)!

        let entry = try JSONDecoder().decode(SessionEntry.self, from: json)

        let expected = Date(timeIntervalSince1970: 1773071657473 / 1000.0)
        #expect(entry.timestamp == expected)
    }

    @Test func sessionEntryDefaultValues() throws {
        let json = """
        {
            "timestamp": "2026-03-09T12:00:00Z"
        }
        """.data(using: .utf8)!

        let entry = try JSONDecoder().decode(SessionEntry.self, from: json)

        #expect(entry.type == .unknown)
        #expect(entry.agentName == nil)
        #expect(entry.content == nil)
        #expect(entry.toolName == nil)
        #expect(entry.filePath == nil)
        #expect(entry.linesAdded == 0)
        #expect(entry.linesDeleted == 0)
        #expect(entry.tokensUsed == 0)
    }

    @Test func sessionEntryStableId() throws {
        let json = """
        {
            "timestamp": "2026-03-09T12:00:00Z",
            "type": "text",
            "agentName": "agent-1"
        }
        """.data(using: .utf8)!

        let entry1 = try JSONDecoder().decode(SessionEntry.self, from: json)
        let entry2 = try JSONDecoder().decode(SessionEntry.self, from: json)

        #expect(entry1.id == entry2.id)
    }

    @Test func fileDiffEquality() {
        let diff1 = FileDiff(filePath: "/a.swift", linesAdded: 5, linesDeleted: 2)
        let diff2 = FileDiff(filePath: "/a.swift", linesAdded: 5, linesDeleted: 2)
        let diff3 = FileDiff(filePath: "/b.swift", linesAdded: 5, linesDeleted: 2)

        #expect(diff1 == diff2)
        #expect(diff1 != diff3)
    }
}

// MARK: - Real Data Validation Tests

@MainActor
@Suite("RealDataValidation")
struct RealDataValidationTests {
    // TeamConfig with extra fields from real data (tmuxPaneId, subscriptions, backendType, prompt, etc.)
    @Test func teamConfigDecodesWithExtraFields() throws {
        let json = """
        {
          "name": "pixel-agents-qa",
          "description": "QA Review team",
          "createdAt": 1773072722845,
          "leadAgentId": "team-lead@pixel-agents-qa",
          "leadSessionId": "92612041-8c39-4ad5-8543-953008524cc2",
          "members": [
            {
              "agentId": "team-lead@pixel-agents-qa",
              "name": "team-lead",
              "agentType": "qa-lead",
              "model": "claude-opus-4-6",
              "joinedAt": 1773072722845,
              "tmuxPaneId": "",
              "cwd": "/Users/test/project",
              "subscriptions": []
            },
            {
              "agentId": "qa-reviewer@pixel-agents-qa",
              "name": "qa-reviewer",
              "model": "claude-opus-4-6",
              "prompt": "You are the qa-reviewer agent...",
              "color": "blue",
              "planModeRequired": false,
              "joinedAt": 1773072773962,
              "tmuxPaneId": "in-process",
              "cwd": "/Users/test/project",
              "subscriptions": [],
              "backendType": "in-process"
            }
          ]
        }
        """.data(using: .utf8)!

        let config = try JSONDecoder().decode(TeamConfig.self, from: json)

        #expect(config.name == "pixel-agents-qa")
        #expect(config.description == "QA Review team")
        #expect(config.leadAgentId == "team-lead@pixel-agents-qa")
        #expect(config.members.count == 2)

        let reviewer = config.members[1]
        #expect(reviewer.name == "qa-reviewer")
        #expect(reviewer.color == "blue")
        #expect(reviewer.model == "claude-opus-4-6")
    }

    @Test func teamConfigDecodesWithIsActiveField() throws {
        let json = """
        {
          "name": "agent-cowork-medium",
          "description": "Implement features",
          "createdAt": 1772033942000,
          "leadAgentId": "team-lead@agent-cowork-medium",
          "leadSessionId": "9216ba23-2a71-4bc2-923d-0edc9d281e46",
          "members": [
            {
              "agentId": "voice-watchers-agent@agent-cowork-medium",
              "name": "voice-watchers-agent",
              "agentType": "general-purpose",
              "model": "claude-opus-4-6",
              "prompt": "You are implementing...",
              "color": "purple",
              "planModeRequired": false,
              "joinedAt": 1772034123038,
              "tmuxPaneId": "%20",
              "cwd": "/Users/test",
              "subscriptions": [],
              "backendType": "tmux",
              "isActive": false
            }
          ]
        }
        """.data(using: .utf8)!

        let config = try JSONDecoder().decode(TeamConfig.self, from: json)
        #expect(config.name == "agent-cowork-medium")
        #expect(config.members.count == 1)
        #expect(config.members[0].name == "voice-watchers-agent")
    }

    @Test func agentTaskDecodesRealFormat() throws {
        let json = """
        {
          "id": "1",
          "subject": "Implement rich chat message cards",
          "description": "Replace flat text chat bubbles.",
          "activeForm": "Implementing rich chat cards",
          "status": "pending",
          "blocks": [],
          "blockedBy": []
        }
        """.data(using: .utf8)!

        let task = try JSONDecoder().decode(AgentTask.self, from: json)
        #expect(task.id == "1")
        #expect(task.status == .pending)
        #expect(task.owner == nil)
        #expect(task.activeForm == "Implementing rich chat cards")
    }

    @Test func agentTaskDecodesWithOwnerAndBlocks() throws {
        let json = """
        {
          "id": "1",
          "subject": "Code Review completo",
          "description": "Fazer code review.",
          "activeForm": "Reviewing Swift files",
          "status": "in_progress",
          "blocks": ["2", "4"],
          "blockedBy": [],
          "owner": "qa-reviewer"
        }
        """.data(using: .utf8)!

        let task = try JSONDecoder().decode(AgentTask.self, from: json)
        #expect(task.id == "1")
        #expect(task.status == .inProgress)
        #expect(task.owner == "qa-reviewer")
        #expect(task.blocks == ["2", "4"])
        #expect(!task.isBlocked)
    }

    @Test func inboxMessageDecodesFractionalSeconds() throws {
        let json = """
        {
          "from": "voice-watchers-agent",
          "text": "Task completed.",
          "summary": "Task done",
          "timestamp": "2026-02-25T15:49:53.226Z",
          "color": "purple",
          "read": true
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)
        #expect(message.from == "voice-watchers-agent")
        #expect(message.color == "purple")
        #expect(message.read == true)

        // Verify timestamp was parsed correctly (not fallback to Date())
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let expectedDate = formatter.date(from: "2026-02-25T15:49:53.226Z")!
        #expect(message.timestamp == expectedDate)
    }

    @Test func inboxMessageDecodesStructuredJSON() throws {
        let json = """
        {
          "from": "qa-tester",
          "text": "{\\"type\\":\\"task_assignment\\",\\"taskId\\":\\"3\\",\\"subject\\":\\"Validar dados\\"}",
          "timestamp": "2026-03-09T16:13:16.956Z",
          "color": "green",
          "read": false
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)
        #expect(message.from == "qa-tester")
        #expect(message.read == false)
        #expect(message.parsedType == "task_assignment")
        #expect(message.displayContent == "[task assignment] Validar dados")
    }

    @Test func inboxMessageDecodesIdleNotification() throws {
        let json = """
        {
          "from": "qa-backend",
          "text": "{\\"type\\":\\"idle_notification\\",\\"from\\":\\"qa-backend\\",\\"idleReason\\":\\"available\\"}",
          "timestamp": "2026-02-23T16:33:58.572Z",
          "color": "green",
          "read": true
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)
        #expect(message.from == "qa-backend")
        #expect(message.parsedType == "idle_notification")
    }

    @Test func inboxMessageDecodesShutdownApproved() throws {
        let json = """
        {
          "from": "qa-backend",
          "text": "{\\"type\\":\\"shutdown_approved\\",\\"requestId\\":\\"shutdown-123\\",\\"paneId\\":\\"%14\\"}",
          "timestamp": "2026-02-23T16:34:15.995Z",
          "color": "green",
          "read": true
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)
        #expect(message.parsedType == "shutdown_approved")
    }

    @Test func inboxMessageWithoutToFieldOrSummary() throws {
        let json = """
        {
          "from": "voice-watchers-agent",
          "text": "{\\"type\\":\\"idle_notification\\"}",
          "timestamp": "2026-02-25T15:49:56.554Z",
          "color": "purple",
          "read": true
        }
        """.data(using: .utf8)!

        let message = try JSONDecoder().decode(InboxMessage.self, from: json)
        #expect(message.from == "voice-watchers-agent")
        #expect(message.to == nil)
        #expect(message.summary == nil)
    }

    @Test func inboxArrayDecoding() throws {
        let json = """
        [
          {"from": "agent-1", "text": "First message", "summary": "First", "timestamp": "2026-03-09T12:00:00Z", "color": "blue", "read": true},
          {"from": "agent-2", "text": "{\\"type\\":\\"idle_notification\\"}", "timestamp": "2026-03-09T12:01:00.123Z", "color": "green", "read": false}
        ]
        """.data(using: .utf8)!

        let messages = try JSONDecoder().decode([InboxMessage].self, from: json)
        #expect(messages.count == 2)
        #expect(messages[0].from == "agent-1")
        #expect(messages[0].read == true)
        #expect(messages[1].from == "agent-2")
        #expect(messages[1].read == false)
    }

    @Test func teamConfigMinimalRealWorld() throws {
        let json = """
        {
          "name": "voice-chat-blazor",
          "description": "Componente audio chat Blazor STT",
          "createdAt": 1772730173561,
          "leadAgentId": "team-lead@voice-chat-blazor",
          "leadSessionId": "c3844aa6-95bc-415c-a454-03f68cedca09",
          "members": [
            {
              "agentId": "team-lead@voice-chat-blazor",
              "name": "team-lead",
              "agentType": "team-lead",
              "model": "claude-opus-4-6",
              "joinedAt": 1772730173561,
              "tmuxPaneId": "",
              "cwd": "/private/tmp/AGENT_COWORK_MAC",
              "subscriptions": []
            }
          ]
        }
        """.data(using: .utf8)!

        let config = try JSONDecoder().decode(TeamConfig.self, from: json)
        #expect(config.name == "voice-chat-blazor")
        #expect(config.members.count == 1)
        #expect(config.members[0].cwd == "/private/tmp/AGENT_COWORK_MAC")
    }

    @Test func sessionEntryDecodesFractionalSeconds() throws {
        let json = """
        {
          "timestamp": "2026-03-09T15:49:53.226Z",
          "type": "tool_use",
          "agentName": "agent-1",
          "toolName": "Read"
        }
        """.data(using: .utf8)!

        let entry = try JSONDecoder().decode(SessionEntry.self, from: json)
        #expect(entry.type == .toolUse)
        #expect(entry.agentName == "agent-1")

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let expectedDate = formatter.date(from: "2026-03-09T15:49:53.226Z")!
        #expect(entry.timestamp == expectedDate)
    }

    @Test func claudeDataServiceDecodesRealFormatConfig() async throws {
        let tmpDir = NSTemporaryDirectory() + "pixel-agents-realdata-\(UUID().uuidString)"
        let fm = FileManager.default

        let teamDir = "\(tmpDir)/teams/test-real"
        let inboxDir = "\(teamDir)/inboxes"
        try fm.createDirectory(atPath: inboxDir, withIntermediateDirectories: true)

        let config = """
        {
          "name": "test-real",
          "description": "Test with real format",
          "createdAt": 1773072722845,
          "leadAgentId": "team-lead@test-real",
          "leadSessionId": "92612041-abcd-1234",
          "members": [
            {
              "agentId": "team-lead@test-real",
              "name": "team-lead",
              "agentType": "qa-lead",
              "model": "claude-opus-4-6",
              "joinedAt": 1773072722845,
              "tmuxPaneId": "",
              "cwd": "/Users/test",
              "subscriptions": []
            },
            {
              "agentId": "dev@test-real",
              "name": "dev",
              "model": "claude-opus-4-6",
              "prompt": "You are a developer.",
              "color": "blue",
              "planModeRequired": false,
              "joinedAt": 1773072773962,
              "tmuxPaneId": "in-process",
              "cwd": "/Users/test",
              "subscriptions": [],
              "backendType": "in-process"
            }
          ]
        }
        """
        try config.write(toFile: "\(teamDir)/config.json", atomically: true, encoding: .utf8)

        let tasksDir = "\(tmpDir)/tasks/test-real"
        try fm.createDirectory(atPath: tasksDir, withIntermediateDirectories: true)
        let task1 = """
        {"id": "1", "subject": "Review code", "activeForm": "Reviewing", "status": "in_progress", "blocks": ["2"], "blockedBy": [], "owner": "dev"}
        """
        try task1.write(toFile: "\(tasksDir)/1.json", atomically: true, encoding: .utf8)

        let inbox = """
        [
          {"from": "dev", "text": "Done with task 1", "summary": "Task 1 complete", "timestamp": "2026-03-09T15:49:53.226Z", "color": "blue", "read": true},
          {"from": "dev", "text": "{\\"type\\":\\"idle_notification\\"}", "timestamp": "2026-03-09T15:49:56.554Z", "color": "blue", "read": true}
        ]
        """
        try inbox.write(toFile: "\(inboxDir)/team-lead.json", atomically: true, encoding: .utf8)

        defer { try? fm.removeItem(atPath: tmpDir) }

        let service = ClaudeDataService(basePath: tmpDir)
        await service.loadTeams()

        #expect(service.teams.count == 1)
        #expect(service.teams[0].name == "test-real")
        #expect(service.teams[0].members.count == 2)

        await service.loadTasks(teamName: "test-real")
        #expect(service.tasks.count == 1)
        #expect(service.tasks[0].owner == "dev")

        await service.loadMessages(teamName: "test-real")
        #expect(service.messages.count == 2)

        // Verify fractional seconds were parsed correctly
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let expectedDate = formatter.date(from: "2026-03-09T15:49:53.226Z")!
        #expect(service.messages[0].timestamp == expectedDate)
    }
}

// MARK: - AgentActivity Tests

@Suite("AgentActivity")
struct AgentActivityTests {
    @Test func agentActivityStatusDerivation() {
        // Reading tool
        let readEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1",
            toolName: "Read",
            filePath: "/test.swift"
        )
        let activity1 = AgentActivity.from(
            agentName: "agent-1",
            entries: [readEntry],
            tasks: []
        )
        #expect(activity1.currentAction == .reading)

        // Writing tool
        let writeEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1",
            toolName: "Write",
            filePath: "/test.swift"
        )
        let activity2 = AgentActivity.from(
            agentName: "agent-1",
            entries: [writeEntry],
            tasks: []
        )
        #expect(activity2.currentAction == .writing)

        // Edit tool
        let editEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1",
            toolName: "Edit",
            filePath: "/test.swift"
        )
        let activity3 = AgentActivity.from(
            agentName: "agent-1",
            entries: [editEntry],
            tasks: []
        )
        #expect(activity3.currentAction == .writing)

        // Glob/Grep → reading
        let globEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1",
            toolName: "Glob"
        )
        let activity4 = AgentActivity.from(
            agentName: "agent-1",
            entries: [globEntry],
            tasks: []
        )
        #expect(activity4.currentAction == .reading)

        let grepEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1",
            toolName: "Grep"
        )
        let activity5 = AgentActivity.from(
            agentName: "agent-1",
            entries: [grepEntry],
            tasks: []
        )
        #expect(activity5.currentAction == .reading)

        // Bash → thinking
        let bashEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1",
            toolName: "Bash"
        )
        let activity6 = AgentActivity.from(
            agentName: "agent-1",
            entries: [bashEntry],
            tasks: []
        )
        #expect(activity6.currentAction == .thinking)

        // Text → thinking
        let textEntry = SessionEntry(
            type: .text,
            agentName: "agent-1"
        )
        let activity7 = AgentActivity.from(
            agentName: "agent-1",
            entries: [textEntry],
            tasks: []
        )
        #expect(activity7.currentAction == .thinking)

        // Error → error
        let errorEntry = SessionEntry(
            type: .error,
            agentName: "agent-1"
        )
        let activity8 = AgentActivity.from(
            agentName: "agent-1",
            entries: [errorEntry],
            tasks: []
        )
        #expect(activity8.currentAction == .error)

        // No entries → idle
        let activity9 = AgentActivity.from(
            agentName: "agent-1",
            entries: [],
            tasks: []
        )
        #expect(activity9.currentAction == .idle)
        #expect(activity9.currentFile == nil)

        // tool_use without toolName → thinking
        let noToolEntry = SessionEntry(
            type: .toolUse,
            agentName: "agent-1"
        )
        let activity10 = AgentActivity.from(
            agentName: "agent-1",
            entries: [noToolEntry],
            tasks: []
        )
        #expect(activity10.currentAction == .thinking)
    }

    @Test func agentActivityTaskProgress() {
        let tasks = [
            AgentTask(id: "1", subject: "Task 1", status: .completed, owner: "agent-1"),
            AgentTask(id: "2", subject: "Task 2", status: .inProgress, owner: "agent-1"),
            AgentTask(id: "3", subject: "Task 3", status: .pending, owner: "agent-1"),
            AgentTask(id: "4", subject: "Task 4", status: .completed, owner: "agent-2"),
        ]

        let activity = AgentActivity.from(
            agentName: "agent-1",
            entries: [],
            tasks: tasks
        )

        #expect(activity.tasksCompleted == 1)
        #expect(activity.tasksTotal == 3)
        #expect(activity.taskProgress > 0.33 - 0.01)
        #expect(activity.taskProgress < 0.33 + 0.01)
    }

    @Test func agentActivityTaskProgressZeroDivision() {
        let activity = AgentActivity.from(
            agentName: "agent-1",
            entries: [],
            tasks: []
        )

        #expect(activity.taskProgress == 0)
    }

    @Test func agentActivityLinesAndTokens() {
        let entries = [
            SessionEntry(
                type: .toolUse, agentName: "agent-1",
                toolName: "Write", linesAdded: 50, linesDeleted: 10, tokensUsed: 1000
            ),
            SessionEntry(
                type: .toolUse, agentName: "agent-1",
                toolName: "Edit", linesAdded: 20, linesDeleted: 5, tokensUsed: 500
            ),
            SessionEntry(
                type: .toolUse, agentName: "agent-2",
                toolName: "Write", linesAdded: 100, linesDeleted: 0, tokensUsed: 2000
            ),
        ]

        let activity = AgentActivity.from(
            agentName: "agent-1",
            entries: entries,
            tasks: []
        )

        #expect(activity.totalLinesAdded == 70)
        #expect(activity.totalLinesDeleted == 15)
        #expect(activity.netLinesChanged == 55)
        #expect(activity.tokensUsed == 1500)
    }

    @Test func agentActivityUsesLastEntry() {
        let entries = [
            SessionEntry(type: .toolUse, agentName: "agent-1", toolName: "Read"),
            SessionEntry(type: .toolUse, agentName: "agent-1", toolName: "Write", filePath: "/output.swift"),
        ]

        let activity = AgentActivity.from(
            agentName: "agent-1",
            entries: entries,
            tasks: []
        )

        #expect(activity.currentAction == .writing)
        #expect(activity.currentFile == "/output.swift")
    }

    @Test func agentActivityFiltersOtherAgentEntries() {
        // Entries from agent-2 should NOT affect agent-1's activity
        let entries = [
            SessionEntry(type: .toolUse, agentName: "agent-2", toolName: "Write",
                          linesAdded: 100, linesDeleted: 50, tokensUsed: 5000),
            SessionEntry(type: .toolUse, agentName: "agent-1", toolName: "Read",
                          linesAdded: 0, linesDeleted: 0, tokensUsed: 10),
        ]

        let activity = AgentActivity.from(
            agentName: "agent-1",
            entries: entries,
            tasks: []
        )

        #expect(activity.totalLinesAdded == 0)
        #expect(activity.totalLinesDeleted == 0)
        #expect(activity.tokensUsed == 10)
        #expect(activity.currentAction == .reading)
    }

    @Test func agentActivityToolResultAndUnknownEntryTypes() {
        let toolResultEntry = SessionEntry(type: .toolResult, agentName: "agent-1")
        let activity1 = AgentActivity.from(agentName: "agent-1", entries: [toolResultEntry], tasks: [])
        #expect(activity1.currentAction == .idle)

        let unknownEntry = SessionEntry(type: .unknown, agentName: "agent-1")
        let activity2 = AgentActivity.from(agentName: "agent-1", entries: [unknownEntry], tasks: [])
        #expect(activity2.currentAction == .idle)
    }

    @Test func agentActivityEquatable() {
        let a1 = AgentActivity(agentName: "a", currentAction: .reading, currentFile: nil,
                                totalLinesAdded: 10, totalLinesDeleted: 5, tokensUsed: 100,
                                tasksCompleted: 1, tasksTotal: 3, lastActivity: nil)
        let a2 = AgentActivity(agentName: "a", currentAction: .reading, currentFile: nil,
                                totalLinesAdded: 10, totalLinesDeleted: 5, tokensUsed: 100,
                                tasksCompleted: 1, tasksTotal: 3, lastActivity: nil)
        #expect(a1 == a2)

        let a3 = AgentActivity(agentName: "b", currentAction: .reading, currentFile: nil,
                                totalLinesAdded: 10, totalLinesDeleted: 5, tokensUsed: 100,
                                tasksCompleted: 1, tasksTotal: 3, lastActivity: nil)
        #expect(a1 != a3)
    }
}

// MARK: - TeamTelemetry Tests

@Suite("TeamTelemetry")
struct TeamTelemetryTests {
    @Test func teamTelemetryCostCalculation() {
        let entries = [
            SessionEntry(type: .text, agentName: "a", tokensUsed: 10000),
            SessionEntry(type: .toolUse, agentName: "b", tokensUsed: 20000),
        ]

        let telemetry = TeamTelemetry.from(
            tasks: [],
            entries: entries,
            teamCreatedAt: nil
        )

        #expect(telemetry.totalTokens == 30000)
        // costPerToken = 0.00005
        let expectedCost = 30000.0 * 0.00005
        #expect(abs(telemetry.estimatedCost - expectedCost) < 0.001)
    }

    @Test func teamTelemetryDurationFormatting() {
        // Seconds only
        let t1 = TeamTelemetry(duration: 45, estimatedCost: 0, errorCount: 0, totalTokens: 0, filesChanged: 0)
        #expect(t1.formattedDuration == "45s")

        // Minutes and seconds
        let t2 = TeamTelemetry(duration: 125, estimatedCost: 0, errorCount: 0, totalTokens: 0, filesChanged: 0)
        #expect(t2.formattedDuration == "2m 5s")

        // Hours, minutes, seconds
        let t3 = TeamTelemetry(duration: 3661, estimatedCost: 0, errorCount: 0, totalTokens: 0, filesChanged: 0)
        #expect(t3.formattedDuration == "1h 1m 1s")

        // Zero
        let t4 = TeamTelemetry(duration: 0, estimatedCost: 0, errorCount: 0, totalTokens: 0, filesChanged: 0)
        #expect(t4.formattedDuration == "0s")
    }

    @Test func teamTelemetryFormattedCost() {
        let t = TeamTelemetry(duration: 0, estimatedCost: 1.5, errorCount: 0, totalTokens: 0, filesChanged: 0)
        #expect(t.formattedCost == "$1.50")

        let t2 = TeamTelemetry(duration: 0, estimatedCost: 0.05, errorCount: 0, totalTokens: 0, filesChanged: 0)
        #expect(t2.formattedCost == "$0.05")
    }

    @Test func teamTelemetryFormattedTokens() {
        let t1 = TeamTelemetry(duration: 0, estimatedCost: 0, errorCount: 0, totalTokens: 500, filesChanged: 0)
        #expect(t1.formattedTokens == "500")

        let t2 = TeamTelemetry(duration: 0, estimatedCost: 0, errorCount: 0, totalTokens: 5000, filesChanged: 0)
        #expect(t2.formattedTokens == "5.0K")

        let t3 = TeamTelemetry(duration: 0, estimatedCost: 0, errorCount: 0, totalTokens: 1500000, filesChanged: 0)
        #expect(t3.formattedTokens == "1.5M")
    }

    @Test func teamTelemetryErrorCount() {
        let entries = [
            SessionEntry(type: .error, agentName: "a"),
            SessionEntry(type: .text, agentName: "a"),
            SessionEntry(type: .error, agentName: "b"),
        ]

        let telemetry = TeamTelemetry.from(tasks: [], entries: entries, teamCreatedAt: nil)
        #expect(telemetry.errorCount == 2)
    }

    @Test func teamTelemetryFilesChanged() {
        let entries = [
            SessionEntry(type: .toolUse, agentName: "a", filePath: "/a.swift"),
            SessionEntry(type: .toolUse, agentName: "b", filePath: "/b.swift"),
            SessionEntry(type: .toolUse, agentName: "a", filePath: "/a.swift"), // duplicate
        ]

        let telemetry = TeamTelemetry.from(tasks: [], entries: entries, teamCreatedAt: nil)
        #expect(telemetry.filesChanged == 2)
    }

    @Test func teamTelemetryEmpty() {
        let empty = TeamTelemetry.empty
        #expect(empty.duration == 0)
        #expect(empty.estimatedCost == 0)
        #expect(empty.errorCount == 0)
        #expect(empty.totalTokens == 0)
        #expect(empty.filesChanged == 0)
    }

    @Test func teamTelemetryDurationFromFirstEntryWhenNoCreatedAt() {
        // When teamCreatedAt is nil, should use first entry timestamp
        let twoMinutesAgo = Date().addingTimeInterval(-120)
        let entries = [
            SessionEntry(timestamp: twoMinutesAgo, type: .text, agentName: "a", tokensUsed: 100),
            SessionEntry(type: .text, agentName: "b", tokensUsed: 200),
        ]

        let telemetry = TeamTelemetry.from(tasks: [], entries: entries, teamCreatedAt: nil)
        #expect(telemetry.duration >= 119) // ~120 seconds from first entry
        #expect(telemetry.totalTokens == 300)
    }

    @Test func teamTelemetryDurationZeroWhenNoEntriesNoDates() {
        let telemetry = TeamTelemetry.from(tasks: [], entries: [], teamCreatedAt: nil)
        #expect(telemetry.duration == 0)
    }
}

// MARK: - ActivityType/Enum Tests

@Suite("Enums")
struct EnumTests {
    @Test func agentStatusCases() {
        let allCases = AgentStatus.allCases
        #expect(allCases.count == 4)
        #expect(allCases.contains(.active))
        #expect(allCases.contains(.idle))
        #expect(allCases.contains(.done))
        #expect(allCases.contains(.error))
    }

    @Test func taskStatusCases() {
        let allCases = TaskStatus.allCases
        #expect(allCases.count == 3)
        #expect(allCases.contains(.pending))
        #expect(allCases.contains(.inProgress))
        #expect(allCases.contains(.completed))
    }

    @Test func taskStatusRawValues() {
        #expect(TaskStatus.pending.rawValue == "pending")
        #expect(TaskStatus.inProgress.rawValue == "in_progress")
        #expect(TaskStatus.completed.rawValue == "completed")
    }

    @Test func activityTypeCases() {
        let allCases = ActivityType.allCases
        #expect(allCases.count == 7)
        #expect(allCases.contains(.reading))
        #expect(allCases.contains(.writing))
        #expect(allCases.contains(.thinking))
        #expect(allCases.contains(.messaging))
        #expect(allCases.contains(.idle))
        #expect(allCases.contains(.done))
        #expect(allCases.contains(.error))
    }

    @Test func sessionEntryTypeCoding() throws {
        let types: [(String, SessionEntryType)] = [
            ("tool_use", .toolUse),
            ("tool_result", .toolResult),
            ("text", .text),
            ("error", .error),
        ]

        for (rawValue, expectedType) in types {
            let json = "\"\(rawValue)\"".data(using: .utf8)!
            let decoded = try JSONDecoder().decode(SessionEntryType.self, from: json)
            #expect(decoded == expectedType)
        }

        // Unknown falls back to .unknown
        let unknownJson = "\"foobar\"".data(using: .utf8)!
        let unknown = try JSONDecoder().decode(SessionEntryType.self, from: unknownJson)
        #expect(unknown == .unknown)
    }
}
