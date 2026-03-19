import Foundation

// MARK: - Game Map HTML Content

/// Provides the HTML content for the WebView game map.
enum GameMapHTML {

    /// Safely locate the SPM resource bundle without calling Bundle.module,
    /// which internally calls fatalError if the bundle is not found.
    private static var resourceBundle: Bundle? {
        let bundleName = "PixelAgents_PixelAgents"
        let candidates: [URL] = [
            // Contents/Resources (standard .app layout)
            Bundle.main.bundleURL
                .appendingPathComponent("Contents")
                .appendingPathComponent("Resources"),
            // Flat layout (beside executable, e.g. swift run)
            Bundle.main.bundleURL,
            // resourceURL shorthand
            Bundle.main.resourceURL ?? Bundle.main.bundleURL,
        ]
        for dir in candidates {
            let url = dir.appendingPathComponent(bundleName + ".bundle")
            if let bundle = Bundle(url: url) {
                return bundle
            }
        }
        return nil
    }

    static var content: String {
        // 1. Try SPM resource bundle (safe — no fatalError)
        if let bundle = resourceBundle {
            let candidates = [
                bundle.url(forResource: "gamemap", withExtension: "html", subdirectory: "Resources"),
                bundle.url(forResource: "gamemap", withExtension: "html"),
            ]
            for url in candidates.compactMap({ $0 }) {
                if let html = try? String(contentsOf: url, encoding: .utf8) {
                    return html
                }
            }
        }

        // 2. Try app main bundle directly
        if let url = Bundle.main.url(forResource: "gamemap", withExtension: "html"),
           let html = try? String(contentsOf: url, encoding: .utf8) {
            return html
        }

        // 3. Minimal error fallback — never crashes
        return """
        <!DOCTYPE html>
        <html><body style="background:#0d0f14;color:#F97316;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:16px">🗺️</div>
        <h2 style="margin:0 0 8px">Game Map Unavailable</h2>
        <p style="color:#64748b;margin:0">gamemap.html not found in app bundle.</p>
        </div>
        </body></html>
        """
    }
}
