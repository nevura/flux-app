import Foundation
import Supabase

@MainActor
final class InsightsViewModel: ObservableObject {
    @Published var transactions: [FluxTransaction] = []
    @Published var isLoading = false
    @Published var currentMonth: Int
    @Published var currentYear: Int

    init() {
        let now = Date()
        currentMonth = Calendar.current.component(.month, from: now)
        currentYear  = Calendar.current.component(.year,  from: now)
    }

    var monthTitle: String {
        var comps = DateComponents()
        comps.year = currentYear; comps.month = currentMonth; comps.day = 1
        guard let d = Calendar.current.date(from: comps) else { return "" }
        let f = DateFormatter(); f.dateFormat = "MMMM yyyy"; f.locale = Locale(identifier: "es_MX")
        return f.string(from: d).capitalized
    }

    var isCurrentMonth: Bool {
        let now = Date()
        return currentMonth == Calendar.current.component(.month, from: now)
            && currentYear  == Calendar.current.component(.year,  from: now)
    }

    var incomeTotal: Double {
        transactions.filter { $0.isIncome }.reduce(0) { $0 + $1.amount * $1.exchangeRate }
    }

    var expenseTotal: Double {
        transactions.filter { $0.isExpense }.reduce(0) { $0 + $1.amount * $1.exchangeRate }
    }

    var netBalance: Double { incomeTotal - expenseTotal }

    // Spending by category — only gastos
    var categoryBreakdown: [(id: String, name: String, colorHex: String, amount: Double, percent: Double)] {
        let expenses = transactions.filter { $0.isExpense }
        let total = expenses.reduce(0.0) { $0 + $1.amount * $1.exchangeRate }
        guard total > 0 else { return [] }

        var grouped: [String: Double] = [:]
        for tx in expenses {
            let key = tx.categoryId ?? "CAT-DEF-OTHER"
            grouped[key, default: 0] += tx.amount * tx.exchangeRate
        }

        return grouped
            .map { (id: $0.key, amount: $0.value) }
            .sorted { $0.amount > $1.amount }
            .map { entry in
                let meta = categoryMeta(for: entry.id)
                return (
                    id: entry.id,
                    name: meta?.name ?? entry.id,
                    colorHex: meta?.colorHex ?? "#64748b",
                    amount: entry.amount,
                    percent: entry.amount / total
                )
            }
    }

    func prevMonth() {
        var comps = DateComponents()
        comps.year = currentYear; comps.month = currentMonth - 1; comps.day = 1
        if let d = Calendar.current.date(from: comps) {
            currentMonth = Calendar.current.component(.month, from: d)
            currentYear  = Calendar.current.component(.year,  from: d)
        }
    }

    func nextMonth() {
        guard !isCurrentMonth else { return }
        var comps = DateComponents()
        comps.year = currentYear; comps.month = currentMonth + 1; comps.day = 1
        if let d = Calendar.current.date(from: comps) {
            currentMonth = Calendar.current.component(.month, from: d)
            currentYear  = Calendar.current.component(.year,  from: d)
        }
    }

    func load(userId: UUID) async {
        isLoading = true
        var comps = DateComponents()
        comps.year = currentYear; comps.month = currentMonth; comps.day = 1
        let start = Calendar.current.date(from: comps) ?? Date()
        guard let end = Calendar.current.date(byAdding: DateComponents(month: 1, day: -1), to: start) else {
            isLoading = false; return
        }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withFullDate, .withDashSeparatorInDate]
        do {
            transactions = try await supabase
                .from("transactions")
                .select()
                .eq("user_id", value: userId)
                .gte("transaction_date", value: iso.string(from: start))
                .lte("transaction_date", value: iso.string(from: end))
                .execute()
                .value
        } catch {}
        isLoading = false
    }
}
