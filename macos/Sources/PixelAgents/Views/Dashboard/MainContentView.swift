import SwiftUI

struct MainContentView: View {
    @Environment(ClaudeDataService.self) private var dataService
    let team: TeamConfig
    @Binding var selectedFileChange: FileChange?
    @State private var isChatMaximized = false

    var body: some View {
        VStack(spacing: 0) {
            // Team header with metrics
            TeamHeader(team: team, telemetry: dataService.telemetry)

            // Content without outer scroll - each section scrolls independently
            VStack(spacing: 16) {
                if !isChatMaximized {
                    // Agent cards grid (horizontal scroll only)
                    AgentCardsSection(
                        team: team,
                        allMembers: dataService.allMembers,
                        activities: dataService.activities,
                        tasks: dataService.tasks,
                        entries: dataService.sessionEntries,
                        selectedFileChange: $selectedFileChange
                    )
                }

                // Bottom row: Activity Feed + Chat Room (each scrolls internally)
                HStack(alignment: .top, spacing: 16) {
                    if !isChatMaximized {
                        // Activity feed (expands to fill, scrolls internally)
                        ActivityFeed(
                            entries: dataService.sessionEntries,
                            messages: dataService.messages
                        )
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }

                    // Team chat room (fixed or maximized width, scrolls internally)
                    TeamChatRoom(
                        messages: dataService.messages,
                        onlineCount: dataService.activeAgentCount,
                        isMaximized: $isChatMaximized
                    )
                }
            }
            .padding(24)
        }
        .background(PixelTheme.bgPage)
    }
}
