import SwiftUI

// MARK: - Team Chat Room

struct TeamChatRoom: View {
    let messages: [InboxMessage]
    let tasks: [AgentTask]
    let telemetry: TeamTelemetry
    let teamName: String
    let members: [TeamMember]
    let onlineCount: Int
    @Binding var isMaximized: Bool
    @State private var showCTOSummary = false
    @State private var summaryService = CTOSummaryService()
    @State private var messageText = ""
    @FocusState private var isInputFocused: Bool

    private var visibleMessages: [InboxMessage] {
        messages.filter { !$0.isProtocolMessage }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Team Chat Room")
                    .font(.inter(16, weight: .semibold))
                    .foregroundStyle(PixelTheme.textPrimary)

                Spacer()

                // CTO Summary button
                Button {
                    showCTOSummary = true
                    Task {
                        await summaryService.generate(
                            teamName: teamName,
                            messages: messages,
                            tasks: tasks,
                            telemetry: telemetry
                        )
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 9, weight: .medium))
                        Text("CTO Summary")
                            .font(.inter(9, weight: .semibold))
                    }
                    .foregroundStyle(PixelTheme.accentOrange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(PixelTheme.accentOrange.opacity(0.12))
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .help("Gerar resumo executivo para CTO")

                // Online badge
                HStack(spacing: 4) {
                    Circle()
                        .fill(PixelTheme.purple)
                        .frame(width: 6, height: 6)
                    Text("\(onlineCount) online")
                        .font(.inter(10, weight: .medium))
                        .foregroundStyle(PixelTheme.purple)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(PixelTheme.purple.opacity(0.12))
                .clipShape(Capsule())

                // Maximize/minimize button
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        isMaximized.toggle()
                    }
                } label: {
                    Image(systemName: isMaximized ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(PixelTheme.textMuted)
                        .padding(4)
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            Rectangle()
                .fill(Color.white.opacity(0.04))
                .frame(height: 1)

            // Messages (filter out internal protocol messages)
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(visibleMessages) { message in
                            ChatBubble(message: message, isMaximized: isMaximized)
                                .id(message.id)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: visibleMessages.count) { _, _ in
                    if let lastId = visibleMessages.last?.id {
                        withAnimation(.easeOut(duration: 0.2)) {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }

            // Message input bar
            Rectangle()
                .fill(Color.white.opacity(0.04))
                .frame(height: 1)

            HStack(spacing: 8) {
                TextField("Message the team…", text: $messageText)
                    .font(.inter(13, weight: .regular))
                    .foregroundStyle(PixelTheme.textPrimary)
                    .focused($isInputFocused)
                    .onSubmit { sendMessage() }
                    .textFieldStyle(.plain)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(messageText.isEmpty ? PixelTheme.textMuted : PixelTheme.accentOrange)
                        .padding(8)
                        .background(messageText.isEmpty ? Color.white.opacity(0.04) : PixelTheme.accentOrange.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                .disabled(messageText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .frame(width: isMaximized ? nil : 380)
        .frame(maxWidth: isMaximized ? .infinity : nil, maxHeight: .infinity)
        .background(Color.white.opacity(0.016))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(PixelTheme.purple.opacity(0.082), lineWidth: 1)
        )
        .sheet(isPresented: $showCTOSummary) {
            CTOSummarySheet(service: summaryService, teamName: teamName, isPresented: $showCTOSummary)
        }
    }

    // MARK: - Send Message

    private func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        messageText = ""

        let homePath = FileManager.default.homeDirectoryForCurrentUser.path
        let inboxesPath = "\(homePath)/.claude/teams/\(teamName)/inboxes"
        let timestamp = ISO8601DateFormatter().string(from: Date())

        let targets = members.isEmpty ? ["team-lead"] : members.map(\.name)

        for target in targets {
            let filePath = "\(inboxesPath)/\(target).json"
            let newMessage: [String: Any] = [
                "from": "you",
                "to": target,
                "text": text,
                "summary": text,
                "timestamp": timestamp,
                "color": "white",
                "read": false
            ]

            var existing: [[String: Any]] = []
            if let data = FileManager.default.contents(atPath: filePath),
               let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                existing = json
            }
            existing.append(newMessage)

            if let data = try? JSONSerialization.data(withJSONObject: existing, options: [.prettyPrinted]) {
                try? data.write(to: URL(fileURLWithPath: filePath))
            }
        }
    }
}

// MARK: - CTO Summary Sheet

struct CTOSummarySheet: View {
    let service: CTOSummaryService
    let teamName: String
    @Binding var isPresented: Bool
    @State private var renderedSummary: AttributedString?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("CTO Executive Summary")
                        .font(.inter(16, weight: .bold))
                        .foregroundStyle(PixelTheme.textPrimary)
                    Text(teamName)
                        .font(.inter(11, weight: .medium))
                        .foregroundStyle(PixelTheme.accentOrange)
                }

                Spacer()

                if service.isGenerating {
                    ProgressView()
                        .controlSize(.small)
                        .padding(.trailing, 8)
                }

                // Copy + Open in Browser buttons
                if !service.summary.isEmpty {
                    Button {
                        openInBrowser()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "safari")
                                .font(.system(size: 10))
                            Text("Abrir no Browser")
                                .font(.inter(10, weight: .semibold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(
                            LinearGradient(
                                colors: [PixelTheme.accentOrange, Color(red: 0.91, green: 0.35, blue: 0.0)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                    .buttonStyle(.plain)

                    Button {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(service.summary, forType: .string)
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "doc.on.doc")
                                .font(.system(size: 10))
                            Text("Copiar")
                                .font(.inter(10, weight: .medium))
                        }
                        .foregroundStyle(PixelTheme.textSecondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    isPresented = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(PixelTheme.textMuted)
                        .padding(6)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(20)

            Rectangle()
                .fill(Color.white.opacity(0.06))
                .frame(height: 1)

            // Content
            ScrollView {
                if service.isGenerating && service.summary.isEmpty {
                    SummaryLoadingAnimation()
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                } else if let error = service.error {
                    VStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 24))
                            .foregroundStyle(PixelTheme.red)
                        Text(error)
                            .font(.inter(12, weight: .medium))
                            .foregroundStyle(PixelTheme.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
                } else {
                    VStack(alignment: .leading, spacing: 0) {
                        if let attributed = renderedSummary {
                            Text(attributed)
                                .font(.inter(12, weight: .regular))
                                .foregroundStyle(PixelTheme.textSecondary)
                                .lineSpacing(3)
                                .textSelection(.enabled)
                        } else {
                            Text(service.summary)
                                .font(.inter(12, weight: .regular))
                                .foregroundStyle(PixelTheme.textSecondary)
                                .lineSpacing(3)
                                .textSelection(.enabled)
                        }
                    }
                    .padding(20)
                }
            }
        }
        .frame(width: 700, height: 600)
        .background(PixelTheme.bgCard)
        // Parse markdown off the main thread when summary changes
        .task(id: service.summary) {
            guard !service.summary.isEmpty, !service.isGenerating else { return }
            let text = service.summary
            let result = await Task.detached(priority: .userInitiated) {
                try? AttributedString(markdown: text, options: .init(interpretedSyntax: .full))
            }.value
            renderedSummary = result
        }
    }

    // MARK: - Open in Browser

    private func openInBrowser() {
        let html = generateHTML(summary: service.summary, teamName: teamName)
        let timestamp = Int(Date().timeIntervalSince1970)
        let path = "/tmp/cto-executive-report-\(timestamp).html"
        if let data = html.data(using: .utf8) {
            try? data.write(to: URL(fileURLWithPath: path))
            NSWorkspace.shared.open(URL(fileURLWithPath: path))
        }
    }

    private func generateHTML(summary: String, teamName: String) -> String {
        let b64 = summary.data(using: .utf8)?.base64EncodedString() ?? ""
        let dateStr = DateFormatter.localizedString(from: Date(), dateStyle: .long, timeStyle: .short)
        return """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Executive Report — \(teamName)</title>
          <script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            :root {
              --orange: #F97316;
              --orange-dim: #EA580C;
              --bg: #0d0f14;
              --bg-card: #13151c;
              --bg-elevated: #1a1d27;
              --border: rgba(255,255,255,0.07);
              --text-primary: #f1f5f9;
              --text-secondary: #94a3b8;
              --text-muted: #475569;
              --green: #22c55e;
              --red: #ef4444;
              --yellow: #eab308;
              --blue: #3b82f6;
              --purple: #a855f7;
            }
            html { scroll-behavior: smooth; }
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              background: var(--bg);
              color: var(--text-primary);
              min-height: 100vh;
              line-height: 1.6;
            }
            /* ── HEADER ── */
            .report-header {
              background: linear-gradient(135deg, #0f1219 0%, #1a1225 50%, #0f1219 100%);
              border-bottom: 1px solid var(--border);
              padding: 0;
              position: relative;
              overflow: hidden;
            }
            .report-header::before {
              content: '';
              position: absolute;
              top: -60px; left: -60px;
              width: 300px; height: 300px;
              background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
              pointer-events: none;
            }
            .report-header::after {
              content: '';
              position: absolute;
              bottom: -80px; right: 10%;
              width: 400px; height: 400px;
              background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
              pointer-events: none;
            }
            .header-inner {
              max-width: 960px;
              margin: 0 auto;
              padding: 48px 40px 40px;
              position: relative;
              z-index: 1;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              gap: 24px;
              flex-wrap: wrap;
            }
            .header-left {}
            .header-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(249,115,22,0.15);
              border: 1px solid rgba(249,115,22,0.3);
              color: var(--orange);
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              padding: 4px 10px;
              border-radius: 100px;
              margin-bottom: 16px;
            }
            .header-badge::before { content: '◆'; font-size: 8px; }
            .header-title {
              font-size: 38px;
              font-weight: 800;
              letter-spacing: -0.03em;
              line-height: 1.1;
              background: linear-gradient(135deg, #f1f5f9 30%, #94a3b8 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin-bottom: 8px;
            }
            .header-subtitle {
              font-size: 15px;
              color: var(--text-secondary);
              font-weight: 400;
            }
            .header-right {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 12px;
            }
            .header-meta {
              text-align: right;
            }
            .header-meta .label {
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--text-muted);
            }
            .header-meta .value {
              font-size: 13px;
              font-weight: 500;
              color: var(--text-secondary);
              font-family: 'JetBrains Mono', monospace;
            }
            .btn-print {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(249,115,22,0.15);
              border: 1px solid rgba(249,115,22,0.35);
              color: var(--orange);
              font-size: 12px;
              font-weight: 600;
              font-family: 'Inter', sans-serif;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .btn-print:hover {
              background: rgba(249,115,22,0.25);
              border-color: rgba(249,115,22,0.5);
            }
            /* ── MAIN ── */
            .report-body {
              max-width: 960px;
              margin: 0 auto;
              padding: 48px 40px 80px;
            }
            /* ── MARKDOWN CONTENT ── */
            #content h1 {
              font-size: 28px; font-weight: 800; letter-spacing: -0.02em;
              color: var(--text-primary);
              padding-bottom: 12px;
              border-bottom: 1px solid var(--border);
              margin-bottom: 24px; margin-top: 48px;
            }
            #content h1:first-child { margin-top: 0; }
            #content h2 {
              font-size: 20px; font-weight: 700; letter-spacing: -0.01em;
              color: var(--text-primary);
              margin-top: 40px; margin-bottom: 16px;
              display: flex; align-items: center; gap: 10px;
            }
            #content h2::before {
              content: '';
              display: inline-block;
              width: 4px; height: 20px;
              background: var(--orange);
              border-radius: 2px;
              flex-shrink: 0;
            }
            #content h3 {
              font-size: 15px; font-weight: 700;
              color: var(--orange);
              margin-top: 28px; margin-bottom: 10px;
              text-transform: uppercase; letter-spacing: 0.06em; font-size: 12px;
            }
            #content p {
              font-size: 15px; line-height: 1.75;
              color: var(--text-secondary);
              margin-bottom: 16px;
            }
            #content ul, #content ol {
              padding-left: 0; list-style: none;
              margin-bottom: 16px;
            }
            #content li {
              font-size: 14px; line-height: 1.7;
              color: var(--text-secondary);
              padding: 6px 0 6px 24px;
              position: relative;
              border-bottom: 1px solid rgba(255,255,255,0.03);
            }
            #content ul li::before {
              content: '▸';
              position: absolute; left: 4px;
              color: var(--orange); font-size: 11px;
              top: 8px;
            }
            #content ol { counter-reset: item; }
            #content ol li::before {
              counter-increment: item;
              content: counter(item) ".";
              position: absolute; left: 0;
              color: var(--orange); font-size: 12px; font-weight: 700;
              top: 7px;
            }
            #content strong {
              color: var(--text-primary);
              font-weight: 700;
            }
            #content em {
              color: var(--text-secondary);
              font-style: italic;
            }
            #content code {
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              background: rgba(255,255,255,0.07);
              color: #fbbf24;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid rgba(255,255,255,0.08);
            }
            #content pre {
              background: var(--bg-elevated);
              border: 1px solid var(--border);
              border-radius: 10px;
              padding: 20px;
              overflow-x: auto;
              margin: 20px 0;
            }
            #content pre code {
              background: none; border: none; padding: 0;
              font-size: 13px; line-height: 1.6;
              color: var(--text-secondary);
            }
            #content hr {
              border: none;
              border-top: 1px solid var(--border);
              margin: 36px 0;
            }
            #content blockquote {
              border-left: 3px solid var(--orange);
              padding: 12px 20px;
              background: rgba(249,115,22,0.06);
              border-radius: 0 8px 8px 0;
              margin: 20px 0;
            }
            #content blockquote p { margin: 0; color: var(--text-secondary); font-style: italic; }
            #content table {
              width: 100%;
              border-collapse: collapse;
              margin: 24px 0;
              font-size: 13px;
            }
            #content th {
              background: var(--bg-elevated);
              color: var(--text-primary);
              font-weight: 700;
              font-size: 11px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              padding: 10px 16px;
              text-align: left;
              border-bottom: 2px solid var(--border);
            }
            #content td {
              padding: 10px 16px;
              color: var(--text-secondary);
              border-bottom: 1px solid rgba(255,255,255,0.04);
            }
            #content tr:hover td { background: rgba(255,255,255,0.02); }
            /* Emoji status highlights */
            #content p:has(🔴), #content li:has(🔴) { border-left: 2px solid var(--red); padding-left: 12px; }
            #content p:has(🟡), #content li:has(🟡) { border-left: 2px solid var(--yellow); padding-left: 12px; }
            #content p:has(🟢), #content li:has(🟢) { border-left: 2px solid var(--green); padding-left: 12px; }
            /* ── FOOTER ── */
            .report-footer {
              border-top: 1px solid var(--border);
              max-width: 960px;
              margin: 0 auto;
              padding: 24px 40px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .footer-brand {
              font-size: 12px;
              color: var(--text-muted);
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .footer-brand span { color: var(--orange); font-weight: 600; }
            .footer-date {
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              color: var(--text-muted);
            }
            /* ── PRINT ── */
            @media print {
              body { background: white; color: #111; }
              .report-header { background: #f8fafc; border-bottom: 2px solid #f97316; }
              .header-title { -webkit-text-fill-color: #111; color: #111; }
              .btn-print { display: none; }
              #content h2::before { background: #f97316; }
              #content code { background: #f1f5f9; color: #92400e; border-color: #e2e8f0; }
              #content p, #content li, #content td { color: #374151; }
              .report-footer { border-top-color: #e2e8f0; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="header-inner">
              <div class="header-left">
                <div class="header-badge">Executive Report</div>
                <h1 class="header-title">CTO Executive<br>Summary</h1>
                <p class="header-subtitle">\(teamName)</p>
              </div>
              <div class="header-right">
                <div class="header-meta">
                  <div class="label">Generated</div>
                  <div class="value">\(dateStr)</div>
                </div>
                <button class="btn-print" onclick="window.print()">⎙ Print / Export PDF</button>
              </div>
            </div>
          </div>

          <div class="report-body">
            <div id="content"></div>
          </div>

          <footer class="report-footer">
            <div class="footer-brand">
              Powered by <span>Pixel Agents</span> · \(teamName)
            </div>
            <div class="footer-date">\(dateStr)</div>
          </footer>

          <script>
            function b64Unicode(str) {
              return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
            }
            const md = b64Unicode('\(b64)');
            marked.setOptions({ breaks: true, gfm: true });
            document.getElementById('content').innerHTML = marked.parse(md);
          </script>
        </body>
        </html>
        """
    }
}

// MARK: - Chat Bubble

// MARK: - Summary Loading Animation

struct SummaryLoadingAnimation: View {
    @State private var rotation: Double = 0
    @State private var pulse: Bool = false
    @State private var dotIndex: Int = 0
    @State private var phaseTimer: Timer?

    private let orbitColors: [Color] = [
        PixelTheme.accentOrange,
        PixelTheme.purple,
        PixelTheme.green,
        PixelTheme.blue
    ]

    private let phases = [
        "Coletando mensagens dos agentes",
        "Analisando progresso das tasks",
        "Identificando padrões de colaboração",
        "Gerando resumo executivo"
    ]

    var body: some View {
        VStack(spacing: 24) {
            // Orbiting dots animation
            ZStack {
                // Outer orbit ring
                Circle()
                    .stroke(Color.white.opacity(0.04), lineWidth: 1)
                    .frame(width: 80, height: 80)

                // Inner orbit ring
                Circle()
                    .stroke(Color.white.opacity(0.03), lineWidth: 1)
                    .frame(width: 48, height: 48)

                // Center pulsing icon
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(PixelTheme.accentOrange)
                    .scaleEffect(pulse ? 1.15 : 0.9)
                    .opacity(pulse ? 1.0 : 0.6)

                // Orbiting dots (outer)
                ForEach(0..<4, id: \.self) { i in
                    Circle()
                        .fill(orbitColors[i])
                        .frame(width: 8, height: 8)
                        .shadow(color: orbitColors[i].opacity(0.5), radius: 4)
                        .offset(y: -40)
                        .rotationEffect(.degrees(rotation + Double(i) * 90))
                }

                // Orbiting dots (inner, reverse)
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.white.opacity(0.3))
                        .frame(width: 5, height: 5)
                        .offset(y: -24)
                        .rotationEffect(.degrees(-rotation * 1.5 + Double(i) * 120))
                }
            }
            .frame(width: 100, height: 100)

            // Phase text
            VStack(spacing: 6) {
                Text(phases[dotIndex % phases.count])
                    .font(.inter(12, weight: .medium))
                    .foregroundStyle(PixelTheme.textSecondary)
                    .contentTransition(.numericText())

                // Animated dots
                HStack(spacing: 4) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(PixelTheme.accentOrange)
                            .frame(width: 4, height: 4)
                            .opacity(dotIndex % 3 >= i ? 1.0 : 0.2)
                    }
                }
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 3).repeatForever(autoreverses: false)) {
                rotation = 360
            }
            withAnimation(.easeInOut(duration: 1.2).repeatForever()) {
                pulse = true
            }
            // Cycle through phases
            phaseTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { [self] _ in
                Task { @MainActor in
                    withAnimation(.easeInOut(duration: 0.3)) {
                        dotIndex += 1
                    }
                }
            }
        }
        .onDisappear {
            phaseTimer?.invalidate()
            phaseTimer = nil
        }
    }
}

// MARK: - Chat Bubble

struct ChatBubble: View {
    let message: InboxMessage
    var isMaximized: Bool = false

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()

    private var agentColor: Color {
        AgentColorPalette.colorForAgent(name: message.from).colors.first ?? PixelTheme.purple
    }

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            PixelAvatar(agentName: message.from, size: 24)

            VStack(alignment: .leading, spacing: 4) {
                // Name + timestamp
                HStack(spacing: 6) {
                    Text(message.from)
                        .font(.jetBrainsMono(12, weight: .bold))
                        .foregroundStyle(agentColor)

                    if let to = message.to {
                        Image(systemName: "arrow.right")
                            .font(.system(size: 8))
                            .foregroundStyle(PixelTheme.textMuted)
                        Text(to)
                            .font(.jetBrainsMono(12, weight: .medium))
                            .foregroundStyle(PixelTheme.textMuted)
                    }

                    Spacer()

                    Text(Self.timeFormatter.string(from: message.timestamp))
                        .font(.jetBrainsMono(10, weight: .regular))
                        .foregroundStyle(PixelTheme.textMuted)
                }

                // Bubble with markdown content
                VStack(alignment: .leading, spacing: 4) {
                    // Type badge if structured message
                    if let type = message.displayType {
                        Text(type)
                            .font(.jetBrainsMono(8, weight: .bold))
                            .foregroundStyle(agentColor.opacity(0.7))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(agentColor.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 3))
                    }

                    Text(renderedContent)
                        .font(.inter(13, weight: .regular))
                        .foregroundStyle(PixelTheme.textSecondary)
                        .lineSpacing(3)
                        .lineLimit(isMaximized ? nil : 12)
                        .textSelection(.enabled)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 10)
                .background(agentColor.opacity(0.12))
                .clipShape(
                    UnevenRoundedRectangle(
                        topLeadingRadius: 2,
                        bottomLeadingRadius: 8,
                        bottomTrailingRadius: 8,
                        topTrailingRadius: 8
                    )
                )
            }
        }
    }

    // Static regex to avoid recompilation on every render
    private static let mentionRegex: NSRegularExpression? = {
        try? NSRegularExpression(pattern: "@[a-zA-Z0-9_-]+")
    }()

    private static let htmlTagRegex: NSRegularExpression? = {
        try? NSRegularExpression(pattern: "<[^>]+>")
    }()

    /// Render content with markdown support + @mention highlighting
    private var renderedContent: AttributedString {
        let rawContent = message.displayBody

        // Strip HTML tags if present
        let content = Self.stripHTML(rawContent)

        // Try full CommonMark parsing (headings, lists, bold, code, hr, etc.)
        var attributed: AttributedString
        if let md = try? AttributedString(
            markdown: content,
            options: .init(interpretedSyntax: .full)
        ) {
            attributed = md
        } else {
            attributed = AttributedString(content)
        }

        // Apply @mention highlighting on top
        guard let regex = Self.mentionRegex else {
            return attributed
        }

        let nsContent = content as NSString
        let matches = regex.matches(in: content, range: NSRange(location: 0, length: nsContent.length))

        for match in matches {
            let mentionStr = nsContent.substring(with: match.range)
            let agentName = String(mentionStr.dropFirst()) // remove @
            let mentionColor = AgentColorPalette.colorForAgent(name: agentName).colors.first ?? PixelTheme.purple

            if let range = attributed.range(of: mentionStr) {
                attributed[range].foregroundColor = mentionColor
                attributed[range].font = .system(size: 11, weight: .semibold)
            }
        }

        return attributed
    }

    /// Strip HTML tags from string
    private static func stripHTML(_ input: String) -> String {
        guard let regex = htmlTagRegex else { return input }
        let range = NSRange(location: 0, length: (input as NSString).length)
        var result = regex.stringByReplacingMatches(in: input, range: range, withTemplate: "")
        // Decode common HTML entities
        result = result
            .replacingOccurrences(of: "&amp;", with: "&")
            .replacingOccurrences(of: "&lt;", with: "<")
            .replacingOccurrences(of: "&gt;", with: ">")
            .replacingOccurrences(of: "&quot;", with: "\"")
            .replacingOccurrences(of: "&#39;", with: "'")
            .replacingOccurrences(of: "&nbsp;", with: " ")
        return result
    }
}
