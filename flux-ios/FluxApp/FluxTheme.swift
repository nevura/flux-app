import SwiftUI

// MARK: - Adaptive color tokens (mirrors globals.css)

struct FluxColors {
    let isDark: Bool

    init(_ scheme: ColorScheme) { isDark = scheme == .dark }

    // Backgrounds — 4 elevation layers
    var bg: Color        { isDark ? Color(hex: "#020617") : .white }
    var bgCard: Color    { isDark ? Color(hex: "#0F172A") : Color(hex: "#EFEFEF") }
    var bgElevated: Color { isDark ? Color(hex: "#1C1C1E") : Color(hex: "#EFEFEF") }
    var bgInput: Color   { isDark ? Color.white.opacity(0.07) : Color.black.opacity(0.06) }

    // Text hierarchy
    var text: Color  { isDark ? .white : Color(hex: "#1C1C1E") }
    var text2: Color { isDark ? Color.white.opacity(0.65) : Color(hex: "#6D6D72") }
    var text3: Color { isDark ? Color.white.opacity(0.40) : Color(hex: "#8E8E93") }
    var text4: Color { isDark ? Color.white.opacity(0.20) : Color(hex: "#AEAEB2") }

    // Borders
    var line: Color      { isDark ? Color.white.opacity(0.08) : Color.black.opacity(0.08) }
    var lineStrong: Color { isDark ? Color.white.opacity(0.15) : Color.black.opacity(0.14) }

    // Semantic text colors (vary in light mode)
    var incomeText: Color   { isDark ? FluxTheme.income   : Color(hex: "#00AD40") }
    var expenseText: Color  { isDark ? FluxTheme.expense  : Color(hex: "#FF004F") }
    var transferText: Color { isDark ? FluxTheme.transfer : FluxTheme.accent }

    // Semantic backgrounds
    var incomeBg: Color  { FluxTheme.income.opacity(isDark ? 0.08 : 0.10) }
    var expenseBg: Color { FluxTheme.expense.opacity(isDark ? 0.08 : 0.08) }
    var accentBg: Color  { FluxTheme.accent.opacity(0.10) }
}

// MARK: - Fixed brand tokens

enum FluxTheme {
    static let accent   = Color(hex: "#007AFF")
    static let income   = Color(hex: "#30D158")
    static let expense  = Color(hex: "#FF453A")
    static let transfer = Color(hex: "#64D2FF")
    static let warning  = Color(hex: "#FF9500")
    static let pending  = Color(hex: "#FF9F0A")
    static let cash     = Color(hex: "#00AD40")
    static let debit    = Color(hex: "#007AFF")
    static let credit   = Color(hex: "#FF8A80")

    static func accountColor(paymentMethodId: String) -> Color {
        switch paymentMethodId {
        case "MP-EFECTIVO": return cash
        case "MP-TDD":      return debit
        case "MP-TDC":      return credit
        default:            return accent
        }
    }

    static func accountShadowColor(paymentMethodId: String) -> Color {
        switch paymentMethodId {
        case "MP-EFECTIVO": return cash.opacity(0.25)
        case "MP-TDD":      return accent.opacity(0.35)
        case "MP-TDC":      return credit.opacity(0.25)
        default:            return accent.opacity(0.20)
        }
    }

    static func paymentMethodIcon(paymentMethodId: String) -> String {
        switch paymentMethodId {
        case "MP-EFECTIVO": return "banknote"
        case "MP-TDD":      return "creditcard"
        case "MP-TDC":      return "creditcard.fill"
        default:            return "creditcard"
        }
    }

    // Amount color helper
    static func amountColor(type: String, colorScheme: ColorScheme) -> Color {
        let c = FluxColors(colorScheme)
        switch type {
        case "TR-INGRESO":  return c.incomeText
        case "TR-GASTO":    return c.expenseText
        default:            return c.transferText
        }
    }
}

// MARK: - Press scale button style

struct ScaleButtonStyle: ButtonStyle {
    var scale: Double = 0.90
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Section header helper

struct FluxSectionHeader: View {
    let title: String
    @Environment(\.colorScheme) private var colorScheme
    var body: some View {
        Text(title)
            .font(.system(size: 12, weight: .black))
            .tracking(3)
            .foregroundStyle(FluxColors(colorScheme).text3)
    }
}
