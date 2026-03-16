import SwiftUI

// MARK: - Game Map View (Canvas 2D)

struct GameMapView: View {
    let team: TeamConfig
    let activities: [AgentActivity]
    let tasks: [AgentTask]
    let messages: [InboxMessage]
    let allMembers: [TeamMember]

    @State private var world = OfficeWorld()
    @State private var spriteSheet = SpriteSheet()
    @State private var gameService = GameStateService()
    @State private var selectedAgentName: String?
    @State private var gameTimer: Timer?
    @State private var frameCount = 0
    @State private var hasLoaded = false

    // Drag state
    @State private var dragStart: CGPoint?

    var body: some View {
        VStack(spacing: 0) {
            headerBar
            ZStack(alignment: .topTrailing) {
                // Game canvas
                Canvas { context, size in
                    var ctx = context
                    CanvasRenderer(
                        world: world,
                        spriteSheet: spriteSheet,
                        frameCount: frameCount
                    ).render(context: &ctx, size: size)
                }
                .background(Color(hex: 0xE8E8EC))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .frame(minHeight: 400)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(.horizontal, 8)
                .gesture(dragGesture)
                .gesture(magnifyGesture)
                .onTapGesture { location in
                    handleTap(at: location)
                }

                // Zoom controls overlay
                zoomControls
                    .padding(12)

                // Inspector overlay
                if let name = selectedAgentName {
                    inspectorOverlay(agentName: name)
                        .padding(12)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                        .transition(.opacity.combined(with: .scale(scale: 0.95)))
                }
            }
            statsBar
        }
        .background(PixelTheme.bgSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(PixelTheme.border, lineWidth: 0.5)
        )
        .onKeyPress(.escape) {
            if selectedAgentName != nil {
                selectedAgentName = nil
                return .handled
            }
            return .ignored
        }
        .task {
            await gameService.loadState(teamName: team.name)
            hasLoaded = true
            startGameLoop()
        }
        .onDisappear {
            gameTimer?.invalidate()
            gameTimer = nil
        }
        .onChange(of: activities) { _, newActivities in
            guard hasLoaded else { return }
            gameService.syncFromActivities(
                activities: newActivities, tasks: tasks, messages: messages)
            Task { await gameService.saveState() }
            syncAgentsToWorld()
        }
        .onChange(of: allMembers) { _, _ in
            guard hasLoaded else { return }
            syncAgentsToWorld()
        }
    }

    // MARK: - Header

    private var headerBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "map")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(PixelTheme.accentOrange)
            Text("Agent World")
                .font(.inter(16, weight: .bold))
                .foregroundStyle(PixelTheme.textPrimary)

            Spacer()

            levelBadge
            agentCountBadge
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private var levelBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: 10))
                .foregroundStyle(PixelTheme.yellow)
            Text("Lv.\(gameService.highestLevel)")
                .font(.jetBrainsMono(11, weight: .bold))
                .foregroundStyle(PixelTheme.yellow)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(PixelTheme.yellow.opacity(0.12))
        .clipShape(Capsule())
    }

    private var agentCountBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 10))
                .foregroundStyle(PixelTheme.green)
            Text("\(effectiveMembers.count)")
                .font(.jetBrainsMono(11, weight: .bold))
                .foregroundStyle(PixelTheme.green)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(PixelTheme.green.opacity(0.12))
        .clipShape(Capsule())
    }

    // MARK: - Zoom Controls

    private var zoomControls: some View {
        VStack(spacing: 4) {
            zoomButton(icon: "plus") { world.cameraZoom = min(3.0, world.cameraZoom * 1.25) }
            zoomButton(icon: "minus") { world.cameraZoom = max(0.3, world.cameraZoom * 0.8) }

            Divider()
                .frame(width: 20)
                .overlay(PixelTheme.border)

            zoomButton(icon: "arrow.counterclockwise") {
                world.cameraZoom = 0.55
                world.cameraOffset = CGPoint(x: 0, y: 0)
            }
        }
        .padding(6)
        .background(Color(hex: 0x111116).opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(PixelTheme.border, lineWidth: 0.5)
        )
    }

    private func zoomButton(icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(PixelTheme.textSecondary)
                .frame(width: 28, height: 28)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            if hovering { NSCursor.pointingHand.push() } else { NSCursor.pop() }
        }
    }

    // MARK: - Gestures

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                if dragStart == nil {
                    dragStart = value.startLocation
                }
                let dx = value.translation.width / world.cameraZoom
                let dy = value.translation.height / world.cameraZoom
                world.cameraOffset = CGPoint(
                    x: world.cameraOffset.x + dx * 0.05,
                    y: world.cameraOffset.y + dy * 0.05
                )
            }
            .onEnded { _ in
                dragStart = nil
            }
    }

    private var magnifyGesture: some Gesture {
        MagnifyGesture()
            .onChanged { value in
                let newZoom = world.cameraZoom * value.magnification
                world.cameraZoom = min(3.0, max(0.3, newZoom))
            }
    }

    // MARK: - Tap to Select

    private func handleTap(at location: CGPoint) {
        // Convert screen location to world coordinates
        let worldX = (location.x - 8) / world.cameraZoom - world.cameraOffset.x
        let worldY = (location.y) / world.cameraZoom - world.cameraOffset.y

        // Check if tapped on a character
        for character in world.characters {
            let charRect = CGRect(
                x: character.pixelX - 8,
                y: character.pixelY - 24,
                width: 48,
                height: 64
            )
            if charRect.contains(CGPoint(x: worldX, y: worldY)) {
                withAnimation(.easeInOut(duration: 0.2)) {
                    selectedAgentName = character.id
                }
                return
            }
        }

        // Tapped on empty space
        withAnimation(.easeInOut(duration: 0.2)) {
            selectedAgentName = nil
        }
    }

    // MARK: - Inspector Overlay

    private func inspectorOverlay(agentName: String) -> some View {
        let activity = activities.first { $0.agentName == agentName }
        let member = effectiveMembers.first { $0.name == agentName }
        let gameData = gameService.agentData(for: agentName)

        return AgentInspectorView(
            agentName: agentName,
            activity: activity,
            tasks: tasks,
            gameData: gameData,
            member: member,
            onClose: { selectedAgentName = nil },
            onSendCommand: { agentName, command in
                sendCommandToAgent(agentName: agentName, command: command)
            }
        )
    }

    // MARK: - Stats Bar

    private var statsBar: some View {
        StatsBarView(gameService: gameService, teamName: team.name)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
    }

    // MARK: - Game Loop

    private func startGameLoop() {
        spriteSheet.prerender()
        syncAgentsToWorld()

        // Delayed re-sync to pick up data that arrives after initial load
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            syncAgentsToWorld()
        }

        gameTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { _ in
            Task { @MainActor in
                updateGameState()
                frameCount += 1
                // Re-sync agents every 3 seconds (30fps * 3 = 90 frames)
                if frameCount % 90 == 0 {
                    syncAgentsToWorld()
                }
            }
        }
    }

    private func updateGameState() {
        for i in world.characters.indices {
            var character = world.characters[i]

            switch character.state {
            case .walking:
                // Move toward next path node
                if !character.path.isEmpty {
                    let (nextX, nextY) = character.path[0]
                    let targetPx = CGFloat(nextX) * world.tileSize
                    let targetPy = CGFloat(nextY) * world.tileSize

                    let dx = targetPx - character.pixelX
                    let dy = targetPy - character.pixelY
                    let dist = sqrt(dx * dx + dy * dy)

                    if dist < character.walkSpeed {
                        // Reached this tile
                        character.pixelX = targetPx
                        character.pixelY = targetPy
                        character.gridX = nextX
                        character.gridY = nextY
                        character.path.removeFirst()

                        if character.path.isEmpty {
                            // Reached final destination
                            character.state = .idle
                            // Check if at a desk seat
                            if let seatIdx = world.deskSeats.firstIndex(where: {
                                $0.occupiedBy == character.id && $0.gridX == character.gridX && $0.gridY == character.gridY
                            }) {
                                character.state = .sittingAtDesk
                                character.direction = world.deskSeats[seatIdx].facingDirection
                                // Set working if actively coding/writing
                                if character.activity == .writing || character.activity == .testing || character.activity == .debugging {
                                    character.state = .working
                                }
                            }
                        }
                    } else {
                        // Move toward target
                        character.pixelX += (dx / dist) * character.walkSpeed
                        character.pixelY += (dy / dist) * character.walkSpeed

                        // Update direction
                        if abs(dx) > abs(dy) {
                            character.direction = dx > 0 ? .right : .left
                        } else {
                            character.direction = dy > 0 ? .down : .up
                        }
                    }

                    // Update walk frame
                    character.frameTimer += 1
                    if character.frameTimer >= 5 {
                        character.walkFrame = (character.walkFrame + 1) % 4
                        character.frameTimer = 0
                    }
                } else {
                    character.state = .idle
                }

            case .sittingAtDesk:
                // Update to working if activity is active
                if character.activity == .writing || character.activity == .testing || character.activity == .debugging {
                    character.state = .working
                }

            case .working:
                // Update back to sitting if idle
                if character.activity == .idle || character.activity == .done {
                    character.state = .sittingAtDesk
                }

            case .idle:
                break
            }

            world.characters[i] = character
        }
    }

    // MARK: - Sync Agents

    private func syncAgentsToWorld() {
        let members = effectiveMembers

        for member in members {
            let name = member.name

            // Bug 3 fix: Improved activity inference from tasks + agent type
            let currentAction: ActivityType
            if let act = activities.first(where: { $0.agentName == name }) {
                currentAction = act.currentAction
            } else {
                // Infer from tasks + agent type when no activity reported
                let agentTasks = tasks.filter { $0.owner == name }
                let hasInProgress = agentTasks.contains { $0.status == .inProgress }
                let allDone = !agentTasks.isEmpty && agentTasks.allSatisfy { $0.status == .completed }

                if hasInProgress {
                    // Infer activity based on agent type
                    switch member.agentType {
                    case "tester-qa", "qa-reviewer": currentAction = .testing
                    case "security-expert": currentAction = .reading
                    case "devops": currentAction = .deploying
                    case "sql-server-expert": currentAction = .writing
                    case "tech-lead-gestor", "meta-orchestrator": currentAction = .thinking
                    case "ux-designer": currentAction = .reading
                    default: currentAction = .writing
                    }
                } else if allDone {
                    currentAction = .done
                } else if agentTasks.isEmpty {
                    currentAction = .idle
                } else {
                    currentAction = .thinking  // has pending tasks, planning
                }
            }

            let gameData = gameService.agentData(for: name)

            // Smart classification: analyze file, task, agent type, and messages
            let classified = ActivityClassifier.classify(
                agentName: name,
                agentType: member.agentType,
                activity: activities.first(where: { $0.agentName == name }),
                tasks: tasks,
                messages: messages
            )
            let targetZone = classified.zone
            let emote = classified.emote

            if let idx = world.characters.firstIndex(where: { $0.id == name }) {
                // Update existing character
                var character = world.characters[idx]
                character.activity = currentAction
                character.level = gameData.level
                character.title = gameData.title
                character.emote = emote
                character.toolDescription = classified.toolDescription
                character.visualActivity = classified.visualActivity

                // Check if zone changed — only pathfind when MOVING between zones
                let currentRoom = world.roomAt(gridX: character.gridX, gridY: character.gridY)
                if currentRoom?.id != targetZone {
                    // Release old seat
                    world.releaseSeat(for: name)

                    // Find new seat
                    if let seatIdx = world.availableSeat(in: targetZone) {
                        world.deskSeats[seatIdx].occupiedBy = name
                        let seat = world.deskSeats[seatIdx]
                        character.targetX = seat.gridX
                        character.targetY = seat.gridY

                        // Pathfind from current position to new seat
                        let path = PathFinder.findPath(
                            from: (character.gridX, character.gridY),
                            to: (seat.gridX, seat.gridY),
                            walls: world.wallTiles,
                            furniture: world.furnitureTiles
                        )

                        if !path.isEmpty {
                            character.path = path
                            character.state = .walking
                        } else {
                            // Teleport if no path found
                            character.gridX = seat.gridX
                            character.gridY = seat.gridY
                            character.pixelX = CGFloat(seat.gridX) * world.tileSize
                            character.pixelY = CGFloat(seat.gridY) * world.tileSize
                            character.state = .sittingAtDesk
                            character.direction = seat.facingDirection
                        }
                    } else {
                        // No seat available — place in CENTER of target room (not corridor)
                        if let room = world.rooms.first(where: { $0.id == targetZone }) {
                            let centerX = room.gridX + room.width / 2
                            let centerY = room.gridY + room.height / 2
                            character.gridX = centerX
                            character.gridY = centerY
                            character.pixelX = CGFloat(centerX) * world.tileSize
                            character.pixelY = CGFloat(centerY) * world.tileSize
                        }
                        character.state = .idle
                    }
                }

                world.characters[idx] = character
            } else {
                // Bug 2 fix: New character — TELEPORT directly to seat (no pathfinding on spawn)
                if let seatIdx = world.availableSeat(in: targetZone) {
                    world.deskSeats[seatIdx].occupiedBy = name
                    let seat = world.deskSeats[seatIdx]

                    var character = AgentCharacter(
                        id: name,
                        agentType: member.agentType,
                        gridX: seat.gridX,
                        gridY: seat.gridY
                    )
                    character.pixelX = CGFloat(seat.gridX) * world.tileSize
                    character.pixelY = CGFloat(seat.gridY) * world.tileSize
                    character.state = .sittingAtDesk
                    character.direction = seat.facingDirection
                    character.activity = currentAction
                    character.level = gameData.level
                    character.title = gameData.title
                    character.emote = emote
                    character.toolDescription = classified.toolDescription
                    character.visualActivity = classified.visualActivity

                    world.characters.append(character)
                } else {
                    // No seat available — spawn in CENTER of target room
                    let room = world.rooms.first(where: { $0.id == targetZone })
                    let centerX = room.map { $0.gridX + $0.width / 2 } ?? 25
                    let centerY = room.map { $0.gridY + $0.height / 2 } ?? 15

                    var character = AgentCharacter(
                        id: name,
                        agentType: member.agentType,
                        gridX: centerX,
                        gridY: centerY
                    )
                    character.pixelX = CGFloat(centerX) * world.tileSize
                    character.pixelY = CGFloat(centerY) * world.tileSize
                    character.state = .idle
                    character.activity = currentAction
                    character.level = gameData.level
                    character.title = gameData.title
                    character.emote = emote
                    character.toolDescription = classified.toolDescription
                    character.visualActivity = classified.visualActivity

                    world.characters.append(character)
                }
            }
        }

        // Remove characters whose members left
        let memberNames = Set(members.map(\.name))
        world.characters.removeAll { !memberNames.contains($0.id) }
    }

    // MARK: - Helpers

    private var effectiveMembers: [TeamMember] {
        allMembers.isEmpty ? team.members : allMembers
    }

    private func sendCommandToAgent(agentName: String, command: String) {
        let teamName = team.name
        guard let safeName = ClaudeDataService.sanitizeName(teamName),
              let safeAgent = ClaudeDataService.sanitizeName(agentName) else { return }

        let homeDir = FileManager.default.homeDirectoryForCurrentUser
        let inboxPath = homeDir.appendingPathComponent(".claude/teams/\(safeName)/inboxes/\(safeAgent).json").path

        let message: [String: Any] = [
            "from": "user",
            "to": agentName,
            "text": command,
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "read": false
        ]

        var messages: [[String: Any]] = []
        if let data = FileManager.default.contents(atPath: inboxPath),
           let existing = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            messages = existing
        }
        messages.append(message)

        if let jsonData = try? JSONSerialization.data(withJSONObject: messages, options: .prettyPrinted) {
            try? jsonData.write(to: URL(fileURLWithPath: inboxPath))
        }
    }
}
