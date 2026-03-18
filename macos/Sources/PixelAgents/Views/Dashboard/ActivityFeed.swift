import SwiftUI

// MARK: - Activity Feed

struct ActivityFeed: View {
    let entries: [SessionEntry]
    let messages: [InboxMessage]

    @State private var feedItems: [FeedItem] = []

    private func computeFeedItems() -> [FeedItem] {
        var items: [FeedItem] = []

        // Add session entries
        for entry in entries.suffix(100) {
            items.append(FeedItem(
                id: entry.id,
                timestamp: entry.timestamp,
                agentName: entry.agentName ?? "system",
                actionType: actionType(from: entry),
                message: feedMessage(from: entry)
            ))
        }

        // Add messages as feed items (filter out internal protocol messages)
        for msg in messages where !msg.isProtocolMessage {
            items.append(FeedItem(
                id: msg.id,
                timestamp: msg.timestamp,
                agentName: msg.from,
                actionType: .messaging,
                message: msg.summary ?? msg.displayContent
            ))
        }

        return items.sorted { $0.timestamp < $1.timestamp }.suffix(100).map { $0 }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack(spacing: 8) {
                Text("Activity Feed")
                    .font(.inter(14, weight: .semibold))
                    .foregroundStyle(PixelTheme.textPrimary)

                // LIVE badge
                HStack(spacing: 4) {
                    Circle()
                        .fill(PixelTheme.green)
                        .frame(width: 6, height: 6)
                    Text("LIVE")
                        .font(.inter(9, weight: .bold))
                        .foregroundStyle(PixelTheme.green)
                }
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(PixelTheme.green.opacity(0.12))
                .clipShape(Capsule())

                Spacer()
            }

            // Feed list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 2) {
                        ForEach(Array(feedItems.enumerated()), id: \.element.id) { index, item in
                            ActivityRow(item: item, isAlternate: index.isMultiple(of: 2))
                                .id(item.id)
                        }
                    }
                }
                .onChange(of: feedItems.count) { _, _ in
                    if let lastId = feedItems.last?.id {
                        withAnimation(.easeOut(duration: 0.2)) {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }
            .background(Color.white.opacity(0.016))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .onAppear { feedItems = computeFeedItems() }
        .onChange(of: entries.count) { _, _ in feedItems = computeFeedItems() }
        .onChange(of: messages.count) { _, _ in feedItems = computeFeedItems() }
    }

    // MARK: - Helpers

    private func actionType(from entry: SessionEntry) -> ActivityType {
        switch entry.type {
        case .toolUse:
            guard let tool = entry.toolName?.lowercased() else { return .thinking }
            switch tool {
            case "read", "glob", "grep": return .reading
            case "write", "edit": return .writing
            default: return .thinking
            }
        case .text: return .thinking
        case .error: return .error
        case .toolResult, .unknown: return .idle
        }
    }

    private func feedMessage(from entry: SessionEntry) -> String {
        if let tool = entry.toolName, let file = entry.filePath {
            let fileName = URL(fileURLWithPath: file).lastPathComponent
            return "\(tool) \(fileName)"
        }
        if let content = entry.content {
            return String(content.prefix(80))
        }
        return entry.type.rawValue
    }
}

// MARK: - Feed Item

private struct FeedItem: Identifiable, Equatable {
    let id: String
    let timestamp: Date
    let agentName: String
    let actionType: ActivityType
    let message: String
}

// MARK: - Activity Row

private struct ActivityRow: View {
    let item: FeedItem
    let isAlternate: Bool

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f
    }()

    private var badgeColor: Color {
        switch item.actionType {
        case .writing: return PixelTheme.green
        case .thinking: return PixelTheme.yellow
        case .reading: return PixelTheme.blue
        case .messaging: return PixelTheme.purple
        case .searching: return PixelTheme.blue
        case .testing: return PixelTheme.yellow
        case .running: return PixelTheme.green
        case .deploying: return PixelTheme.accentOrange
        case .debugging: return PixelTheme.red
        case .done: return PixelTheme.green
        case .error: return PixelTheme.red
        case .idle: return Color.white.opacity(0.38)
        }
    }

    private var badgeText: String {
        switch item.actionType {
        case .writing: return "WRITE"
        case .thinking: return "THINK"
        case .reading: return "READ"
        case .messaging: return "MSG"
        case .searching: return "SEARCH"
        case .testing: return "TEST"
        case .running: return "RUN"
        case .deploying: return "DEPLOY"
        case .debugging: return "DEBUG"
        case .done: return "DONE"
        case .error: return "ERROR"
        case .idle: return "IDLE"
        }
    }

    var body: some View {
        HStack(spacing: 10) {
            // Timestamp
            Text(Self.timeFormatter.string(from: item.timestamp))
                .font(.jetBrainsMono(9, weight: .regular))
                .foregroundStyle(PixelTheme.textMuted)
                .frame(width: 52, alignment: .leading)

            // Action badge
            Text(badgeText)
                .font(.jetBrainsMono(8, weight: .bold))
                .foregroundStyle(badgeColor)
                .padding(.vertical, 2)
                .padding(.horizontal, 6)
                .background(badgeColor.opacity(0.18))
                .clipShape(RoundedRectangle(cornerRadius: 4))
                .frame(width: 52)

            // Agent name
            Text(item.agentName)
                .font(.jetBrainsMono(10, weight: .semibold))
                .foregroundStyle(PixelTheme.accentOrange)
                .frame(width: 90, alignment: .leading)
                .lineLimit(1)

            // Message
            Text(item.message)
                .font(.inter(10, weight: .regular))
                .foregroundStyle(PixelTheme.textSecondary)
                .lineLimit(1)

            Spacer()
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(isAlternate ? Color.white.opacity(0.012) : Color.clear)
    }
}
