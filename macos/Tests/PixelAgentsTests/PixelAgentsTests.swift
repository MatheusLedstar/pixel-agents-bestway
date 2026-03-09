import Testing
import Foundation
@testable import PixelAgents

@MainActor @Test func appInitializes() async throws {
    let service = ClaudeDataService()
    #expect(service.teams.isEmpty)
    #expect(service.selectedTeam == nil)
    #expect(!service.isLoading)
    #expect(service.lastError == nil)
}

@MainActor
@Suite("RealDataSmokeTest")
struct RealDataSmokeTests {
    private var claudeTeamsPath: String {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return "\(home)/.claude/teams"
    }

    private var hasRealData: Bool {
        FileManager.default.fileExists(atPath: claudeTeamsPath)
    }

    @Test func smokeTestWithRealClaudeData() async throws {
        // Skip if no real ~/.claude/teams/ directory exists
        try #require(hasRealData, "Skipping: ~/.claude/teams/ does not exist")

        let service = ClaudeDataService()
        await service.loadTeams()

        // Should load without crashing
        #expect(service.lastError == nil)

        // If teams exist, verify basic structure
        if let first = service.teams.first {
            #expect(!first.name.isEmpty)
            await service.selectTeam(first)
            // Should not crash when selecting a real team
            #expect(service.selectedTeam != nil)
        }
    }
}
