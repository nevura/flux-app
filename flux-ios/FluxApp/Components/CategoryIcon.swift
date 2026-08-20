import SwiftUI

struct CategoryIcon: View {
    let iconId: String?
    let colorId: String?
    var size: CGFloat = 36

    private var symbol: String { sfSymbol(for: iconId) }
    private var color: Color { Color(hex: colorHex(for: colorId)) }

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.15))
                .frame(width: size, height: size)
            Image(systemName: symbol)
                .font(.system(size: size * 0.4))
                .foregroundStyle(color)
        }
    }
}

struct CategoryIconForId: View {
    let categoryId: String?
    var size: CGFloat = 36

    private var meta: CategoryMeta? { categoryMeta(for: categoryId) }

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: meta?.colorHex ?? "#94a3b8").opacity(0.15))
                .frame(width: size, height: size)
            Image(systemName: meta?.sfSymbol ?? "questionmark.circle")
                .font(.system(size: size * 0.4))
                .foregroundStyle(Color(hex: meta?.colorHex ?? "#94a3b8"))
        }
    }
}
