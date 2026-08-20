import Foundation
import Supabase

@MainActor
final class TransactionsViewModel: ObservableObject {
    @Published var transactions: [FluxTransaction] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchQuery = ""
    @Published var selectedTypes: Set<String> = []
    @Published var accounts: [AccountBalance] = []
    @Published var categories: [FluxCategory] = []

    // Month navigation
    @Published var currentMonth: Int
    @Published var currentYear: Int

    init() {
        let now = Date()
        currentMonth = Calendar.current.component(.month, from: now)
        currentYear  = Calendar.current.component(.year,  from: now)
    }

    // MARK: - Computed

    var isCurrentMonth: Bool {
        let now = Date()
        return currentMonth == Calendar.current.component(.month, from: now)
            && currentYear  == Calendar.current.component(.year,  from: now)
    }

    var monthTitle: String {
        var comps = DateComponents()
        comps.year = currentYear; comps.month = currentMonth; comps.day = 1
        guard let d = Calendar.current.date(from: comps) else { return "" }
        let f = DateFormatter(); f.dateFormat = "MMMM yyyy"; f.locale = Locale(identifier: "es_MX")
        return f.string(from: d).capitalized
    }

    var filtered: [FluxTransaction] {
        var result = transactions
        if !searchQuery.isEmpty {
            result = result.filter { $0.concept.localizedCaseInsensitiveContains(searchQuery) }
        }
        if !selectedTypes.isEmpty {
            result = result.filter { selectedTypes.contains($0.type) }
        }
        return result
    }

    var transactionsByDay: [(date: Date, items: [FluxTransaction])] {
        let cal = Calendar.current
        var groups: [Date: [FluxTransaction]] = [:]
        for tx in filtered {
            let day = cal.startOfDay(for: tx.transactionDate)
            groups[day, default: []].append(tx)
        }
        return groups.sorted { $0.key > $1.key }.map { (date: $0.key, items: $0.value) }
    }

    var incomeTotal: Double { filtered.filter { $0.isIncome  }.reduce(0) { $0 + $1.amount * $1.exchangeRate } }
    var expenseTotal: Double { filtered.filter { $0.isExpense }.reduce(0) { $0 + $1.amount * $1.exchangeRate } }

    // MARK: - Navigation

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

    func toggleType(_ type: String) {
        if selectedTypes.contains(type) { selectedTypes.remove(type) }
        else { selectedTypes.insert(type) }
    }

    // MARK: - Load

    func load(userId: UUID) async {
        isLoading = true
        error = nil
        async let txTask   = loadTransactions(userId: userId)
        async let accsTask = loadAccounts(userId: userId)
        async let catsTask = loadCategories(userId: userId)
        let (txs, accs, cats) = await (txTask, accsTask, catsTask)
        transactions = txs
        accounts     = accs
        categories   = cats
        isLoading    = false
    }

    private func loadTransactions(userId: UUID) async -> [FluxTransaction] {
        do {
            var comps = DateComponents()
            comps.year = currentYear; comps.month = currentMonth; comps.day = 1
            let start = Calendar.current.date(from: comps) ?? Date()
            guard let end = Calendar.current.date(byAdding: DateComponents(month: 1, day: -1), to: start) else { return [] }
            let iso = ISO8601DateFormatter()
            iso.formatOptions = [.withFullDate, .withDashSeparatorInDate]
            return try await supabase
                .from("transactions")
                .select()
                .eq("user_id", value: userId)
                .gte("transaction_date", value: iso.string(from: start))
                .lte("transaction_date", value: iso.string(from: end))
                .order("transaction_date", ascending: false)
                .execute()
                .value
        } catch {
            self.error = error.localizedDescription
            return []
        }
    }

    private func loadCategories(userId: UUID) async -> [FluxCategory] {
        do {
            let result: [FluxCategory] = try await supabase
                .from("categories")
                .select()
                .or("user_id.is.null,user_id.eq.\(userId)")
                .execute()
                .value
            FluxIntentService.cacheCategories(result.map {
                FluxCategoryEntity(id: $0.id, name: $0.name, iconId: $0.iconId)
            })
            return result
        } catch { return [] }
    }

    private func loadAccounts(userId: UUID) async -> [AccountBalance] {
        do {
            return try await supabase
                .from("account_balances")
                .select()
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .order("sort_order", ascending: true)
                .execute()
                .value
        } catch { return [] }
    }

    func delete(_ tx: FluxTransaction) async {
        do {
            try await supabase.from("transactions").delete().eq("id", value: tx.id).execute()
            transactions.removeAll { $0.id == tx.id }
        } catch { self.error = error.localizedDescription }
    }

    func confirm(_ tx: FluxTransaction) async {
        do {
            struct Patch: Encodable { let isValidated: Bool }
            try await supabase.from("transactions")
                .update(Patch(isValidated: true))
                .eq("id", value: tx.id)
                .execute()
            if let i = transactions.firstIndex(where: { $0.id == tx.id }) {
                let old = transactions[i]
                transactions[i] = FluxTransaction(
                    id: old.id, userId: old.userId, concept: old.concept, type: old.type,
                    amount: old.amount, adjustment: old.adjustment, categoryId: old.categoryId,
                    accountId: old.accountId, transactionDate: old.transactionDate,
                    isValidated: true, currency: old.currency, exchangeRate: old.exchangeRate,
                    notes: old.notes, source: old.source, excludeFromBudget: old.excludeFromBudget,
                    isReceivable: old.isReceivable, isPayable: old.isPayable, createdAt: old.createdAt
                )
            }
        } catch { self.error = error.localizedDescription }
    }

    func categoryName(for id: String?) -> String? {
        guard let id else { return nil }
        if let local = DEFAULT_CATEGORIES.first(where: { $0.id == id }) { return local.name }
        return categories.first(where: { $0.id == id })?.name
    }

    func accountName(for id: String?) -> String? {
        guard let id else { return nil }
        return accounts.first(where: { $0.id == id })?.name
    }
}
