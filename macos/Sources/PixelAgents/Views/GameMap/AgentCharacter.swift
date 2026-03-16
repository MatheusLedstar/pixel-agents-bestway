import Foundation

// MARK: - Agent Character

struct AgentCharacter: Identifiable {
    let id: String  // agent name
    let agentType: String?
    var gridX: Int
    var gridY: Int
    var targetX: Int
    var targetY: Int
    var pixelX: CGFloat
    var pixelY: CGFloat
    var state: CharacterState = .idle
    var activity: ActivityType = .idle
    var path: [(Int, Int)] = []
    var walkFrame: Int = 0
    var direction: Direction = .down
    var level: Int = 1
    var title: String = "Recruit"
    var emote: String? = nil

    var frameTimer: Int = 0
    let walkSpeed: CGFloat = 2.0

    init(id: String, agentType: String?, gridX: Int, gridY: Int) {
        self.id = id
        self.agentType = agentType
        self.gridX = gridX
        self.gridY = gridY
        self.targetX = gridX
        self.targetY = gridY
        self.pixelX = CGFloat(gridX) * 32.0
        self.pixelY = CGFloat(gridY) * 32.0
    }
}

// MARK: - Character State

enum CharacterState {
    case idle
    case walking
    case sittingAtDesk
    case working
}
