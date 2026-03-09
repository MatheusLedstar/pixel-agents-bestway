import Foundation

// MARK: - Team Config

struct TeamConfig: Codable, Identifiable, Equatable, Sendable {
    var id: String { name }
    let name: String
    let description: String?
    let members: [TeamMember]
    let createdAt: Date?
    let leadAgentId: String?
    let leadSessionId: String?

    enum CodingKeys: String, CodingKey {
        case name, description, members, createdAt, leadAgentId, leadSessionId
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        members = try container.decodeIfPresent([TeamMember].self, forKey: .members) ?? []
        leadAgentId = try container.decodeIfPresent(String.self, forKey: .leadAgentId)
        leadSessionId = try container.decodeIfPresent(String.self, forKey: .leadSessionId)

        // createdAt comes as Unix epoch milliseconds
        if let millis = try container.decodeIfPresent(Double.self, forKey: .createdAt) {
            createdAt = Date(timeIntervalSince1970: millis / 1000.0)
        } else {
            createdAt = nil
        }
    }

    init(name: String, description: String?, members: [TeamMember], createdAt: Date?,
         leadAgentId: String? = nil, leadSessionId: String? = nil) {
        self.name = name
        self.description = description
        self.members = members
        self.createdAt = createdAt
        self.leadAgentId = leadAgentId
        self.leadSessionId = leadSessionId
    }
}

// MARK: - Team Member

struct TeamMember: Codable, Identifiable, Equatable, Hashable, Sendable {
    var id: String { name }
    let name: String
    let agentId: String
    let agentType: String?
    let model: String?
    let color: String?
    let cwd: String?
    let joinedAt: Date?

    enum CodingKeys: String, CodingKey {
        case name, agentId, agentType, model, color, cwd, joinedAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        agentId = try container.decode(String.self, forKey: .agentId)
        agentType = try container.decodeIfPresent(String.self, forKey: .agentType)
        model = try container.decodeIfPresent(String.self, forKey: .model)
        color = try container.decodeIfPresent(String.self, forKey: .color)
        cwd = try container.decodeIfPresent(String.self, forKey: .cwd)

        if let millis = try container.decodeIfPresent(Double.self, forKey: .joinedAt) {
            joinedAt = Date(timeIntervalSince1970: millis / 1000.0)
        } else {
            joinedAt = nil
        }
    }

    init(name: String, agentId: String, agentType: String? = nil, model: String? = nil,
         color: String? = nil, cwd: String? = nil, joinedAt: Date? = nil) {
        self.name = name
        self.agentId = agentId
        self.agentType = agentType
        self.model = model
        self.color = color
        self.cwd = cwd
        self.joinedAt = joinedAt
    }
}
