import SwiftUI

// MARK: - Canvas Renderer

struct CanvasRenderer {
    let world: OfficeWorld
    let spriteSheet: SpriteSheet
    let frameCount: Int
    let tileSize: CGFloat = 32

    func render(context: inout GraphicsContext, size: CGSize) {
        let zoom = world.cameraZoom
        let offset = world.cameraOffset

        context.scaleBy(x: zoom, y: zoom)
        context.translateBy(x: offset.x, y: offset.y)

        renderFloor(&context)
        renderWalls(&context)
        renderFurniture(&context)
        renderLEDStrips(&context)
        renderRoomLabels(&context)
        renderCharactersSorted(&context)
    }

    // MARK: - Floor

    private func renderFloor(_ ctx: inout GraphicsContext) {
        let floorColor = Color(hex: 0xE8E8EC)
        let corridorColor = Color(hex: 0xD5D5DA)
        let gridLineColor = Color.white.opacity(0.15)

        for row in 0..<world.rows {
            for col in 0..<world.cols {
                let rect = CGRect(x: CGFloat(col) * tileSize, y: CGFloat(row) * tileSize, width: tileSize, height: tileSize)
                let tileType = world.floorTiles[row][col]

                if world.wallTiles[row][col] { continue }

                switch tileType {
                case 1: // corridor
                    ctx.fill(Path(rect), with: .color(corridorColor))
                case 2: // room
                    ctx.fill(Path(rect), with: .color(floorColor))
                default:
                    ctx.fill(Path(rect), with: .color(floorColor))
                }

                // Subtle grid line
                let gridPath = Path { p in
                    p.move(to: CGPoint(x: rect.minX, y: rect.maxY))
                    p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
                    p.move(to: CGPoint(x: rect.maxX, y: rect.minY))
                    p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
                }
                ctx.stroke(gridPath, with: .color(gridLineColor), lineWidth: 0.5)
            }
        }

        // Corridor dashed center line
        let corridorCenterY = CGFloat(15.5) * tileSize
        let dashColor = Color(hex: 0xF59E0B).opacity(0.3)
        for x in stride(from: tileSize, to: CGFloat(world.cols - 1) * tileSize, by: 20) {
            let dashRect = CGRect(x: x, y: corridorCenterY - 1, width: 10, height: 2)
            ctx.fill(Path(dashRect), with: .color(dashColor))
        }
    }

    // MARK: - Walls

    private func renderWalls(_ ctx: inout GraphicsContext) {
        let wallColor = Color(hex: 0x6B7280)
        let wallHighlight = Color(hex: 0x9CA3AF)
        let wallShadow = Color(hex: 0x4B5563)

        for row in 0..<world.rows {
            for col in 0..<world.cols {
                guard world.wallTiles[row][col] else { continue }

                let rect = CGRect(x: CGFloat(col) * tileSize, y: CGFloat(row) * tileSize, width: tileSize, height: tileSize)

                // Main wall fill
                ctx.fill(Path(rect), with: .color(wallColor))

                // Top highlight
                let topHighlight = CGRect(x: rect.minX, y: rect.minY, width: tileSize, height: 2)
                ctx.fill(Path(topHighlight), with: .color(wallHighlight))

                // Bottom shadow
                let bottomShadow = CGRect(x: rect.minX, y: rect.maxY - 2, width: tileSize, height: 2)
                ctx.fill(Path(bottomShadow), with: .color(wallShadow))
            }
        }
    }

    // MARK: - Furniture

    private func renderFurniture(_ ctx: inout GraphicsContext) {
        for row in 0..<world.rows {
            for col in 0..<world.cols {
                guard let furn = world.furnitureTiles[row][col] else { continue }
                let x = CGFloat(col) * tileSize
                let y = CGFloat(row) * tileSize

                switch furn {
                case .desk:
                    drawDesk(ctx: &ctx, x: x, y: y)
                case .monitor:
                    drawMonitor(ctx: &ctx, x: x, y: y)
                case .chair:
                    drawChair(ctx: &ctx, x: x, y: y)
                case .bookshelf:
                    drawBookshelf(ctx: &ctx, x: x, y: y)
                case .serverRack:
                    drawServerRack(ctx: &ctx, x: x, y: y)
                case .sofa:
                    drawSofa(ctx: &ctx, x: x, y: y)
                case .coffeeMachine:
                    drawCoffeeMachine(ctx: &ctx, x: x, y: y)
                case .whiteboard:
                    drawWhiteboard(ctx: &ctx, x: x, y: y)
                case .plant:
                    drawPlant(ctx: &ctx, x: x, y: y)
                case .coffeeTable:
                    drawCoffeeTable(ctx: &ctx, x: x, y: y)
                case .workbench:
                    drawWorkbench(ctx: &ctx, x: x, y: y)
                case .lamp:
                    drawLamp(ctx: &ctx, x: x, y: y)
                default: break
                }
            }
        }
    }

    // MARK: - Individual Furniture Renderers

    private func drawDesk(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Desk surface
        let surface = CGRect(x: x + 2, y: y + 4, width: 28, height: 20)
        ctx.fill(Path(surface), with: .color(Color(hex: 0x8B6F4E)))
        // Desk top highlight
        let top = CGRect(x: x + 2, y: y + 4, width: 28, height: 3)
        ctx.fill(Path(top), with: .color(Color(hex: 0xA0845C)))
        // Legs
        let legColor = Color(hex: 0x5C4A32)
        ctx.fill(Path(CGRect(x: x + 3, y: y + 24, width: 2, height: 6)), with: .color(legColor))
        ctx.fill(Path(CGRect(x: x + 27, y: y + 24, width: 2, height: 6)), with: .color(legColor))
        // Keyboard shape
        let kbd = CGRect(x: x + 8, y: y + 10, width: 16, height: 6)
        ctx.fill(Path(kbd), with: .color(Color(hex: 0x3A3A3A)))
    }

    private func drawMonitor(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Screen
        let screen = CGRect(x: x + 4, y: y + 2, width: 24, height: 18)
        ctx.fill(Path(screen), with: .color(Color(hex: 0x1A1A2E)))
        // Screen border
        ctx.stroke(Path(screen), with: .color(Color(hex: 0x3A3A4E)), lineWidth: 1)
        // Code lines
        let green = Color(hex: 0x34D399)
        let dim = Color(hex: 0x34D399).opacity(0.4)
        let animated = (frameCount / 15) % 3
        ctx.fill(Path(CGRect(x: x + 6, y: y + 5, width: animated >= 0 ? 16 : 10, height: 2)), with: .color(green))
        ctx.fill(Path(CGRect(x: x + 8, y: y + 9, width: animated >= 1 ? 12 : 8, height: 2)), with: .color(dim))
        ctx.fill(Path(CGRect(x: x + 6, y: y + 13, width: animated >= 2 ? 14 : 6, height: 2)), with: .color(dim))
        // Stand
        ctx.fill(Path(CGRect(x: x + 13, y: y + 20, width: 6, height: 4)), with: .color(Color(hex: 0x4A4A5E)))
        ctx.fill(Path(CGRect(x: x + 10, y: y + 24, width: 12, height: 2)), with: .color(Color(hex: 0x4A4A5E)))
    }

    private func drawChair(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Seat
        let seat = CGRect(x: x + 8, y: y + 14, width: 16, height: 12)
        ctx.fill(Path(seat), with: .color(Color(hex: 0x3A3A4E)))
        // Back rest (subtle)
        let back = CGRect(x: x + 10, y: y + 6, width: 12, height: 10)
        ctx.fill(Path(back), with: .color(Color(hex: 0x2A2A3E)))
        // Wheels
        ctx.fill(Path(CGRect(x: x + 10, y: y + 26, width: 3, height: 3)), with: .color(Color(hex: 0x1A1A2E)))
        ctx.fill(Path(CGRect(x: x + 19, y: y + 26, width: 3, height: 3)), with: .color(Color(hex: 0x1A1A2E)))
    }

    private func drawBookshelf(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Frame
        ctx.fill(Path(CGRect(x: x + 2, y: y + 2, width: 28, height: 28)), with: .color(Color(hex: 0x5C4A32)))
        // Shelves
        let shelfColors: [Color] = [Color(hex: 0xEF4444), Color(hex: 0x3B82F6), Color(hex: 0x10B981), Color(hex: 0xF59E0B)]
        for (i, color) in shelfColors.enumerated() {
            let bookY = y + 4 + CGFloat(i) * 7
            ctx.fill(Path(CGRect(x: x + 4, y: bookY, width: 5, height: 5)), with: .color(color))
            ctx.fill(Path(CGRect(x: x + 11, y: bookY, width: 4, height: 5)), with: .color(color.opacity(0.7)))
            ctx.fill(Path(CGRect(x: x + 17, y: bookY, width: 6, height: 5)), with: .color(color.opacity(0.5)))
        }
    }

    private func drawServerRack(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Rack body
        ctx.fill(Path(CGRect(x: x + 4, y: y + 2, width: 24, height: 28)), with: .color(Color(hex: 0x1F2937)))
        ctx.stroke(Path(CGRect(x: x + 4, y: y + 2, width: 24, height: 28)), with: .color(Color(hex: 0x374151)), lineWidth: 1)
        // LED dots (animated)
        let ledOn = (frameCount / 10) % 3
        let colors: [Color] = [Color(hex: 0x10B981), Color(hex: 0x3B82F6), Color(hex: 0xF59E0B)]
        for i in 0..<3 {
            let dotY = y + 6 + CGFloat(i) * 8
            let color = i == ledOn ? colors[i] : colors[i].opacity(0.3)
            ctx.fill(Path(CGRect(x: x + 7, y: dotY, width: 3, height: 3)), with: .color(color))
            ctx.fill(Path(CGRect(x: x + 22, y: dotY, width: 3, height: 3)), with: .color(color))
            // Horizontal lines (ventilation)
            ctx.fill(Path(CGRect(x: x + 12, y: dotY + 1, width: 8, height: 1)), with: .color(Color(hex: 0x374151)))
        }
    }

    private func drawSofa(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Sofa cushion
        ctx.fill(Path(CGRect(x: x + 2, y: y + 8, width: 28, height: 16)), with: .color(Color(hex: 0x4B5563)))
        // Back
        ctx.fill(Path(CGRect(x: x + 2, y: y + 2, width: 28, height: 10)), with: .color(Color(hex: 0x374151)))
        // Armrests
        ctx.fill(Path(CGRect(x: x, y: y + 4, width: 4, height: 18)), with: .color(Color(hex: 0x374151)))
        ctx.fill(Path(CGRect(x: x + 28, y: y + 4, width: 4, height: 18)), with: .color(Color(hex: 0x374151)))
    }

    private func drawCoffeeMachine(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Body
        ctx.fill(Path(CGRect(x: x + 6, y: y + 8, width: 20, height: 20)), with: .color(Color(hex: 0x4A4A5E)))
        // Top
        ctx.fill(Path(CGRect(x: x + 8, y: y + 4, width: 16, height: 6)), with: .color(Color(hex: 0x3A3A4E)))
        // Cup
        ctx.fill(Path(CGRect(x: x + 12, y: y + 22, width: 8, height: 6)), with: .color(.white.opacity(0.8)))
        // Steam (animated)
        let steamFrame = (frameCount / 8) % 3
        let steamY = y + CGFloat(2 - steamFrame)
        ctx.fill(Path(CGRect(x: x + 14, y: steamY, width: 2, height: 3)), with: .color(.white.opacity(0.3)))
        ctx.fill(Path(CGRect(x: x + 18, y: steamY - 1, width: 2, height: 3)), with: .color(.white.opacity(0.2)))
    }

    private func drawWhiteboard(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Board
        ctx.fill(Path(CGRect(x: x + 2, y: y + 4, width: 28, height: 22)), with: .color(.white.opacity(0.9)))
        ctx.stroke(Path(CGRect(x: x + 2, y: y + 4, width: 28, height: 22)), with: .color(Color(hex: 0x9CA3AF)), lineWidth: 1)
        // Scribbles
        let scribbleColor = Color(hex: 0x3B82F6).opacity(0.6)
        ctx.fill(Path(CGRect(x: x + 5, y: y + 8, width: 14, height: 2)), with: .color(scribbleColor))
        ctx.fill(Path(CGRect(x: x + 5, y: y + 12, width: 18, height: 2)), with: .color(Color(hex: 0xEF4444).opacity(0.5)))
        ctx.fill(Path(CGRect(x: x + 5, y: y + 16, width: 10, height: 2)), with: .color(Color(hex: 0x10B981).opacity(0.5)))
    }

    private func drawPlant(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Pot
        ctx.fill(Path(CGRect(x: x + 10, y: y + 18, width: 12, height: 12)), with: .color(Color(hex: 0x8B6F4E)))
        // Leaves
        let leafColor = Color(hex: 0x10B981)
        let darkLeaf = Color(hex: 0x059669)
        ctx.fill(Path(CGRect(x: x + 12, y: y + 6, width: 8, height: 14)), with: .color(leafColor))
        ctx.fill(Path(CGRect(x: x + 8, y: y + 10, width: 6, height: 8)), with: .color(darkLeaf))
        ctx.fill(Path(CGRect(x: x + 18, y: y + 8, width: 6, height: 10)), with: .color(darkLeaf))
    }

    private func drawCoffeeTable(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Table surface
        ctx.fill(Path(CGRect(x: x + 4, y: y + 10, width: 24, height: 12)), with: .color(Color(hex: 0x6B5A32)))
        // Legs
        let legColor = Color(hex: 0x4A3A22)
        ctx.fill(Path(CGRect(x: x + 5, y: y + 22, width: 2, height: 6)), with: .color(legColor))
        ctx.fill(Path(CGRect(x: x + 25, y: y + 22, width: 2, height: 6)), with: .color(legColor))
    }

    private func drawWorkbench(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Surface (metal)
        ctx.fill(Path(CGRect(x: x + 2, y: y + 6, width: 28, height: 18)), with: .color(Color(hex: 0x4B5563)))
        ctx.fill(Path(CGRect(x: x + 2, y: y + 6, width: 28, height: 3)), with: .color(Color(hex: 0x6B7280)))
        // Legs
        ctx.fill(Path(CGRect(x: x + 4, y: y + 24, width: 2, height: 6)), with: .color(Color(hex: 0x374151)))
        ctx.fill(Path(CGRect(x: x + 26, y: y + 24, width: 2, height: 6)), with: .color(Color(hex: 0x374151)))
        // Tools on surface
        ctx.fill(Path(CGRect(x: x + 6, y: y + 10, width: 8, height: 4)), with: .color(Color(hex: 0x9CA3AF)))
    }

    private func drawLamp(ctx: inout GraphicsContext, x: CGFloat, y: CGFloat) {
        // Stand
        ctx.fill(Path(CGRect(x: x + 14, y: y + 10, width: 4, height: 18)), with: .color(Color(hex: 0x4A4A5E)))
        // Base
        ctx.fill(Path(CGRect(x: x + 10, y: y + 26, width: 12, height: 4)), with: .color(Color(hex: 0x4A4A5E)))
        // Shade
        ctx.fill(Path(CGRect(x: x + 8, y: y + 4, width: 16, height: 8)), with: .color(Color(hex: 0xFBBF24)))
        // Glow
        let glow = (frameCount / 20) % 2 == 0
        if glow {
            ctx.fill(Path(CGRect(x: x + 6, y: y + 2, width: 20, height: 12)), with: .color(Color(hex: 0xFBBF24).opacity(0.15)))
        }
    }

    // MARK: - LED Strips

    private func renderLEDStrips(_ ctx: inout GraphicsContext) {
        for room in world.rooms {
            let x0 = CGFloat(room.gridX) * tileSize
            let y0 = CGFloat(room.gridY) * tileSize
            let w = CGFloat(room.width) * tileSize
            let h = CGFloat(room.height) * tileSize

            let ledAlpha = 0.3 + 0.1 * sin(Double(frameCount) * 0.05)
            let color = room.ledColor.opacity(ledAlpha)

            // Top LED strip
            ctx.fill(Path(CGRect(x: x0 + 2, y: y0 + 2, width: w - 4, height: 2)), with: .color(color))
            // Bottom LED strip
            ctx.fill(Path(CGRect(x: x0 + 2, y: y0 + h - 4, width: w - 4, height: 2)), with: .color(color))
        }
    }

    // MARK: - Room Labels

    private func renderRoomLabels(_ ctx: inout GraphicsContext) {
        for room in world.rooms {
            let centerX = CGFloat(room.gridX) * tileSize + CGFloat(room.width) * tileSize / 2
            // Place label INSIDE the room (2 tiles from top/bottom wall, not on the wall)
            let labelY: CGFloat
            if room.doorSide == .down {
                labelY = CGFloat(room.gridY) * tileSize + 2 * tileSize + 8
            } else {
                labelY = CGFloat(room.gridY + room.height) * tileSize - 2 * tileSize - 8
            }

            // Room label with high-contrast background plate
            let labelWidth = max(CGFloat(room.name.count) * 8 + 20, 70)
            let plateBg = CGRect(x: centerX - labelWidth / 2, y: labelY - 10, width: labelWidth, height: 20)
            let platePath = RoundedRectangle(cornerRadius: 4).path(in: plateBg)
            ctx.fill(platePath, with: .color(Color(hex: 0x1A1A2E).opacity(0.85)))
            ctx.stroke(platePath, with: .color(room.ledColor.opacity(0.7)), lineWidth: 1.5)
            // Accent line under label
            let accentLine = CGRect(x: centerX - labelWidth / 2 + 4, y: labelY + 7, width: labelWidth - 8, height: 2)
            ctx.fill(Path(accentLine), with: .color(room.ledColor.opacity(0.6)))

            let text = Text(room.name)
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
            ctx.draw(text, at: CGPoint(x: centerX, y: labelY), anchor: .center)
        }
    }

    // MARK: - Characters (sorted by Y for proper overlap)

    private func renderCharactersSorted(_ ctx: inout GraphicsContext) {
        let sorted = world.characters.sorted { $0.pixelY < $1.pixelY }

        for character in sorted {
            renderCharacter(&ctx, character: character)
        }
    }

    private func renderCharacter(_ ctx: inout GraphicsContext, character: AgentCharacter) {
        let x = character.pixelX
        let y = character.pixelY

        // Shadow
        let shadowRect = CGRect(x: x + 4, y: y + 28, width: 24, height: 6)
        let shadowPath = Path(ellipseIn: shadowRect)
        ctx.fill(shadowPath, with: .color(.black.opacity(0.3)))

        // Get sprite
        let frame: Int
        let dir: Direction
        switch character.state {
        case .idle:
            frame = (frameCount / 15) % 2
            dir = character.direction
        case .walking:
            frame = character.walkFrame % 4
            dir = character.direction
        case .sittingAtDesk, .working:
            frame = (frameCount / 20) % 2
            dir = .up
        }

        if let sprite = spriteSheet.getSprite(
            agentType: character.agentType,
            state: character.state,
            frame: frame,
            direction: dir
        ) {
            // Draw sprite at 2x scale (16x24 -> 32x48, or 16x16 -> 32x32 for sitting)
            let isSitting = character.state == .sittingAtDesk || character.state == .working
            let drawH: CGFloat = isSitting ? 32 : 48
            let drawY = isSitting ? y - 4 : y - 16

            let image = Image(decorative: sprite, scale: 1.0)
            let drawRect = CGRect(x: x, y: drawY, width: 32, height: drawH)
            ctx.draw(image, in: drawRect)
        }

        // --- Name tag (centered above character) ---
        let nameStr = String(character.id.prefix(12))
        let centerX = x + 16
        let nameY = y - 18

        // Background pill for name
        let nameWidth = max(CGFloat(nameStr.count) * 6.5 + 12, 44)
        let nameBg = CGRect(x: centerX - nameWidth / 2, y: nameY - 7, width: nameWidth, height: 14)
        let nameBgPath = RoundedRectangle(cornerRadius: 4).path(in: nameBg)
        ctx.fill(nameBgPath, with: .color(.black.opacity(0.8)))
        // Accent border on name pill
        let nameBorderPath = RoundedRectangle(cornerRadius: 4).path(in: nameBg)
        ctx.stroke(nameBorderPath, with: .color(agentAccentColor(character.agentType).opacity(0.5)), lineWidth: 0.5)

        let nameText = Text(nameStr)
            .font(.system(size: 8, weight: .bold, design: .monospaced))
            .foregroundColor(.white)
        ctx.draw(nameText, at: CGPoint(x: centerX, y: nameY), anchor: .center)

        // --- Level badge (above name, with colored bg) ---
        let lvlStr = "Lv.\(character.level)"
        let lvlY = nameY - 13
        let lvlWidth: CGFloat = 28
        let lvlBg = CGRect(x: centerX - lvlWidth / 2, y: lvlY - 5.5, width: lvlWidth, height: 11)
        let lvlBgPath = RoundedRectangle(cornerRadius: 3).path(in: lvlBg)
        ctx.fill(lvlBgPath, with: .color(levelColor(character.level).opacity(0.2)))
        ctx.stroke(lvlBgPath, with: .color(levelColor(character.level).opacity(0.6)), lineWidth: 0.5)

        let levelText = Text(lvlStr)
            .font(.system(size: 6.5, weight: .bold, design: .monospaced))
            .foregroundColor(levelColor(character.level))
        ctx.draw(levelText, at: CGPoint(x: centerX, y: lvlY), anchor: .center)

        // --- Tool description label (below character) ---
        if !character.toolDescription.isEmpty && character.toolDescription != "idle" {
            let descStr = character.toolDescription
            let descY = y + 36
            let descWidth = max(CGFloat(descStr.count) * 5.5 + 12, 50)
            let descBg = CGRect(x: centerX - descWidth / 2, y: descY - 6, width: descWidth, height: 12)
            let descBgPath = RoundedRectangle(cornerRadius: 3).path(in: descBg)
            ctx.fill(descBgPath, with: .color(.black.opacity(0.6)))

            let descText = Text(descStr)
                .font(.system(size: 6.5, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.8))
            ctx.draw(descText, at: CGPoint(x: centerX, y: descY), anchor: .center)
        }

        // --- Emote bubble (top-right, floating with bob) ---
        if let emote = character.emote {
            let bobOffset = sin(Double(frameCount) * 0.12) * 2.5
            let emoteX = centerX + 18
            let emoteY = y - 36 + bobOffset
            // White bubble with shadow
            let bubbleRect = CGRect(x: emoteX - 10, y: emoteY - 10, width: 20, height: 20)
            let shadowRect2 = bubbleRect.offsetBy(dx: 1, dy: 1)
            ctx.fill(Path(ellipseIn: shadowRect2), with: .color(.black.opacity(0.15)))
            ctx.fill(Path(ellipseIn: bubbleRect), with: .color(.white.opacity(0.95)))
            ctx.stroke(Path(ellipseIn: bubbleRect), with: .color(.gray.opacity(0.3)), lineWidth: 0.5)
            let emoteText = Text(emote).font(.system(size: 11))
            ctx.draw(emoteText, at: CGPoint(x: emoteX, y: emoteY), anchor: .center)
        }
    }

    private func levelColor(_ level: Int) -> Color {
        switch level {
        case 1: return Color(hex: 0x6B7280)
        case 2: return Color(hex: 0x10B981)
        case 3: return Color(hex: 0x3B82F6)
        case 4: return Color(hex: 0x8B5CF6)
        case 5: return Color(hex: 0xF97316)
        case 6: return Color(hex: 0xF59E0B)
        default: return Color(hex: 0xFFD700)
        }
    }

    private func agentAccentColor(_ agentType: String?) -> Color {
        switch agentType {
        case "csharp-developer": return Color(hex: 0xA78BFA)
        case "js-developer": return Color(hex: 0xFCD34D)
        case "sql-server-expert": return Color(hex: 0x60A5FA)
        case "tester-qa": return Color(hex: 0x6EE7B7)
        case "tech-lead-gestor": return Color(hex: 0xFFD700)
        case "security-expert": return Color(hex: 0xF87171)
        case "devops": return Color(hex: 0x67E8F9)
        case "meta-orchestrator": return Color(hex: 0xFDE68A)
        default: return Color(hex: 0x22D3EE)
        }
    }
}
