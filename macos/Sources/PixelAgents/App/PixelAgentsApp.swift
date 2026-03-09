import SwiftUI
import AppKit

@main
struct PixelAgentsApp: App {
    @State private var dataService = ClaudeDataService()

    init() {
        // Ensure NSApplication exists before setting activation policy
        _ = NSApplication.shared
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
        AppIcon.configure()
    }

    var body: some Scene {
        WindowGroup("Pixel Agents") {
            DashboardView()
                .environment(dataService)
                .frame(minWidth: 1200, minHeight: 800)
        }
    }
}
