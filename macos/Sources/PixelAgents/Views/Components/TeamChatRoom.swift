import SwiftUI

// MARK: - Team Chat Room

struct TeamChatRoom: View {
    let messages: [InboxMessage]
    let onlineCount: Int
    @Binding var isMaximized: Bool

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
