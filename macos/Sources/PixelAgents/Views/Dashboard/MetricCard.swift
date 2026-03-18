import SwiftUI

struct MetricCard: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.jetBrainsMono(21, weight: .bold))
                .foregroundStyle(color)
            Text(label)
                .font(.inter(12, weight: .medium))
                .foregroundStyle(PixelTheme.textMuted)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 16)
        .background(PixelTheme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
