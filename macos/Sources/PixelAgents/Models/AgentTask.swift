import Foundation

// MARK: - Agent Task

struct AgentTask: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let subject: String
    let description: String?
    let status: TaskStatus
    let owner: String?
    let activeForm: String?
    let blocks: [String]
    let blockedBy: [String]
    let metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id, subject, description, status, owner, activeForm, blocks, blockedBy, metadata
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        // id can come as String or Int in JSON
        if let stringId = try? container.decode(String.self, forKey: .id) {
            id = stringId
        } else if let intId = try? container.decode(Int.self, forKey: .id) {
            id = String(intId)
        } else {
            id = "unknown"
        }

        subject = try container.decode(String.self, forKey: .subject)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        status = try container.decodeIfPresent(TaskStatus.self, forKey: .status) ?? .pending
        owner = try container.decodeIfPresent(String.self, forKey: .owner)
        activeForm = try container.decodeIfPresent(String.self, forKey: .activeForm)
        blocks = try container.decodeIfPresent([String].self, forKey: .blocks) ?? []
        blockedBy = try container.decodeIfPresent([String].self, forKey: .blockedBy) ?? []
        metadata = try container.decodeIfPresent([String: String].self, forKey: .metadata)
    }

    init(id: String, subject: String, description: String? = nil, status: TaskStatus = .pending,
         owner: String? = nil, activeForm: String? = nil, blocks: [String] = [],
         blockedBy: [String] = [], metadata: [String: String]? = nil) {
        self.id = id
        self.subject = subject
        self.description = description
        self.status = status
        self.owner = owner
        self.activeForm = activeForm
        self.blocks = blocks
        self.blockedBy = blockedBy
        self.metadata = metadata
    }

    var isBlocked: Bool { !blockedBy.isEmpty }
}
