import SwiftUI
import WebKit

// MARK: - WebView Game Map (WKWebView wrapper)

struct WebGameMapView: NSViewRepresentable {
    let team: TeamConfig
    let activities: [AgentActivity]
    let tasks: [AgentTask]
    let messages: [InboxMessage]
    let allMembers: [TeamMember]
    let gameService: GameStateService
    @Binding var selectedAgentName: String?

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "agentClicked")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        webView.navigationDelegate = context.coordinator

        // Load HTML from temp file
        let htmlContent = GameMapHTML.content
        let tmpDir = FileManager.default.temporaryDirectory
        let htmlFile = tmpDir.appendingPathComponent("pixel-agents-gamemap.html")
        try? htmlContent.write(to: htmlFile, atomically: true, encoding: .utf8)
        webView.loadFileURL(htmlFile, allowingReadAccessTo: htmlFile)

        context.coordinator.webView = webView
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        context.coordinator.pendingUpdate = buildAgentData()
        context.coordinator.flushIfReady()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        let parent: WebGameMapView
        weak var webView: WKWebView?
        var isLoaded = false
        var pendingUpdate: [[String: Any]]?

        init(_ parent: WebGameMapView) { self.parent = parent }

        func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "agentClicked", let name = message.body as? String {
                DispatchQueue.main.async {
                    self.parent.selectedAgentName = name.isEmpty ? nil : name
                }
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isLoaded = true
            flushIfReady()
        }

        func flushIfReady() {
            guard isLoaded, let data = pendingUpdate, let webView = webView else { return }
            pendingUpdate = nil
            if let json = try? JSONSerialization.data(withJSONObject: data),
               let jsonStr = String(data: json, encoding: .utf8) {
                webView.evaluateJavaScript("window.updateAgents(\(jsonStr))") { _, error in
                    if let error = error {
                        print("[WebGameMap] JS error: \(error.localizedDescription)")
                    }
                }
            }
        }
    }

    private func buildAgentData() -> [[String: Any]] {
        let members = allMembers.isEmpty ? team.members : allMembers
        return members.map { member in
            let activity = activities.first { $0.agentName == member.name }
            let classified = ActivityClassifier.classify(
                agentName: member.name,
                agentType: member.agentType,
                activity: activity,
                tasks: tasks,
                messages: messages
            )
            let gameData = gameService.agentData(for: member.name)
            return [
                "name": member.name,
                "agentType": member.agentType ?? "general-purpose",
                "zone": classified.zone.rawValue,
                "activity": classified.visualActivity.rawValue,
                "emote": classified.emote ?? "",
                "level": gameData.level,
                "toolDescription": classified.toolDescription
            ] as [String: Any]
        }
    }
}
