import SwiftUI

// MARK: - Diff Viewer Overlay

struct DiffViewerOverlay: View {
    let fileChange: FileChange
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Header
            DiffViewerHeader(
                fileChange: fileChange,
                onClose: onClose
            )

            // Divider
            Rectangle()
                .fill(Color.white.opacity(0.063))
                .frame(height: 1)

            // Body: Diff lines
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(fileChange.lines) { line in
                        DiffLineRow(line: line)
                    }
                }
            }
        }
        .background(PixelTheme.bgSidebar)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.082), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.5), radius: 24, x: 0, y: 12)
    }
}

// MARK: - Diff Viewer Header

private struct DiffViewerHeader: View {
    let fileChange: FileChange
    let onClose: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // File type badge
            Text(fileChange.fileExtension.uppercased())
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundStyle(PixelTheme.accentOrange)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(PixelTheme.accentOrange.opacity(0.18))
                .clipShape(RoundedRectangle(cornerRadius: 6))

            // Filename + path
            VStack(alignment: .leading, spacing: 1) {
                Text(fileChange.fileName)
                    .font(.jetBrainsMono(14, weight: .bold))
                    .foregroundStyle(PixelTheme.textPrimary)
                Text(fileChange.fileDirectory)
                    .font(.jetBrainsMono(10, weight: .regular))
                    .foregroundStyle(PixelTheme.textMuted)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }

            Spacer()

            // Stats
            HStack(spacing: 8) {
                Text("+\(fileChange.linesAdded)")
                    .font(.jetBrainsMono(12, weight: .semibold))
                    .foregroundStyle(PixelTheme.green)
                Text("-\(fileChange.linesRemoved)")
                    .font(.jetBrainsMono(12, weight: .semibold))
                    .foregroundStyle(PixelTheme.red)
            }

            // Agent badge
            Text(fileChange.agentName)
                .font(.inter(10, weight: .medium))
                .foregroundStyle(PixelTheme.textSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color.white.opacity(0.06))
                .clipShape(Capsule())

            // Close button
            Button(action: onClose) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(PixelTheme.textMuted)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 20)
        .background(PixelTheme.bgSurface)
    }
}

// MARK: - Diff Line Row

private struct DiffLineRow: View {
    let line: DiffLine

    private var backgroundColor: Color {
        switch line.type {
        case .added: PixelTheme.green.opacity(0.031)
        case .removed: PixelTheme.red.opacity(0.031)
        case .hunkHeader: PixelTheme.blue.opacity(0.063)
        case .context: .clear
        }
    }

    private var textColor: Color {
        switch line.type {
        case .added: PixelTheme.green.opacity(0.8)
        case .removed: PixelTheme.red.opacity(0.8)
        case .hunkHeader: PixelTheme.blue
        case .context: PixelTheme.textSecondary
        }
    }

    private var lineNumberColor: Color {
        switch line.type {
        case .added: PixelTheme.green.opacity(0.376)
        case .removed: PixelTheme.red.opacity(0.376)
        case .hunkHeader: .clear
        case .context: PixelTheme.textMuted
        }
    }

    private var prefix: String {
        switch line.type {
        case .added: "+"
        case .removed: "-"
        case .hunkHeader: ""
        case .context: " "
        }
    }

    var body: some View {
        HStack(spacing: 0) {
            // Line number
            Text(line.lineNumber.map { String($0) } ?? "")
                .font(.jetBrainsMono(11, weight: .regular))
                .foregroundStyle(lineNumberColor)
                .frame(width: 44, alignment: .trailing)
                .padding(.trailing, 4)

            // Prefix (+/-/space)
            Text(prefix)
                .font(.jetBrainsMono(11, weight: .regular))
                .foregroundStyle(textColor)
                .frame(width: 16, alignment: .center)

            // Content
            Text(line.content)
                .font(.jetBrainsMono(11, weight: .regular))
                .foregroundStyle(textColor)
                .lineLimit(1)

            Spacer(minLength: 0)
        }
        .padding(.vertical, 1)
        .background(backgroundColor)
    }
}
