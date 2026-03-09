import SwiftUI

struct DashboardView: View {
    @Environment(ClaudeDataService.self) private var dataService
    @State private var selectedTeamName: String?
    @State private var selectedFileChange: FileChange?

    var body: some View {
        HStack(spacing: 0) {
            // Sidebar
            TeamsSidebar(selectedTeamName: $selectedTeamName)

            // Vertical divider
            Rectangle()
                .fill(Color.white.opacity(0.063))
                .frame(width: 1)

            // Detail
            if let team = dataService.selectedTeam {
                MainContentView(
                    team: team,
                    selectedFileChange: $selectedFileChange
                )
            } else {
                emptyState
            }
        }
        .background(PixelTheme.bgPage)
        .overlay {
            // Diff viewer overlay
            if let fileChange = selectedFileChange {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                    .onTapGesture { selectedFileChange = nil }

                DiffViewerOverlay(fileChange: fileChange) {
                    selectedFileChange = nil
                }
                .frame(maxWidth: 800, maxHeight: 600)
                .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(.easeOut(duration: 0.2), value: selectedFileChange != nil)
        .task {
            await dataService.loadTeams()
            await dataService.startWatching()

            // Auto-select first team
            if selectedTeamName == nil, let first = dataService.teams.first {
                selectedTeamName = first.name
                await dataService.selectTeam(first)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "rectangle.3.group")
                .font(.system(size: 48))
                .foregroundStyle(PixelTheme.textMuted)
            Text("Select a team")
                .font(.inter(16, weight: .medium))
                .foregroundStyle(PixelTheme.textSecondary)
            Text("Choose a team from the sidebar to view agent activity")
                .font(.inter(12, weight: .regular))
                .foregroundStyle(PixelTheme.textMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
