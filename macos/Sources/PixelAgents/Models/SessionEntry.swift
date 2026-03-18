import Foundation

// MARK: - Session Entry Type

enum SessionEntryType: String, Codable, Equatable, Hashable, Sendable {
    case toolUse = "tool_use"
    case toolResult = "tool_result"
    case text
    case error
    case unknown

    init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer().decode(String.self)
        self = SessionEntryType(rawValue: value) ?? .unknown
    }
}

// MARK: - Session Entry

struct SessionEntry: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let timestamp: Date
    let type: SessionEntryType
    let agentName: String?
    let content: String?
    let toolName: String?
    let filePath: String?
    let linesAdded: Int
    let linesDeleted: Int
    let tokensUsed: Int

    enum CodingKeys: String, CodingKey {
        case timestamp, type, agentName, content, toolName, filePath
        case linesAdded, linesDeleted, tokensUsed
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        type = try container.decodeIfPresent(SessionEntryType.self, forKey: .type) ?? .unknown
        agentName = try container.decodeIfPresent(String.self, forKey: .agentName)
        content = try container.decodeIfPresent(String.self, forKey: .content)
        toolName = try container.decodeIfPresent(String.self, forKey: .toolName)
        filePath = try container.decodeIfPresent(String.self, forKey: .filePath)
        linesAdded = try container.decodeIfPresent(Int.self, forKey: .linesAdded) ?? 0
        linesDeleted = try container.decodeIfPresent(Int.self, forKey: .linesDeleted) ?? 0
        tokensUsed = try container.decodeIfPresent(Int.self, forKey: .tokensUsed) ?? 0

        // timestamp as ISO 8601 or epoch
        if let isoStr = try? container.decode(String.self, forKey: .timestamp) {
            timestamp = Self.parseISO8601(isoStr) ?? Date()
        } else if let epoch = try? container.decode(Double.self, forKey: .timestamp) {
            timestamp = Date(timeIntervalSince1970: epoch / 1000.0)
        } else {
            timestamp = Date()
        }

        // Generate stable ID from timestamp + type + agent
        id = "\(timestamp.timeIntervalSince1970)-\(type.rawValue)-\(agentName ?? "anon")"
    }

    init(id: String = UUID().uuidString, timestamp: Date = Date(), type: SessionEntryType = .unknown,
         agentName: String? = nil, content: String? = nil, toolName: String? = nil,
         filePath: String? = nil, linesAdded: Int = 0, linesDeleted: Int = 0, tokensUsed: Int = 0) {
        self.id = id
        self.timestamp = timestamp
        self.type = type
        self.agentName = agentName
        self.content = content
        self.toolName = toolName
        self.filePath = filePath
        self.linesAdded = linesAdded
        self.linesDeleted = linesDeleted
        self.tokensUsed = tokensUsed
    }

    private nonisolated(unsafe) static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        return f
    }()

    private nonisolated(unsafe) static let isoFractionalFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    /// Parse ISO 8601 date string, trying both with and without fractional seconds
    private static func parseISO8601(_ string: String) -> Date? {
        if let date = isoFormatter.date(from: string) {
            return date
        }
        return isoFractionalFormatter.date(from: string)
    }
}

// MARK: - File Diff

struct FileDiff: Equatable, Sendable {
    let filePath: String
    let linesAdded: Int
    let linesDeleted: Int
}
