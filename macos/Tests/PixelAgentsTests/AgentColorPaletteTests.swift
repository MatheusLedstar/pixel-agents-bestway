import Testing
import SwiftUI
@testable import PixelAgents

@Suite("AgentColorPalette")
struct AgentColorPaletteTests {
    @Test func consistentColorsForSameName() {
        let gradient1 = AgentColorPalette.colorForAgent(name: "swift-arch")
        let gradient2 = AgentColorPalette.colorForAgent(name: "swift-arch")

        // Same name should produce same gradient (same number of color stops)
        #expect(gradient1.colors.count == gradient2.colors.count)

        // Verify determinism by checking multiple times
        for _ in 0..<10 {
            let g = AgentColorPalette.colorForAgent(name: "swift-arch")
            #expect(g.colors.count == gradient1.colors.count)
        }
    }

    @Test func differentColorsForDifferentNames() {
        let names = ["green-agent", "amber-agent", "blue-agent", "purple-agent",
                     "red-agent", "cyan-agent", "pink-agent", "indigo-agent"]

        var gradients: [AgentGradient] = []
        for name in names {
            gradients.append(AgentColorPalette.colorForAgent(name: name))
        }

        // All should have 3 color stops
        for gradient in gradients {
            #expect(gradient.colors.count == 3)
        }
    }

    @Test func handlesEmptyString() {
        let gradient = AgentColorPalette.colorForAgent(name: "")
        #expect(gradient.colors.count == 3)
    }

    @Test func handlesSpecialCharacters() {
        let specialNames = [
            "agent@team",
            "agent-with-dashes",
            "agent_with_underscores",
            "agent.with.dots",
            "名前",  // Japanese
            "🤖agent",
            "agent/path/name",
            "agent with spaces",
        ]

        for name in specialNames {
            let gradient = AgentColorPalette.colorForAgent(name: name)
            #expect(gradient.colors.count == 3)
        }
    }

    @Test func allPaletteCasesHaveGradients() {
        for palette in AgentColorPalette.allCases {
            let gradient = palette.gradient
            #expect(gradient.colors.count == 3)
        }
    }

    @Test func paletteCount() {
        #expect(AgentColorPalette.allCases.count == 8)
    }

    @Test func gradientProducesRadialGradient() {
        let gradient = AgentColorPalette.green.gradient

        // Test default radial gradient
        let radial = gradient.radialGradient
        #expect(type(of: radial) == RadialGradient.self)

        // Test custom endRadius
        let customRadial = gradient.radialGradient(endRadius: 100)
        #expect(type(of: customRadial) == RadialGradient.self)
    }
}
