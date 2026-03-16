import AppKit
import CoreGraphics

// MARK: - Robot Palette

struct RobotPalette {
    let body: NSColor
    let bodyDark: NSColor
    let bodyLight: NSColor
    let visor: NSColor
    let visorDim: NSColor
    let led: NSColor
    let limb: NSColor
    let limbDark: NSColor
    let outline: NSColor
    let accent: NSColor

    static let palettes: [String: RobotPalette] = [
        "csharp-developer": RobotPalette(
            body: NSColor(r: 0x4A, g: 0x4A, b: 0x5E), bodyDark: NSColor(r: 0x2A, g: 0x2A, b: 0x3E), bodyLight: NSColor(r: 0x5A, g: 0x5A, b: 0x6E),
            visor: NSColor(r: 0xC0, g: 0x84, b: 0xFC), visorDim: NSColor(r: 0x7C, g: 0x3A, b: 0xED),
            led: NSColor(r: 0xA8, g: 0x55, b: 0xF7), limb: NSColor(r: 0x4A, g: 0x4A, b: 0x5E), limbDark: NSColor(r: 0x3A, g: 0x3A, b: 0x4E),
            outline: NSColor(r: 0x2E, g: 0x10, b: 0x65), accent: NSColor(r: 0xC0, g: 0x84, b: 0xFC)),
        "js-developer": RobotPalette(
            body: NSColor(r: 0x4A, g: 0x4A, b: 0x4E), bodyDark: NSColor(r: 0x2A, g: 0x2A, b: 0x2E), bodyLight: NSColor(r: 0x5A, g: 0x5A, b: 0x5E),
            visor: NSColor(r: 0xFC, g: 0xD3, b: 0x4D), visorDim: NSColor(r: 0xCA, g: 0x8A, b: 0x04),
            led: NSColor(r: 0xFB, g: 0xBF, b: 0x24), limb: NSColor(r: 0x4A, g: 0x4A, b: 0x4E), limbDark: NSColor(r: 0x3A, g: 0x3A, b: 0x3E),
            outline: NSColor(r: 0x71, g: 0x3F, b: 0x12), accent: NSColor(r: 0xFC, g: 0xD3, b: 0x4D)),
        "sql-server-expert": RobotPalette(
            body: NSColor(r: 0x3A, g: 0x4A, b: 0x5E), bodyDark: NSColor(r: 0x1A, g: 0x2A, b: 0x3E), bodyLight: NSColor(r: 0x5A, g: 0x5A, b: 0x6E),
            visor: NSColor(r: 0x60, g: 0xA5, b: 0xFA), visorDim: NSColor(r: 0x25, g: 0x63, b: 0xEB),
            led: NSColor(r: 0x3B, g: 0x82, b: 0xF6), limb: NSColor(r: 0x3A, g: 0x4A, b: 0x5E), limbDark: NSColor(r: 0x2A, g: 0x3A, b: 0x4E),
            outline: NSColor(r: 0x1E, g: 0x3A, b: 0x5F), accent: NSColor(r: 0x60, g: 0xA5, b: 0xFA)),
        "tester-qa": RobotPalette(
            body: NSColor(r: 0x3A, g: 0x4A, b: 0x3E), bodyDark: NSColor(r: 0x1A, g: 0x2A, b: 0x1E), bodyLight: NSColor(r: 0x5A, g: 0x6A, b: 0x5E),
            visor: NSColor(r: 0x6E, g: 0xE7, b: 0xB7), visorDim: NSColor(r: 0x05, g: 0x96, b: 0x69),
            led: NSColor(r: 0x10, g: 0xB9, b: 0x81), limb: NSColor(r: 0x3A, g: 0x4A, b: 0x3E), limbDark: NSColor(r: 0x2A, g: 0x3A, b: 0x2E),
            outline: NSColor(r: 0x06, g: 0x4E, b: 0x3B), accent: NSColor(r: 0x6E, g: 0xE7, b: 0xB7)),
        "tech-lead-gestor": RobotPalette(
            body: NSColor(r: 0x4A, g: 0x4A, b: 0x3E), bodyDark: NSColor(r: 0x2A, g: 0x2A, b: 0x1E), bodyLight: NSColor(r: 0x5A, g: 0x5A, b: 0x4E),
            visor: NSColor(r: 0xFF, g: 0xD7, b: 0x00), visorDim: NSColor(r: 0xB4, g: 0x53, b: 0x09),
            led: NSColor(r: 0xF5, g: 0x9E, b: 0x0B), limb: NSColor(r: 0x4A, g: 0x4A, b: 0x3E), limbDark: NSColor(r: 0x3A, g: 0x3A, b: 0x2E),
            outline: NSColor(r: 0x78, g: 0x35, b: 0x0F), accent: NSColor(r: 0xFF, g: 0xD7, b: 0x00)),
        "security-expert": RobotPalette(
            body: NSColor(r: 0x4E, g: 0x3A, b: 0x3A), bodyDark: NSColor(r: 0x2E, g: 0x1A, b: 0x1A), bodyLight: NSColor(r: 0x5E, g: 0x5A, b: 0x5A),
            visor: NSColor(r: 0xF8, g: 0x71, b: 0x71), visorDim: NSColor(r: 0xDC, g: 0x26, b: 0x26),
            led: NSColor(r: 0xEF, g: 0x44, b: 0x44), limb: NSColor(r: 0x4E, g: 0x3A, b: 0x3A), limbDark: NSColor(r: 0x3E, g: 0x2A, b: 0x2A),
            outline: NSColor(r: 0x7F, g: 0x1D, b: 0x1D), accent: NSColor(r: 0xF8, g: 0x71, b: 0x71)),
        "devops": RobotPalette(
            body: NSColor(r: 0x3A, g: 0x4A, b: 0x4E), bodyDark: NSColor(r: 0x1A, g: 0x2A, b: 0x2E), bodyLight: NSColor(r: 0x5A, g: 0x6A, b: 0x6E),
            visor: NSColor(r: 0x67, g: 0xE8, b: 0xF9), visorDim: NSColor(r: 0x08, g: 0x91, b: 0xB2),
            led: NSColor(r: 0x06, g: 0xB6, b: 0xD4), limb: NSColor(r: 0x3A, g: 0x4A, b: 0x4E), limbDark: NSColor(r: 0x2A, g: 0x3A, b: 0x3E),
            outline: NSColor(r: 0x16, g: 0x4E, b: 0x63), accent: NSColor(r: 0x67, g: 0xE8, b: 0xF9)),
        "qa-reviewer": RobotPalette(
            body: NSColor(r: 0x4A, g: 0x3E, b: 0x5E), bodyDark: NSColor(r: 0x2A, g: 0x1E, b: 0x3E), bodyLight: NSColor(r: 0x5A, g: 0x4E, b: 0x6E),
            visor: NSColor(r: 0xA5, g: 0xB4, b: 0xFC), visorDim: NSColor(r: 0x63, g: 0x66, b: 0xF1),
            led: NSColor(r: 0x63, g: 0x66, b: 0xF1), limb: NSColor(r: 0x4A, g: 0x3E, b: 0x5E), limbDark: NSColor(r: 0x3A, g: 0x2E, b: 0x4E),
            outline: NSColor(r: 0x31, g: 0x20, b: 0x71), accent: NSColor(r: 0xA5, g: 0xB4, b: 0xFC)),
    ]

    static let defaultPalette = RobotPalette(
        body: NSColor(r: 0x4A, g: 0x4A, b: 0x4A), bodyDark: NSColor(r: 0x2A, g: 0x2A, b: 0x2A), bodyLight: NSColor(r: 0x5A, g: 0x5A, b: 0x5A),
        visor: NSColor(r: 0x9C, g: 0xA3, b: 0xAF), visorDim: NSColor(r: 0x6B, g: 0x72, b: 0x80),
        led: NSColor(r: 0x9C, g: 0xA3, b: 0xAF), limb: NSColor(r: 0x4A, g: 0x4A, b: 0x4A), limbDark: NSColor(r: 0x3A, g: 0x3A, b: 0x3A),
        outline: NSColor(r: 0x1F, g: 0x1F, b: 0x1F), accent: NSColor(r: 0x9C, g: 0xA3, b: 0xAF))

    static func paletteFor(_ agentType: String?) -> RobotPalette {
        guard let type = agentType else { return defaultPalette }
        return palettes[type] ?? defaultPalette
    }
}

// MARK: - Sprite Sheet

class SpriteSheet {
    private var cache: [String: CGImage] = [:]

    // Sprite dimensions in pixels (drawn at 2x = 32x48 points on Canvas)
    static let spriteW = 16
    static let spriteH = 24
    static let sittingH = 16

    func getSprite(agentType: String?, state: CharacterState, frame: Int, direction: Direction) -> CGImage? {
        let typeName = agentType ?? "default"
        let key = "\(typeName)_\(state)_\(frame)_\(direction)"
        return cache[key]
    }

    func prerender() {
        let allTypes: [String?] = [nil] + Array(RobotPalette.palettes.keys)

        for agentType in allTypes {
            let palette = RobotPalette.paletteFor(agentType)
            let typeName = agentType ?? "default"

            // Idle frames (2 frames, breathing)
            for frame in 0..<2 {
                for dir in [Direction.down, .up, .left, .right] {
                    let key = "\(typeName)_idle_\(frame)_\(dir)"
                    cache[key] = renderRobot(palette: palette, state: .idle, frame: frame, direction: dir)
                }
            }

            // Walking frames (4 frames)
            for frame in 0..<4 {
                for dir in [Direction.down, .up, .left, .right] {
                    let key = "\(typeName)_walking_\(frame)_\(dir)"
                    cache[key] = renderRobot(palette: palette, state: .walking, frame: frame, direction: dir)
                }
            }

            // Sitting frames (2 frames, facing up)
            for frame in 0..<2 {
                let key = "\(typeName)_sittingAtDesk_\(frame)_\(Direction.up)"
                cache[key] = renderSitting(palette: palette, frame: frame)
            }

            // Working frames (2 frames - typing animation)
            for frame in 0..<2 {
                let key = "\(typeName)_working_\(frame)_\(Direction.up)"
                cache[key] = renderSitting(palette: palette, frame: frame, typing: true)
            }
        }
    }

    // MARK: - Render Robot (16x24)

    private func renderRobot(palette: RobotPalette, state: CharacterState, frame: Int, direction: Direction) -> CGImage? {
        let w = Self.spriteW
        let h = Self.spriteH

        guard let ctx = CGContext(
            data: nil, width: w, height: h,
            bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }

        // Flip coordinate system: pixel (0,0) is top-left
        ctx.translateBy(x: 0, y: CGFloat(h))
        ctx.scaleBy(x: 1, y: -1)

        let breathOffset = (state == .idle && frame == 1) ? 1 : 0

        switch direction {
        case .down:
            drawRobotFront(ctx: ctx, palette: palette, frame: frame, state: state, breathOffset: breathOffset)
        case .up:
            drawRobotBack(ctx: ctx, palette: palette, frame: frame, state: state, breathOffset: breathOffset)
        case .left:
            drawRobotSide(ctx: ctx, palette: palette, frame: frame, state: state, breathOffset: breathOffset, flipX: false)
        case .right:
            drawRobotSide(ctx: ctx, palette: palette, frame: frame, state: state, breathOffset: breathOffset, flipX: true)
        }

        return ctx.makeImage()
    }

    private func drawRobotFront(ctx: CGContext, palette: RobotPalette, frame: Int, state: CharacterState, breathOffset: Int) {
        let px = { (x: Int, y: Int, c: NSColor) in
            ctx.setFillColor(c.cgColor)
            ctx.fill(CGRect(x: x, y: y, width: 1, height: 1))
        }

        // Head/Helmet (rows 0-8)
        // Outline top
        for x in 5...10 { px(x, 0 + breathOffset, palette.outline) }
        px(4, 1 + breathOffset, palette.outline); px(11, 1 + breathOffset, palette.outline)
        // Helmet fill
        for y in 1...3 {
            for x in 5...10 { px(x, y + breathOffset, palette.bodyLight) }
        }
        px(4, 2 + breathOffset, palette.body); px(11, 2 + breathOffset, palette.body)
        px(4, 3 + breathOffset, palette.body); px(11, 3 + breathOffset, palette.body)

        // Visor (row 4-5)
        for x in 5...10 { px(x, 4 + breathOffset, palette.visor) }
        for x in 5...10 { px(x, 5 + breathOffset, palette.visorDim) }
        px(4, 4 + breathOffset, palette.outline); px(11, 4 + breathOffset, palette.outline)
        px(4, 5 + breathOffset, palette.outline); px(11, 5 + breathOffset, palette.outline)

        // Chin
        for x in 5...10 { px(x, 6 + breathOffset, palette.body) }
        px(4, 6 + breathOffset, palette.outline); px(11, 6 + breathOffset, palette.outline)
        for x in 5...10 { px(x, 7 + breathOffset, palette.outline) }

        // Antenna
        px(7, 0 + breathOffset, palette.accent); px(8, 0 + breathOffset, palette.accent)

        // Body (rows 8-16)
        for y in 8...15 {
            px(4, y, palette.outline)
            px(11, y, palette.outline)
            for x in 5...10 {
                px(x, y, y < 12 ? palette.body : palette.bodyDark)
            }
        }
        // LED panel on chest (row 10-11)
        px(6, 10, palette.led); px(7, 10, palette.led); px(8, 10, palette.led); px(9, 10, palette.led)
        px(6, 11, palette.led); px(9, 11, palette.led)

        // Arms
        let armY = state == .walking ? (frame % 2 == 0 ? 9 : 10) : 9
        for y in armY...(armY + 5) {
            px(3, y, palette.limb)
            px(12, y, palette.limb)
        }
        px(3, armY + 5, palette.accent)
        px(12, armY + 5, palette.accent)

        // Legs (rows 16-22)
        let legOffset = state == .walking ? (frame % 4) : 0
        let leftLegX = 5 + (legOffset == 1 ? 1 : legOffset == 3 ? -1 : 0)
        let rightLegX = 9 + (legOffset == 1 ? -1 : legOffset == 3 ? 1 : 0)

        for y in 16...22 {
            px(leftLegX, y, palette.limb)
            px(leftLegX + 1, y, palette.limb)
            px(rightLegX, y, palette.limb)
            px(rightLegX + 1, y, palette.limb)
        }
        // Feet
        px(leftLegX - 1, 23, palette.limbDark); px(leftLegX, 23, palette.limbDark); px(leftLegX + 1, 23, palette.limbDark)
        px(rightLegX, 23, palette.limbDark); px(rightLegX + 1, 23, palette.limbDark); px(rightLegX + 2, 23, palette.limbDark)

        // Body bottom outline
        for x in 5...10 { px(x, 16, palette.outline) }
    }

    private func drawRobotBack(ctx: CGContext, palette: RobotPalette, frame: Int, state: CharacterState, breathOffset: Int) {
        let px = { (x: Int, y: Int, c: NSColor) in
            ctx.setFillColor(c.cgColor)
            ctx.fill(CGRect(x: x, y: y, width: 1, height: 1))
        }

        // Head (same shape, no visor)
        for x in 5...10 { px(x, 0 + breathOffset, palette.outline) }
        px(4, 1 + breathOffset, palette.outline); px(11, 1 + breathOffset, palette.outline)
        for y in 1...6 {
            for x in 5...10 { px(x, y + breathOffset, palette.bodyDark) }
        }
        px(4, 2 + breathOffset, palette.bodyDark); px(11, 2 + breathOffset, palette.bodyDark)
        px(4, 3 + breathOffset, palette.bodyDark); px(11, 3 + breathOffset, palette.bodyDark)
        px(4, 4 + breathOffset, palette.outline); px(11, 4 + breathOffset, palette.outline)
        px(4, 5 + breathOffset, palette.outline); px(11, 5 + breathOffset, palette.outline)
        px(4, 6 + breathOffset, palette.outline); px(11, 6 + breathOffset, palette.outline)
        for x in 5...10 { px(x, 7 + breathOffset, palette.outline) }
        // Antenna
        px(7, 0 + breathOffset, palette.accent); px(8, 0 + breathOffset, palette.accent)

        // Body
        for y in 8...15 {
            px(4, y, palette.outline); px(11, y, palette.outline)
            for x in 5...10 { px(x, y, palette.bodyDark) }
        }
        // Backpack detail
        px(6, 10, palette.body); px(7, 10, palette.body); px(8, 10, palette.body); px(9, 10, palette.body)
        px(6, 11, palette.body); px(7, 11, palette.body); px(8, 11, palette.body); px(9, 11, palette.body)

        // Arms
        let armY = state == .walking ? (frame % 2 == 0 ? 9 : 10) : 9
        for y in armY...(armY + 5) {
            px(3, y, palette.limbDark); px(12, y, palette.limbDark)
        }

        // Legs
        let legOffset = state == .walking ? (frame % 4) : 0
        let leftLegX = 5 + (legOffset == 1 ? 1 : legOffset == 3 ? -1 : 0)
        let rightLegX = 9 + (legOffset == 1 ? -1 : legOffset == 3 ? 1 : 0)
        for y in 16...22 {
            px(leftLegX, y, palette.limbDark); px(leftLegX + 1, y, palette.limbDark)
            px(rightLegX, y, palette.limbDark); px(rightLegX + 1, y, palette.limbDark)
        }
        px(leftLegX - 1, 23, palette.limbDark); px(leftLegX, 23, palette.limbDark); px(leftLegX + 1, 23, palette.limbDark)
        px(rightLegX, 23, palette.limbDark); px(rightLegX + 1, 23, palette.limbDark); px(rightLegX + 2, 23, palette.limbDark)
        for x in 5...10 { px(x, 16, palette.outline) }
    }

    private func drawRobotSide(ctx: CGContext, palette: RobotPalette, frame: Int, state: CharacterState, breathOffset: Int, flipX: Bool) {
        let w = Self.spriteW
        let px = { (x: Int, y: Int, c: NSColor) in
            let finalX = flipX ? (w - 1 - x) : x
            ctx.setFillColor(c.cgColor)
            ctx.fill(CGRect(x: finalX, y: y, width: 1, height: 1))
        }

        // Head
        for x in 5...10 { px(x, 0 + breathOffset, palette.outline) }
        px(4, 1 + breathOffset, palette.outline); px(11, 1 + breathOffset, palette.outline)
        for y in 1...3 {
            for x in 5...10 { px(x, y + breathOffset, palette.body) }
        }
        px(4, 2 + breathOffset, palette.outline); px(11, 2 + breathOffset, palette.outline)
        // Side visor (only half visible)
        for x in 8...10 { px(x, 4 + breathOffset, palette.visor) }
        for x in 5...7 { px(x, 4 + breathOffset, palette.body) }
        for x in 8...10 { px(x, 5 + breathOffset, palette.visorDim) }
        for x in 5...7 { px(x, 5 + breathOffset, palette.body) }
        px(4, 4 + breathOffset, palette.outline); px(11, 4 + breathOffset, palette.outline)
        px(4, 5 + breathOffset, palette.outline); px(11, 5 + breathOffset, palette.outline)
        for x in 5...10 { px(x, 6 + breathOffset, palette.body) }
        px(4, 6 + breathOffset, palette.outline); px(11, 6 + breathOffset, palette.outline)
        for x in 5...10 { px(x, 7 + breathOffset, palette.outline) }
        px(7, 0 + breathOffset, palette.accent); px(8, 0 + breathOffset, palette.accent)

        // Body
        for y in 8...15 {
            px(4, y, palette.outline); px(11, y, palette.outline)
            for x in 5...10 { px(x, y, y < 12 ? palette.body : palette.bodyDark) }
        }
        // Side LED
        px(9, 10, palette.led); px(10, 10, palette.led)
        px(9, 11, palette.led); px(10, 11, palette.led)

        // Arm (one visible on side)
        let armY = state == .walking ? (frame % 2 == 0 ? 8 : 10) : 9
        for y in armY...(armY + 5) { px(12, y, palette.limb) }
        px(12, armY + 5, palette.accent)

        // Legs
        let legOffset = state == .walking ? (frame % 4) : 0
        let frontLeg = 7 + (legOffset == 1 ? 1 : legOffset == 3 ? -1 : 0)
        let backLeg = 7 + (legOffset == 1 ? -1 : legOffset == 3 ? 1 : 0)
        for y in 16...22 {
            px(frontLeg, y, palette.limb); px(frontLeg + 1, y, palette.limb)
            px(backLeg - 1, y, palette.limbDark)
        }
        px(frontLeg - 1, 23, palette.limbDark); px(frontLeg, 23, palette.limbDark); px(frontLeg + 1, 23, palette.limbDark)
        px(backLeg - 2, 23, palette.limbDark); px(backLeg - 1, 23, palette.limbDark)
        for x in 5...10 { px(x, 16, palette.outline) }
    }

    // MARK: - Render Sitting (16x16 - shorter, facing away)

    private func renderSitting(palette: RobotPalette, frame: Int, typing: Bool = false) -> CGImage? {
        let w = Self.spriteW
        let h = Self.sittingH

        guard let ctx = CGContext(
            data: nil, width: w, height: h,
            bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }

        ctx.translateBy(x: 0, y: CGFloat(h))
        ctx.scaleBy(x: 1, y: -1)

        let px = { (x: Int, y: Int, c: NSColor) in
            ctx.setFillColor(c.cgColor)
            ctx.fill(CGRect(x: x, y: y, width: 1, height: 1))
        }

        // Head (back view, rows 0-7)
        for x in 5...10 { px(x, 0, palette.outline) }
        px(4, 1, palette.outline); px(11, 1, palette.outline)
        for y in 1...5 {
            for x in 5...10 { px(x, y, palette.bodyDark) }
        }
        px(4, 2, palette.outline); px(11, 2, palette.outline)
        px(4, 3, palette.outline); px(11, 3, palette.outline)
        px(4, 4, palette.outline); px(11, 4, palette.outline)
        px(4, 5, palette.outline); px(11, 5, palette.outline)
        for x in 5...10 { px(x, 6, palette.outline) }
        // Antenna
        px(7, 0, palette.accent); px(8, 0, palette.accent)

        // Seated body (rows 7-12, shorter)
        for y in 7...12 {
            px(4, y, palette.outline); px(11, y, palette.outline)
            for x in 5...10 { px(x, y, palette.bodyDark) }
        }
        // Backpack
        px(6, 9, palette.body); px(7, 9, palette.body); px(8, 9, palette.body); px(9, 9, palette.body)

        // Arms typing animation
        if typing && frame == 1 {
            // Arms extended forward (typing)
            for x in 3...4 { px(x, 9, palette.limb) }
            for x in 11...12 { px(x, 9, palette.limb) }
            px(2, 10, palette.accent); px(13, 10, palette.accent)
        } else {
            // Arms at rest
            px(3, 8, palette.limb); px(3, 9, palette.limb); px(3, 10, palette.limb)
            px(12, 8, palette.limb); px(12, 9, palette.limb); px(12, 10, palette.limb)
        }

        // Seated legs (visible below body, short stub)
        for x in 5...6 { px(x, 13, palette.limb); px(x, 14, palette.limb); px(x, 15, palette.limb) }
        for x in 9...10 { px(x, 13, palette.limb); px(x, 14, palette.limb); px(x, 15, palette.limb) }
        for x in 5...10 { px(x, 13, palette.outline) }

        return ctx.makeImage()
    }
}

// MARK: - NSColor RGB convenience

private extension NSColor {
    convenience init(r: UInt8, g: UInt8, b: UInt8) {
        self.init(
            calibratedRed: CGFloat(r) / 255.0,
            green: CGFloat(g) / 255.0,
            blue: CGFloat(b) / 255.0,
            alpha: 1.0
        )
    }
}
