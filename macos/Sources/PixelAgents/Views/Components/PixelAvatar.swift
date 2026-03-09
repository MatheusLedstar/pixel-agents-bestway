import SwiftUI

// MARK: - PixelAvatar

struct PixelAvatar: View {
    let agentName: String
    var size: CGFloat = 36
    var isActive: Bool = true

    @State private var breathing = false

    private var gradient: AgentGradient {
        AgentColorPalette.colorForAgent(name: agentName)
    }

    var body: some View {
        ZStack {
            // Background gradient
            Circle()
                .fill(gradient.radialGradient(endRadius: size * 0.6))

            // Left eye
            Ellipse()
                .fill(.white)
                .frame(width: size * 0.14, height: size * 0.28)
                .offset(x: -size * 0.12, y: -size * 0.04)

            // Right eye
            Ellipse()
                .fill(.white)
                .frame(width: size * 0.14, height: size * 0.28)
                .offset(x: size * 0.12, y: -size * 0.04)

            // Highlight
            Ellipse()
                .fill(.white.opacity(0.25))
                .frame(width: size * 0.375, height: size * 0.25)
                .offset(x: -size * 0.05, y: -size * 0.15)
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .opacity(isActive ? 1.0 : 0.6)
        .scaleEffect(isActive && breathing ? 1.03 : 1.0)
        .animation(
            isActive
                ? .easeInOut(duration: 2.0).repeatForever(autoreverses: true)
                : .default,
            value: breathing
        )
        .onAppear {
            if isActive {
                breathing = true
            }
        }
        .onChange(of: isActive) { _, newValue in
            breathing = newValue
        }
    }
}

// MARK: - PixelAvatarStack

struct PixelAvatarStack: View {
    let agents: [String]
    var size: CGFloat = 20
    private let maxVisible = 5

    var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(agents.prefix(maxVisible).enumerated()), id: \.offset) { index, name in
                PixelAvatar(agentName: name, size: size, isActive: true)
                    .overlay(
                        Circle()
                            .stroke(PixelTheme.bgSidebar, lineWidth: 2)
                    )
                    .offset(x: CGFloat(-index) * 6)
                    .zIndex(Double(maxVisible - index))
            }

            if agents.count > maxVisible {
                Text("+\(agents.count - maxVisible)")
                    .font(.system(size: size * 0.4, weight: .semibold, design: .monospaced))
                    .foregroundStyle(PixelTheme.textSecondary)
                    .frame(width: size, height: size)
                    .background(PixelTheme.bgSurface)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(PixelTheme.bgSidebar, lineWidth: 2)
                    )
                    .offset(x: CGFloat(-maxVisible) * 6)
                    .zIndex(0)
            }
        }
        .padding(.trailing, CGFloat(min(agents.count, maxVisible + 1) - 1) * 6)
    }
}
