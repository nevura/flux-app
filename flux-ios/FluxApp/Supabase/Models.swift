import Foundation
import SwiftUI

// MARK: - Database Models

struct FluxTransaction: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let concept: String
    let type: String
    let amount: Double
    let adjustment: Double
    var categoryId: String?
    var accountId: String?
    let transactionDate: Date
    var isValidated: Bool
    var currency: String
    var exchangeRate: Double
    var notes: String?
    var source: String?
    var excludeFromBudget: Bool?
    var isReceivable: Bool?
    var isPayable: Bool?
    let createdAt: Date?

    var isExpense: Bool { type == "TR-GASTO" }
    var isIncome: Bool { type == "TR-INGRESO" }
    var isTransfer: Bool { type == "TR-TRANSFER" }
}

struct AccountBalance: Codable, Identifiable {
    let id: String
    let userId: UUID
    let name: String
    let paymentMethodId: String
    var colorId: String
    var paymentDay: Int?
    var isActive: Bool
    var sortOrder: Int
    let balance: Double
    var creditLimit: Double?
    var currency: String
    var displayExchangeRate: Double

    // account_balances view returns "account_id" → camelCase → "accountId"
    enum CodingKeys: String, CodingKey {
        case id = "accountId"
        case userId, name, paymentMethodId, colorId, paymentDay
        case isActive, sortOrder, balance, creditLimit
        case currency, displayExchangeRate
    }
}

struct FluxCategory: Codable, Identifiable {
    let id: String
    var name: String
    var iconId: String
    var colorId: String
    var userId: UUID?
    var isDefault: Bool?
    var sortOrder: Int?
}

struct FluxProfile: Codable, Identifiable {
    let id: UUID
    var fullName: String?
    var email: String?
    var username: String?
    var subscriptionStatus: String?
    var trialEndsAt: Date?
    var currency: String?
}

// MARK: - Insert Payloads (no id/userId, set by server)

struct NewTransaction: Encodable {
    let userId: UUID
    let concept: String
    let type: String
    let amount: Double
    let adjustment: Double
    let categoryId: String?
    let accountId: String?
    let transactionDate: String
    let isValidated: Bool
    let currency: String
    let exchangeRate: Double
    let notes: String?
}

// Transfer insert payload — carries explicit id so both rows share the same UUID
struct NewTransferRow: Encodable {
    let id: UUID
    let userId: UUID
    let concept: String
    let type: String
    let amount: Double
    let adjustment: Double
    let accountId: String?
    let transactionDate: String
    let isValidated: Bool
    let currency: String
    let exchangeRate: Double
    let notes: String?
}

struct FluxPerson: Codable, Identifiable {
    let id: String
    let userId: UUID
    var name: String
    var phone: String?
    var isMe: Bool
    var linkedUserId: UUID?
}

struct Budget: Codable, Identifiable {
    let id: UUID
    var userId: UUID
    var month: Int
    var year: Int
    var amount: Double
    var currency: String
}

struct ScheduledTransaction: Codable, Identifiable {
    let id: UUID
    var name: String
    var type: String
    var amount: Double
    var categoryId: String?
    var accountId: String
    var status: String
    var nextChargeDate: String?
    var currency: String?
    var originalCurrency: String?
}

// MARK: - Static Data (mirrors flux-web/lib/constants.ts)

struct CategoryMeta {
    let id: String
    let name: String
    let sfSymbol: String
    let colorHex: String
}

let DEFAULT_CATEGORIES: [CategoryMeta] = [
    CategoryMeta(id: "CAT-DEF-FOOD", name: "Alimentos y bebidas", sfSymbol: "fork.knife", colorHex: "#f59e0b"),
    CategoryMeta(id: "CAT-DEF-SHOP", name: "Compras", sfSymbol: "bag", colorHex: "#8b5cf6"),
    CategoryMeta(id: "CAT-DEF-ENT", name: "Entretenimiento", sfSymbol: "ticket", colorHex: "#ec4899"),
    CategoryMeta(id: "CAT-DEF-GAS", name: "Gasolina", sfSymbol: "fuelpump", colorHex: "#f97316"),
    CategoryMeta(id: "CAT-DEF-HOME", name: "Hogar", sfSymbol: "house", colorHex: "#14b8a6"),
    CategoryMeta(id: "CAT-DEF-SAL", name: "Salud", sfSymbol: "heart", colorHex: "#ef4444"),
    CategoryMeta(id: "CAT-DEF-SERV", name: "Servicios", sfSymbol: "bolt", colorHex: "#eab308"),
    CategoryMeta(id: "CAT-DEF-REC", name: "Recurrente", sfSymbol: "arrow.clockwise", colorHex: "#6366f1"),
    CategoryMeta(id: "CAT-DEF-TRANS", name: "Transporte", sfSymbol: "bus", colorHex: "#0ea5e9"),
    CategoryMeta(id: "CAT-DEF-INV", name: "Inversiones", sfSymbol: "chart.line.uptrend.xyaxis", colorHex: "#10b981"),
    CategoryMeta(id: "CAT-DEF-HON", name: "Honorarios", sfSymbol: "briefcase", colorHex: "#3b82f6"),
    CategoryMeta(id: "CAT-DEF-AMOR", name: "Amor", sfSymbol: "heart.fill", colorHex: "#f43f5e"),
    CategoryMeta(id: "CAT-DEF-VENT", name: "Ventas y Negocios", sfSymbol: "dollarsign.arrow.circlepath", colorHex: "#22c55e"),
    CategoryMeta(id: "CAT-DEF-EST", name: "Estacionamiento", sfSymbol: "parkingsign", colorHex: "#64748b"),
    CategoryMeta(id: "CAT-DEF-OTHER", name: "Otro", sfSymbol: "questionmark.circle", colorHex: "#94a3b8"),
    CategoryMeta(id: "CAT-APPLE", name: "Apple Pay", sfSymbol: "apple.logo", colorHex: "#000000"),
    CategoryMeta(id: "CAT-AUDIT", name: "Ajuste", sfSymbol: "magnifyingglass.circle", colorHex: "#475569"),
]

let ICON_ID_TO_SYMBOL: [String: String] = [
    "IC-001": "fork.knife",
    "IC-002": "bag",
    "IC-003": "ticket",
    "IC-004": "parkingsign",
    "IC-005": "fuelpump",
    "IC-006": "briefcase",
    "IC-007": "chart.line.uptrend.xyaxis",
    "IC-008": "building.2",
    "IC-009": "shuffle",
    "IC-010": "arrow.clockwise",
    "IC-011": "heart",
    "IC-012": "bolt",
    "IC-013": "dollarsign.arrow.circlepath",
    "IC-014": "hand.raised",
    "IC-015": "house",
    "IC-016": "pawprint",
    "IC-017": "graduationcap",
    "IC-018": "airplane",
    "IC-019": "gift",
    "IC-020": "scissors",
    "IC-021": "dumbbell",
    "IC-022": "bus",
    "IC-023": "heart.fill",
    "IC-024": "chart.pie",
    "IC-025": "drop",
    "IC-026": "wrench.and.screwdriver",
    "IC-027": "music.note",
    "IC-APPLE": "apple.logo",
    "IC-028": "gamecontroller",
    "IC-029": "tv",
    "IC-030": "chess.icon",
    "IC-031": "gamecontroller.fill",
    "IC-032": "cup.and.saucer",
    "IC-033": "tshirt",
    "IC-035": "pill",
    "IC-036": "stethoscope",
    "IC-038": "motorcycle",
    "IC-039": "airplane.departure",
    "IC-041": "wifi",
    "IC-042": "laptopcomputer",
    "IC-043": "iphone",
    "IC-044": "sofa",
    "IC-045": "bed.double",
    "IC-046": "stroller",
    "IC-047": "broom",
    "IC-048": "paintbrush",
    "IC-049": "hammer",
    "IC-050": "wineglass",
    "IC-051": "book",
    "IC-052": "mug",
    "IC-053": "cart",
    "IC-054": "diamond",
    "IC-055": "snowflake",
    "IC-056": "car",
    "IC-AUDIT": "magnifyingglass.circle",
]

let COLOR_ID_TO_HEX: [String: String] = [
    "COL-01": "#3b82f6",
    "COL-02": "#10b981",
    "COL-03": "#f59e0b",
    "COL-04": "#ef4444",
    "COL-05": "#8b5cf6",
    "COL-06": "#ec4899",
    "COL-07": "#14b8a6",
    "COL-08": "#f97316",
    "COL-09": "#6366f1",
    "COL-10": "#22c55e",
    "COL-11": "#eab308",
    "COL-12": "#0ea5e9",
    "COL-13": "#f43f5e",
    "COL-14": "#64748b",
    "COL-15": "#94a3b8",
    "COL-16": "#a855f7",
    "COL-17": "#06b6d4",
    "COL-18": "#84cc16",
    "COL-19": "#d97706",
    "COL-20": "#dc2626",
    "COL-21": "#7c3aed",
    "COL-22": "#db2777",
    "COL-23": "#0f766e",
    "COL-24": "#c2410c",
    "COL-25": "#4f46e5",
    "COL-26": "#15803d",
    "COL-27": "#ca8a04",
    "COL-28": "#b91c1c",
    "COL-29": "#475569",
    "COL-30": "#1e293b",
]

// MARK: - Helpers

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (1, 1, 0)
        }
        self.init(red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
}

func categoryMeta(for id: String?) -> CategoryMeta? {
    guard let id else { return nil }
    return DEFAULT_CATEGORIES.first { $0.id == id }
}

func sfSymbol(for iconId: String?) -> String {
    guard let iconId else { return "questionmark.circle" }
    return ICON_ID_TO_SYMBOL[iconId] ?? "questionmark.circle"
}

func colorHex(for colorId: String?) -> String {
    guard let colorId else { return "#94a3b8" }
    return COLOR_ID_TO_HEX[colorId] ?? "#94a3b8"
}

func adjustmentFor(type: String, amount: Double) -> Double {
    switch type {
    case "TR-GASTO": return -abs(amount)
    case "TR-INGRESO": return abs(amount)
    default: return 0
    }
}

// MARK: - Currency Formatting

func formatCurrency(_ amount: Double, currency: String = "MXN") -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = currency
    formatter.maximumFractionDigits = 2
    formatter.minimumFractionDigits = 2
    return formatter.string(from: NSNumber(value: amount)) ?? "\(currency) \(amount)"
}
