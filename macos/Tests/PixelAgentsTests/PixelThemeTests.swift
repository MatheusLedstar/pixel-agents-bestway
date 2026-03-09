import Testing
import SwiftUI
@testable import PixelAgents

@Suite("PixelTheme")
struct PixelThemeTests {
    @Test func themeColorsExist() {
        // Verify all theme colors are accessible
        let _ = PixelTheme.bgPage
        let _ = PixelTheme.bgSidebar
        let _ = PixelTheme.bgSurface
        let _ = PixelTheme.bgCard
        let _ = PixelTheme.border
        let _ = PixelTheme.textPrimary
        let _ = PixelTheme.textSecondary
        let _ = PixelTheme.textMuted
        let _ = PixelTheme.accentOrange
        let _ = PixelTheme.accentOrangeSecondary
        let _ = PixelTheme.green
        let _ = PixelTheme.yellow
        let _ = PixelTheme.blue
        let _ = PixelTheme.purple
        let _ = PixelTheme.red
    }

    @Test func colorHexInitializer() {
        // Test Color hex initializer
        let white = Color(hex: 0xFFFFFF)
        let black = Color(hex: 0x000000)
        let red = Color(hex: 0xFF0000)

        // Just verify they can be created without crashing
        #expect(type(of: white) == Color.self)
        #expect(type(of: black) == Color.self)
        #expect(type(of: red) == Color.self)
    }

    @Test func colorHexWithOpacity() {
        let semiTransparent = Color(hex: 0xFF0000, opacity: 0.5)
        #expect(type(of: semiTransparent) == Color.self)
    }

    @Test func fontHelpers() {
        let interFont = Font.inter(14, weight: .medium)
        #expect(type(of: interFont) == Font.self)

        let monoFont = Font.jetBrainsMono(12, weight: .bold)
        #expect(type(of: monoFont) == Font.self)

        // Default weight
        let defaultInter = Font.inter(16)
        #expect(type(of: defaultInter) == Font.self)

        let defaultMono = Font.jetBrainsMono(14)
        #expect(type(of: defaultMono) == Font.self)
    }
}
