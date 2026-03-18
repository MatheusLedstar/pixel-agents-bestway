import SwiftUI

struct MainContentView: View {
    @Environment(ClaudeDataService.self) private var dataService
    let team: TeamConfig
    @Binding var selectedFileChange: FileChange?
    @State private var isChatMaximized = false
    @State private var showGameMap = false

    var body: some View {
        VStack(spacing: 0) {
            // Team header with metrics + game map toggle
            HStack(spacing: 0) {
                TeamHeader(team: team, telemetry: dataService.telemetry)
                    .frame(maxWidth: .infinity)

                // Game Map toggle button
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showGameMap.toggle()
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: showGameMap ? "rectangle.grid.2x2" : "map")
                            .font(.system(size: 11, weight: .semibold))
                        Text(showGameMap ? "Dashboard" : "Game Map")
                            .font(.inter(11, weight: .semibold))
                    }
                    .foregroundStyle(showGameMap ? PixelTheme.accentOrange : PixelTheme.textSecondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(showGameMap ? PixelTheme.accentOrange.opacity(0.12) : Color.white.opacity(0.04))
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .padding(.trailing, 24)
            }

            if showGameMap {
                // Game Map view
                GameMapView(
                    team: team,
                    activities: dataService.activities,
                    tasks: dataService.tasks,
                    messages: dataService.messages,
                    allMembers: dataService.allMembers
                )
                .padding(24)
            } else {
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
                            tasks: dataService.tasks,
                            telemetry: dataService.telemetry,
                            teamName: team.name,
                            members: dataService.allMembers,
                            onlineCount: dataService.activeAgentCount,
                            isMaximized: $isChatMaximized
                        )
                    }
                }
                .padding(24)
            }
        }
        .background(PixelTheme.bgPage)
    }
}
