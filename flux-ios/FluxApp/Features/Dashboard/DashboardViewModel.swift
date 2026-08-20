import Foundation
import Supabase

@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var accounts: [AccountBalance] = []
    @Published var budget: Budget? = nil
    @Published var monthTransactions: [FluxTransaction] = []
    @Published var upcomingScheduled: [ScheduledTransaction] = []
    @Published var isLoading = false
    @Published var error: String?

    var totalBalance: Double {
        accounts.reduce(0) { $0 + ($1.balance * $1.displayExchangeRate) }
    }

    var monthlySpend: Double {
        monthTransactions
            .filter { $0.type == "TR-GASTO" && $0.excludeFromBudget != true }
            .reduce(0) { $0 + ($1.amount * $1.exchangeRate) }
    }

    func spendFor(date: Date) -> Double {
        let cal = Calendar.current
        return monthTransactions
            .filter { $0.type == "TR-GASTO" && cal.isDate($0.transactionDate, inSameDayAs: date) }
            .reduce(0) { $0 + ($1.amount * $1.exchangeRate) }
    }

    func spendForWeek(startingFrom date: Date) -> Double {
        let cal = Calendar.current
        guard let end = cal.date(byAdding: .day, value: 6, to: date) else { return 0 }
        return monthTransactions
            .filter { $0.type == "TR-GASTO"
                && $0.transactionDate >= date
                && $0.transactionDate <= end }
            .reduce(0) { $0 + ($1.amount * $1.exchangeRate) }
    }

    func load(userId: UUID) async {
        isLoading = true
        error = nil
        let now = Date()
        let cal = Calendar.current
        let month = cal.component(.month, from: now)
        let year  = cal.component(.year,  from: now)

        async let accountsTask  = loadAccounts(userId: userId)
        async let budgetTask    = loadBudget(userId: userId, month: month, year: year)
        async let txTask        = loadMonthTransactions(userId: userId, month: month, year: year)
        async let schedTask     = loadUpcomingScheduled(userId: userId)

        let (accs, bgt, txs, sched) = await (accountsTask, budgetTask, txTask, schedTask)
        accounts           = accs
        budget             = bgt
        monthTransactions  = txs
        upcomingScheduled  = sched
        isLoading          = false
    }

    // MARK: - Private Loaders

    private func loadAccounts(userId: UUID) async -> [AccountBalance] {
        do {
            let result: [AccountBalance] = try await supabase
                .from("account_balances")
                .select()
                .eq("user_id", value: userId)
                .eq("is_active", value: true)
                .order("sort_order", ascending: true)
                .execute()
                .value
            FluxIntentService.cacheAccounts(result.map {
                FluxAccountEntity(id: $0.id, name: $0.name, currency: $0.currency)
            })
            return result
        } catch { return [] }
    }

    private func loadBudget(userId: UUID, month: Int, year: Int) async -> Budget? {
        do {
            let results: [Budget] = try await supabase
                .from("budgets")
                .select()
                .eq("user_id", value: userId)
                .eq("month", value: month)
                .eq("year", value: year)
                .limit(1)
                .execute()
                .value
            return results.first
        } catch { return nil }
    }

    private func loadMonthTransactions(userId: UUID, month: Int, year: Int) async -> [FluxTransaction] {
        do {
            var comps = DateComponents()
            comps.year = year; comps.month = month; comps.day = 1
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
        } catch { return [] }
    }

    var upcomingIncomeTotal: Double {
        upcomingScheduled.filter { $0.type == "TR-INGRESO" }.reduce(0) { $0 + $1.amount }
    }
    var upcomingExpenseTotal: Double {
        upcomingScheduled.filter { $0.type == "TR-GASTO" }.reduce(0) { $0 + $1.amount }
    }

    private func loadUpcomingScheduled(userId: UUID) async -> [ScheduledTransaction] {
        do {
            return try await supabase
                .from("scheduled_transactions")
                .select()
                .eq("user_id", value: userId)
                .eq("status", value: "ACTIVO")
                .order("next_charge_date", ascending: true)
                .limit(5)
                .execute()
                .value
        } catch { return [] }
    }
}
