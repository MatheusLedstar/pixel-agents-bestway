import SwiftUI

// MARK: - Team Chat Room

struct TeamChatRoom: View {
    let messages: [InboxMessage]
    let tasks: [AgentTask]
    let telemetry: TeamTelemetry
    let teamName: String
    let onlineCount: Int
    @Binding var isMaximized: Bool
    @State private var showCTOSummary = false
    @State private var summaryService = CTOSummaryService()

    private var visibleMessages: [InboxMessage] {
        messages.filter { !$0.isProtocolMessage }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Team Chat Room")
                    .font(.inter(14, weight: .semibold))
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
}

// MARK: - CTO Summary Sheet

struct CTOSummarySheet: View {
    let service: CTOSummaryService
    let teamName: String
    @Binding var isPresented: Bool

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

                // Copy button
                if !service.summary.isEmpty {
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
                        if let attributed = try? AttributedString(
                            markdown: service.summary,
                            options: .init(interpretedSyntax: .full)
                        ) {
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
    }
}

// MARK: - Chat Bubble

// MARK: - Summary Loading Animation

struct SummaryLoadingAnimation: View {
    @State private var rotation: Double = 0
    @State private var pulse: Bool = false
    @State private var dotIndex: Int = 0

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
            Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { _ in
                withAnimation(.easeInOut(duration: 0.3)) {
                    dotIndex += 1
                }
            }
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
                        .font(.jetBrainsMono(10, weight: .bold))
                        .foregroundStyle(agentColor)

                    if let to = message.to {
                        Image(systemName: "arrow.right")
                            .font(.system(size: 7))
                            .foregroundStyle(PixelTheme.textMuted)
                        Text(to)
                            .font(.jetBrainsMono(10, weight: .medium))
                            .foregroundStyle(PixelTheme.textMuted)
                    }

                    Spacer()

                    Text(Self.timeFormatter.string(from: message.timestamp))
                        .font(.jetBrainsMono(8, weight: .regular))
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
                        .font(.inter(11, weight: .regular))
                        .foregroundStyle(PixelTheme.textSecondary)
                        .lineSpacing(2.4)
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
