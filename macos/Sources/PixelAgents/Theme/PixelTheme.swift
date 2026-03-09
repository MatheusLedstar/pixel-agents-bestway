import SwiftUI

// MARK: - Theme Colors

enum PixelTheme {
    // Backgrounds
    static let bgPage = Color(hex: 0x0D0D0D)
    static let bgSidebar = Color(hex: 0x08080A)
    static let bgSurface = Color(hex: 0x0F0F12)
    static let bgCard = Color.white.opacity(0.024)

    // Borders
    static let border = Color.white.opacity(0.06)

    // Text
    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.70)
    static let textMuted = Color.white.opacity(0.38)

    // Accents
    static let accentOrange = Color(hex: 0xF97316)
    static let accentOrangeSecondary = Color(hex: 0xEA580C)

    // Status colors
    static let green = Color(hex: 0x10B981)
    static let yellow = Color(hex: 0xF59E0B)
    static let blue = Color(hex: 0x3B82F6)
    static let purple = Color(hex: 0x8B5CF6)
    static let red = Color(hex: 0xEF4444)
}

// MARK: - Color Extension

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}

// MARK: - Agent Gradient

struct AgentGradient {
    let colors: [Color]

    var radialGradient: RadialGradient {
        RadialGradient(
            colors: colors,
            center: .init(x: 0.35, y: 0.35),
            startRadius: 0,
            endRadius: 40
        )
    }

    func radialGradient(endRadius: CGFloat) -> RadialGradient {
        RadialGradient(
            colors: colors,
            center: .init(x: 0.35, y: 0.35),
            startRadius: 0,
            endRadius: endRadius
        )
    }
}

// MARK: - Agent Color Palette

enum AgentColorPalette: CaseIterable {
    case green
    case amber
    case blue
    case purple
    case red
    case cyan
    case pink
    case indigo

    var gradient: AgentGradient {
        switch self {
        case .green:
            return AgentGradient(colors: [
                Color(hex: 0x6EE7B7),
                Color(hex: 0x10B981),
                Color(hex: 0x059669),
            ])
        case .amber:
            return AgentGradient(colors: [
                Color(hex: 0xFCD34D),
                Color(hex: 0xF59E0B),
                Color(hex: 0xD97706),
            ])
        case .blue:
            return AgentGradient(colors: [
                Color(hex: 0x93C5FD),
                Color(hex: 0x3B82F6),
                Color(hex: 0x2563EB),
            ])
        case .purple:
            return AgentGradient(colors: [
                Color(hex: 0xC4B5FD),
                Color(hex: 0x8B5CF6),
                Color(hex: 0x6D28D9),
            ])
        case .red:
            return AgentGradient(colors: [
                Color(hex: 0xFCA5A5),
                Color(hex: 0xEF4444),
                Color(hex: 0xDC2626),
            ])
        case .cyan:
            return AgentGradient(colors: [
                Color(hex: 0x67E8F9),
                Color(hex: 0x06B6D4),
                Color(hex: 0x0891B2),
            ])
        case .pink:
            return AgentGradient(colors: [
                Color(hex: 0xF9A8D4),
                Color(hex: 0xEC4899),
                Color(hex: 0xDB2777),
            ])
        case .indigo:
            return AgentGradient(colors: [
                Color(hex: 0xA5B4FC),
                Color(hex: 0x6366F1),
                Color(hex: 0x4F46E5),
            ])
        }
    }

    static func colorForAgent(name: String) -> AgentGradient {
        let hash = name.utf8.reduce(0) { ($0 &* 31) &+ Int($1) }
        let index = abs(hash) % allCases.count
        return allCases[index].gradient
    }
}

// MARK: - Glass Background Modifier

struct GlassBackground: ViewModifier {
    var cornerRadius: CGFloat = 12

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.white.opacity(0.08), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
    }
}

extension View {
    func glassBackground(cornerRadius: CGFloat = 12) -> some View {
        modifier(GlassBackground(cornerRadius: cornerRadius))
    }
}

// MARK: - Gradient Divider

struct GradientDivider: View {
    var body: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [
                        PixelTheme.accentOrange.opacity(0),
                        PixelTheme.accentOrange.opacity(0.5),
                        PixelTheme.accentOrange.opacity(0),
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(height: 1)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            Text(text)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(color)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }
}

// MARK: - Progress Bar

struct ProgressBar: View {
    let value: Double
    var gradient: LinearGradient = LinearGradient(
        colors: [PixelTheme.accentOrange, PixelTheme.accentOrangeSecondary],
        startPoint: .leading,
        endPoint: .trailing
    )

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(PixelTheme.bgSurface)

                RoundedRectangle(cornerRadius: 4)
                    .fill(gradient)
                    .frame(width: geometry.size.width * max(0, min(1, value)))
            }
        }
        .frame(height: 6)
    }
}

// MARK: - Font Helpers

extension Font {
    /// UI text font - uses system font (SF Pro on macOS, equivalent to Inter)
    static func inter(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }

    /// Monospaced font for technical data - system monospaced (fallback for JetBrains Mono)
    static func jetBrainsMono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
}
