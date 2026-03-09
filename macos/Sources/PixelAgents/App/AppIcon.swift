import AppKit

// MARK: - App Icon Generator

enum AppIcon {
    /// Generate app icon: group of agents in a meeting circle
    static func configure() {
        let size: CGFloat = 512
        let image = NSImage(size: NSSize(width: size, height: size))

        image.lockFocus()
        guard let context = NSGraphicsContext.current?.cgContext else {
            image.unlockFocus()
            return
        }

        let rect = CGRect(x: 0, y: 0, width: size, height: size)
        let cornerRadius: CGFloat = size * 0.22

        // Background: dark rounded square
        let bgPath = CGPath(roundedRect: rect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
        context.addPath(bgPath)
        context.setFillColor(CGColor(red: 0.051, green: 0.051, blue: 0.051, alpha: 1))
        context.fillPath()

        // Subtle inner glow ring (meeting table metaphor)
        let ringCenter = CGPoint(x: size / 2, y: size / 2 + size * 0.02)
        let ringRadius: CGFloat = size * 0.22
        context.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.04))
        context.setLineWidth(size * 0.06)
        context.addEllipse(in: CGRect(
            x: ringCenter.x - ringRadius,
            y: ringCenter.y - ringRadius,
            width: ringRadius * 2,
            height: ringRadius * 2
        ))
        context.strokePath()

        // Agent colors (from the app's palette)
        let agentColors: [(r: CGFloat, g: CGFloat, b: CGFloat, r2: CGFloat, g2: CGFloat, b2: CGFloat)] = [
            (0.976, 0.451, 0.086, 0.929, 0.271, 0.271),  // orange → red
            (0.192, 0.718, 0.918, 0.118, 0.400, 0.882),  // cyan → blue
            (0.576, 0.192, 0.918, 0.365, 0.137, 0.820),  // purple → deep purple
            (0.180, 0.800, 0.443, 0.082, 0.627, 0.322),  // green → dark green
            (0.918, 0.192, 0.518, 0.780, 0.140, 0.400),  // pink → magenta
            (0.957, 0.757, 0.180, 0.890, 0.580, 0.120),  // yellow → gold
        ]

        // Place 6 agents in a circle around center
        let agentRadius: CGFloat = size * 0.095
        let orbitRadius: CGFloat = size * 0.24
        let agentCount = 6

        for i in 0..<agentCount {
            let angle = (Double(i) / Double(agentCount)) * .pi * 2 - .pi / 2
            let ax = ringCenter.x + orbitRadius * CGFloat(cos(angle))
            let ay = ringCenter.y + orbitRadius * CGFloat(sin(angle))
            let colors = agentColors[i]

            // Agent glow
            drawGlow(context: context, center: CGPoint(x: ax, y: ay),
                     radius: agentRadius * 1.6,
                     color: CGColor(red: colors.r, green: colors.g, blue: colors.b, alpha: 0.15))

            // Agent circle with gradient
            drawAgentCircle(
                context: context,
                center: CGPoint(x: ax, y: ay),
                radius: agentRadius,
                color1: (colors.r, colors.g, colors.b),
                color2: (colors.r2, colors.g2, colors.b2)
            )

            // Eyes
            let eyeSize: CGFloat = agentRadius * 0.22
            let eyeSpacing: CGFloat = agentRadius * 0.35
            let eyeY = ay + eyeSize * 0.15
            context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.92))
            context.fillEllipse(in: CGRect(x: ax - eyeSpacing - eyeSize/2, y: eyeY - eyeSize/2, width: eyeSize, height: eyeSize))
            context.fillEllipse(in: CGRect(x: ax + eyeSpacing - eyeSize/2, y: eyeY - eyeSize/2, width: eyeSize, height: eyeSize))

            // Connection lines to neighbors (subtle)
            let nextI = (i + 1) % agentCount
            let nextAngle = (Double(nextI) / Double(agentCount)) * .pi * 2 - .pi / 2
            let nx = ringCenter.x + orbitRadius * CGFloat(cos(nextAngle))
            let ny = ringCenter.y + orbitRadius * CGFloat(sin(nextAngle))

            context.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.06))
            context.setLineWidth(1.5)
            context.move(to: CGPoint(x: ax, y: ay))
            context.addLine(to: CGPoint(x: nx, y: ny))
            context.strokePath()
        }

        // Center hub dot (orchestrator)
        drawGlow(context: context, center: ringCenter, radius: size * 0.08,
                 color: CGColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 0.25))
        context.setFillColor(CGColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 0.9))
        let hubSize: CGFloat = size * 0.04
        context.fillEllipse(in: CGRect(
            x: ringCenter.x - hubSize, y: ringCenter.y - hubSize,
            width: hubSize * 2, height: hubSize * 2
        ))

        // Radial lines from center to each agent
        for i in 0..<agentCount {
            let angle = (Double(i) / Double(agentCount)) * .pi * 2 - .pi / 2
            let ax = ringCenter.x + orbitRadius * CGFloat(cos(angle))
            let ay = ringCenter.y + orbitRadius * CGFloat(sin(angle))

            context.setStrokeColor(CGColor(red: 0.976, green: 0.451, blue: 0.086, alpha: 0.12))
            context.setLineWidth(1.0)
            context.setLineDash(phase: 0, lengths: [4, 4])
            context.move(to: ringCenter)
            context.addLine(to: CGPoint(x: ax, y: ay))
            context.strokePath()
            context.setLineDash(phase: 0, lengths: [])
        }

        image.unlockFocus()
        NSApp.applicationIconImage = image
    }

    // MARK: - Drawing Helpers

    private static func drawAgentCircle(
        context: CGContext, center: CGPoint, radius: CGFloat,
        color1: (CGFloat, CGFloat, CGFloat), color2: (CGFloat, CGFloat, CGFloat)
    ) {
        let colors = [
            CGColor(red: color1.0, green: color1.1, blue: color1.2, alpha: 1),
            CGColor(red: color2.0, green: color2.1, blue: color2.2, alpha: 1),
        ] as CFArray

        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                      colors: colors, locations: [0, 1]) {
            context.saveGState()
            context.addEllipse(in: CGRect(
                x: center.x - radius, y: center.y - radius,
                width: radius * 2, height: radius * 2
            ))
            context.clip()
            context.drawRadialGradient(
                gradient,
                startCenter: CGPoint(x: center.x - radius * 0.3, y: center.y + radius * 0.3),
                startRadius: 0,
                endCenter: center,
                endRadius: radius,
                options: [.drawsAfterEndLocation]
            )
            context.restoreGState()
        }
    }

    private static func drawGlow(context: CGContext, center: CGPoint, radius: CGFloat, color: CGColor) {
        let colors = [color, CGColor(red: 0, green: 0, blue: 0, alpha: 0)] as CFArray
        if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                                      colors: colors, locations: [0, 1]) {
            context.saveGState()
            context.drawRadialGradient(gradient, startCenter: center, startRadius: 0,
                                        endCenter: center, endRadius: radius,
                                        options: [.drawsAfterEndLocation])
            context.restoreGState()
        }
    }
}
