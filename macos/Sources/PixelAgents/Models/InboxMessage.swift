import Foundation

// MARK: - Inbox Message

struct InboxMessage: Codable, Identifiable, Equatable, Sendable {
    var id: String { "\(from)-\(timestamp.timeIntervalSince1970)" }
    let from: String
    let to: String?
    let text: String
    let summary: String?
    let timestamp: Date
    let color: String?
    let read: Bool

    enum CodingKeys: String, CodingKey {
        case from, to, text, summary, timestamp, color, read
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        from = try container.decode(String.self, forKey: .from)
        to = try container.decodeIfPresent(String.self, forKey: .to)
        text = try container.decodeIfPresent(String.self, forKey: .text) ?? ""
        summary = try container.decodeIfPresent(String.self, forKey: .summary)
        color = try container.decodeIfPresent(String.self, forKey: .color)
        read = try container.decodeIfPresent(Bool.self, forKey: .read) ?? false

        // timestamp comes as ISO 8601 string (with or without fractional seconds)
        let timestampStr = try container.decode(String.self, forKey: .timestamp)
        if let date = Self.parseISO8601(timestampStr) {
            timestamp = date
        } else {
            timestamp = Date()
        }
    }

    init(from: String, to: String? = nil, text: String, summary: String? = nil,
         timestamp: Date = Date(), color: String? = nil, read: Bool = false) {
        self.from = from
        self.to = to
        self.text = text
        self.summary = summary
        self.timestamp = timestamp
        self.color = color
        self.read = read
    }

    private static let isoFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        return f
    }()

    private static let isoFractionalFormatter: ISO8601DateFormatter = {
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

    /// Try to parse the text as a structured message (task_assignment, etc.)
    var parsedType: String? {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return nil
        }
        return type
    }

    /// Protocol message types that should be hidden from user-facing feeds
    private static let protocolTypes: Set<String> = [
        "idle_notification",
        "shutdown_approved",
        "shutdown_request",
        "shutdown_response",
        "plan_approval_request",
        "plan_approval_response"
    ]

    /// Whether this message is an internal protocol message (not user-facing)
    var isProtocolMessage: Bool {
        guard let type = parsedType else { return false }
        return Self.protocolTypes.contains(type)
    }

    /// Message type label for display as a badge (e.g. "task_assignment")
    var displayType: String? {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            return nil
        }
        return type.replacingOccurrences(of: "_", with: " ")
    }

    /// Message body content only (without type prefix), preserving markdown
    var displayBody: String {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return text
        }
        if let subject = json["subject"] as? String { return subject }
        if let message = json["message"] as? String { return message }
        if let body = json["body"] as? String { return body }
        if let status = json["status"] as? String { return status }
        if let type = json["type"] as? String, Self.protocolTypes.contains(type) {
            return type.replacingOccurrences(of: "_", with: " ")
        }
        return text
    }

    /// Display content with type prefix (for Activity Feed and non-markdown contexts)
    var displayContent: String {
        if let type = displayType {
            return "[\(type)] \(displayBody)"
        }
        return displayBody
    }
}
